import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useEffect, useState } from "react";
import { ContractContent } from "@/components/contract/ContractContent";
import { ContractSignatures } from "@/components/contract/ContractSignatures";
import { ContractHeader } from "@/components/contract/ContractHeader";
import { ContractError } from "@/components/contract/ContractError";
import { useContractPrint } from "@/components/contract/ContractPrintPreview";
import { ContractPreviewDialog } from "@/components/contract/ContractPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import type { FormData, Asset } from "@/types/contract";
import { Json } from "@/integrations/supabase/types/json";

const queryClient = new QueryClient();

const defaultFormData: FormData = {
  contractNumber: '',
  contractDate: '',
  ownerName: '',
  ownerReg: '',
  ownerFiscal: '',
  ownerAddress: '',
  ownerBank: '',
  ownerBankName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerCounty: '',
  ownerCity: '',
  ownerRepresentative: '',
  tenantName: '',
  tenantReg: '',
  tenantFiscal: '',
  tenantAddress: '',
  tenantBank: '',
  tenantBankName: '',
  tenantEmail: '',
  tenantPhone: '',
  tenantCounty: '',
  tenantCity: '',
  tenantRepresentative: '',
  propertyAddress: '',
  rentAmount: '',
  vatIncluded: '',
  contractDuration: '',
  paymentDay: '',
  roomCount: '',
  startDate: '',
  lateFee: '',
  renewalPeriod: '',
  unilateralNotice: '',
  terminationNotice: '',
  earlyTerminationFee: '',
  latePaymentTermination: '',
  securityDeposit: '',
  depositReturnPeriod: '',
  waterColdMeter: '',
  waterHotMeter: '',
  electricityMeter: '',
  gasMeter: '',
  ownerSignatureDate: '',
  ownerSignatureName: '',
  tenantSignatureDate: '',
  tenantSignatureName: '',
  assets: []
};

interface Contract {
  id: string;
  properties?: { name: string };
  contract_type: string;
  tenant_id?: string | null;
  landlord_id?: string | null;
  status: 'draft' | 'pending_signature' | 'signed' | 'expired' | 'cancelled';
  valid_from: string | null;
  valid_until: string | null;
  metadata: FormData;
}

function ContractDetailsContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invitation_token');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const { toast } = useToast();

  const { handlePrint } = useContractPrint({
    queryClient,
    metadata: formData,
    contractId: id || '',
    contractNumber: formData.contractNumber
  });

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) {
        console.error('No contract ID provided');
        throw new Error('Contract ID is required');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        throw new Error('Authentication required');
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', session.user.id)
        .single();
      
      console.log('User profile:', userProfile);
      
      const [contractResponse, signaturesResponse] = await Promise.all([
        supabase
          .from('contracts')
          .select('*, properties(name)')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', id)
      ]);

      if (contractResponse.error) {
        console.error('Contract fetch error:', contractResponse.error);
        throw contractResponse.error;
      }
      
      if (!contractResponse.data) {
        console.error('Contract not found:', { id });
        throw new Error('Contract not found');
      }

      const hasPermission = 
        contractResponse.data.tenant_id === session.user.id || 
        contractResponse.data.landlord_id === session.user.id ||
        (contractResponse.data.status === 'pending_signature' && 
         contractResponse.data.invitation_email === userProfile?.email);

      console.log('Permission check:', {
        userId: session.user.id,
        tenantId: contractResponse.data.tenant_id,
        landlordId: contractResponse.data.landlord_id,
        hasPermission,
        status: contractResponse.data.status,
        invitationEmail: contractResponse.data.invitation_email,
        userEmail: userProfile?.email
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to view this contract');
      }

      const metadata = contractResponse.data.metadata as unknown as { [key: string]: string | Asset[] };
      const signatures = signaturesResponse.data || [];
      
      const tenantSignature = signatures.find(s => s.signer_role === 'tenant');
      const ownerSignature = signatures.find(s => s.signer_role === 'landlord');

      const typedMetadata: FormData = {
        ...defaultFormData,
        ...(metadata as any),
        tenantSignatureName: tenantSignature?.signature_data || metadata.tenantSignatureName || '',
        tenantSignatureImage: tenantSignature?.signature_image || metadata.tenantSignatureImage || '',
        tenantSignatureDate: tenantSignature?.signed_at?.split('T')[0] || metadata.tenantSignatureDate || '',
        ownerSignatureName: ownerSignature?.signature_data || metadata.ownerSignatureName || '',
        ownerSignatureImage: ownerSignature?.signature_image || metadata.ownerSignatureImage || '',
        ownerSignatureDate: ownerSignature?.signed_at?.split('T')[0] || metadata.ownerSignatureDate || ''
      };
      
      console.log('Mapped signatures:', { 
        tenantSignature, 
        ownerSignature,
        typedMetadata
      });
      
      setFormData(typedMetadata);

      return {
        ...contractResponse.data,
        metadata: typedMetadata,
      } as Contract;
    },
    retry: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth check result:', { 
          hasSession: !!session, 
          hasToken: !!token,
          contractId: id
        });
        
        if (!session) {
          if (token) {
            navigate(`/tenant-registration/${id}?invitation_token=${token}`);
          } else {
            navigate('/auth');
          }
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [token, id, navigate]);

  const updateContractMutation = useMutation({
    mutationFn: async (updatedData: FormData) => {
      if (!id) throw new Error('Contract ID is required');
      
      const jsonMetadata: Json = {};
      Object.entries(updatedData).forEach(([key, value]) => {
        jsonMetadata[key] = value;
      });
      
      const { error } = await supabase
        .from('contracts')
        .update({ 
          metadata: jsonMetadata,
          status: 'signed' as const 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contract signed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setIsEditing(false);
      navigate('/documents');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to sign contract",
        variant: "destructive",
      });
      console.error('Update error:', error);
    }
  });

  const inviteTenantMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!id) throw new Error('Contract ID is required');

      const { error } = await supabase.functions.invoke('send-contract-invitation', {
        body: {
          contractId: id,
          email: email,
          name: formData.tenantName,
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent to tenant",
      });
      supabase
        .from('contracts')
        .update({ status: 'pending_signature' as const })
        .eq('id', id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['contract', id] });
        });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
      console.error('Invitation error:', error);
    }
  });

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateContractMutation.mutate(formData);
  };

  const handleInviteTenant = (email: string) => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please fill in the tenant's email address",
        variant: "destructive",
      });
      return;
    }
    inviteTenantMutation.mutate(email);
  };

  const handleEmail = async () => {
    if (!id) {
      console.error('No contract ID provided');
      return;
    }

    console.log('Initiating contract send process...');

    try {
      const { error } = await supabase.functions.invoke('send-contract', {
        body: { contractId: id }
      });

      if (error) {
        console.error('Error sending contract:', error);
        toast({
          title: "Error",
          description: "Failed to send contract. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Contract sent successfully');
      toast({
        title: "Success",
        description: "Contract sent successfully",
      });

    } catch (err) {
      console.error('Unexpected error sending contract:', err);
      toast({
        title: "Error",
        description: "Failed to send contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    console.error('Rendering error state:', error);
    return <ContractError showDashboard={showDashboard} error={error} onBack={() => navigate('/documents')} />;
  }

  if (!contract) {
    console.error('No contract data available');
    return <ContractError showDashboard={showDashboard} error={new Error('Contract not found')} onBack={() => navigate('/documents')} />;
  }

  const canSign = contract.tenant_id === contract.tenant_id && contract.status === 'pending_signature';
  const canEdit = contract.status === 'draft';

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <div className="print:hidden">
        <DashboardSidebar />
      </div>
      <main className="flex-1 p-8 pt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <ContractHeader
            onBack={() => navigate('/documents')}
            onPreview={() => setIsPreviewModalOpen(true)}
            onPrint={() => contract && handlePrint()}
            onEmail={handleEmail}
            canEdit={canEdit}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onInviteTenant={handleInviteTenant}
            contractStatus={contract?.status || 'draft'}
            formData={formData}
            showActions={true}
          />

          <ContractContent 
            formData={formData} 
            isEditing={isEditing} 
            onFieldChange={handleFieldChange}
            readOnly={!canEdit}
          />
          
          <ContractSignatures 
            formData={formData} 
            contractId={id!} 
            canSign={canSign}
            onFieldChange={handleFieldChange}
            readOnly={!canSign && !canEdit}
          />

          <ContractPreviewDialog
            isOpen={isPreviewModalOpen}
            onOpenChange={setIsPreviewModalOpen}
            metadata={formData}
            contractId={id!}
          />
        </div>
      </main>
    </div>
  );
}

export default function ContractDetails() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContractDetailsContent />
    </QueryClientProvider>
  );
}
