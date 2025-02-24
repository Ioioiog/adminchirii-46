
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
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';
  valid_from: string | null;
  valid_until: string | null;
  metadata: FormData;
}

function ContractDetailsContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
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
      if (!id) throw new Error('Contract ID is required');
      
      let query = supabase
        .from('contracts')
        .select('*, properties(name)')
        .eq('id', id);

      if (token) {
        query = query.eq('invitation_token', token);
        setShowDashboard(false);
      }

      const { data: contractData, error: contractError } = await query.single();

      if (contractError) throw contractError;
      if (!contractData) throw new Error('Contract not found');

      // For token access, verify it's in a signable state
      if (token && !['pending', 'pending_signature'].includes(contractData.status)) {
        throw new Error('This contract is no longer available for signing');
      }

      const metadata = contractData.metadata as unknown as { [key: string]: string | Asset[] };
      const typedMetadata: FormData = {
        contractNumber: metadata.contractNumber as string || '',
        contractDate: metadata.contractDate as string || '',
        ownerName: metadata.ownerName as string || '',
        ownerReg: metadata.ownerReg as string || '',
        ownerFiscal: metadata.ownerFiscal as string || '',
        ownerAddress: metadata.ownerAddress as string || '',
        ownerBank: metadata.ownerBank as string || '',
        ownerBankName: metadata.ownerBankName as string || '',
        ownerEmail: metadata.ownerEmail as string || '',
        ownerPhone: metadata.ownerPhone as string || '',
        ownerCounty: metadata.ownerCounty as string || '',
        ownerCity: metadata.ownerCity as string || '',
        ownerRepresentative: metadata.ownerRepresentative as string || '',
        tenantName: metadata.tenantName as string || '',
        tenantReg: metadata.tenantReg as string || '',
        tenantFiscal: metadata.tenantFiscal as string || '',
        tenantAddress: metadata.tenantAddress as string || '',
        tenantBank: metadata.tenantBank as string || '',
        tenantBankName: metadata.tenantBankName as string || '',
        tenantEmail: metadata.tenantEmail as string || '',
        tenantPhone: metadata.tenantPhone as string || '',
        tenantCounty: metadata.tenantCounty as string || '',
        tenantCity: metadata.tenantCity as string || '',
        tenantRepresentative: metadata.tenantRepresentative as string || '',
        propertyAddress: metadata.propertyAddress as string || '',
        rentAmount: metadata.rentAmount as string || '',
        vatIncluded: metadata.vatIncluded as string || '',
        contractDuration: metadata.contractDuration as string || '',
        paymentDay: metadata.paymentDay as string || '',
        roomCount: metadata.roomCount as string || '',
        startDate: metadata.startDate as string || '',
        lateFee: metadata.lateFee as string || '',
        renewalPeriod: metadata.renewalPeriod as string || '',
        unilateralNotice: metadata.unilateralNotice as string || '',
        terminationNotice: metadata.terminationNotice as string || '',
        earlyTerminationFee: metadata.earlyTerminationFee as string || '',
        latePaymentTermination: metadata.latePaymentTermination as string || '',
        securityDeposit: metadata.securityDeposit as string || '',
        depositReturnPeriod: metadata.depositReturnPeriod as string || '',
        waterColdMeter: metadata.waterColdMeter as string || '',
        waterHotMeter: metadata.waterHotMeter as string || '',
        electricityMeter: metadata.electricityMeter as string || '',
        gasMeter: metadata.gasMeter as string || '',
        ownerSignatureDate: metadata.ownerSignatureDate as string || '',
        ownerSignatureName: metadata.ownerSignatureName as string || '',
        ownerSignatureImage: metadata.ownerSignatureImage as string || undefined,
        tenantSignatureDate: metadata.tenantSignatureDate as string || '',
        tenantSignatureName: metadata.tenantSignatureName as string || '',
        tenantSignatureImage: metadata.tenantSignatureImage as string || undefined,
        assets: (metadata.assets || []) as Asset[],
      };
      
      setFormData(typedMetadata);

      return {
        ...contractData,
        metadata: typedMetadata,
      } as Contract;
    }
  });

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
          status: token ? 'signed' : 'draft' // Update status to signed if accessed via token
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: token ? "Contract signed successfully" : "Contract updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setIsEditing(false);
      
      // If signed via token, show completion message and redirect
      if (token) {
        toast({
          title: "Thank you!",
          description: "The contract has been signed successfully. You can now close this window.",
        });
        // Optionally redirect to a completion page
        // navigate('/contract-signed');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: token ? "Failed to sign contract" : "Failed to update contract",
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
        .update({ status: 'pending_signature' })
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
    console.log("Attempting to invite tenant", { 
      email: email,
      contractStatus: contract?.status 
    });
    
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && token) {
        navigate(`/tenant-registration?token=${token}&contractId=${id}`);
      }
    };

    checkAuth();
  }, [token, id, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ContractError showDashboard={showDashboard} error={error} onBack={() => navigate('/documents')} />;
  if (!contract) return <div>Contract not found</div>;

  const canEdit = contract.status === 'draft' || (!!token && contract.status === 'pending_signature');

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      {showDashboard && (
        <div className="print:hidden">
          <DashboardSidebar />
        </div>
      )}
      <main className="flex-1 p-8 pt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <ContractHeader
            onBack={() => navigate('/documents')}
            onPreview={() => setIsPreviewModalOpen(true)}
            onPrint={() => contract && handlePrint()}
            onEmail={() => {}}
            canEdit={canEdit}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onInviteTenant={handleInviteTenant}
            contractStatus={contract?.status || 'draft'}
            formData={formData}
            showActions={!token}
          />

          <ContractContent 
            formData={formData} 
            isEditing={isEditing} 
            onFieldChange={handleFieldChange}
            readOnly={!!token && !canEdit}
          />
          
          <ContractSignatures 
            formData={formData} 
            contractId={id!} 
            canSign={!!token}
            onFieldChange={handleFieldChange}
            readOnly={!canEdit}
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
