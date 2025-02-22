import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Mail, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types/json";
import { ContractContent } from "@/components/contract/ContractContent";
import { ContractSignatures } from "@/components/contract/ContractSignatures";
import { FormData } from "@/types/contract";
import { useState } from "react";
import { useTenants } from "@/hooks/useTenants";
import { useUserRole } from "@/hooks/use-user-role";
import { ContractModals } from "@/components/contract/ContractModals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as ReactDOMServer from 'react-dom/server';

type ContractStatus = 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled';

interface Contract {
  id: string;
  properties?: { name: string };
  contract_type: string;
  status: ContractStatus;
  valid_from: string | null;
  valid_until: string | null;
  metadata: Json;
}

interface ContractResponse extends Omit<Contract, 'metadata'> {
  metadata: FormData;
}

export default function ContractDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailOption, setSelectedEmailOption] = useState<string>('tenant');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedTenantEmail, setSelectedTenantEmail] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editedData, setEditedData] = useState<FormData | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const { userRole } = useUserRole();
  const { data: tenants = [] } = useTenants();

  const updateContractMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!id) throw new Error('Contract ID is required');
      
      const jsonMetadata: { [key: string]: Json } = {
        contractNumber: formData.contractNumber,
        contractDate: formData.contractDate,
        ownerName: formData.ownerName,
        ownerReg: formData.ownerReg,
        ownerFiscal: formData.ownerFiscal,
        ownerAddress: formData.ownerAddress,
        ownerBank: formData.ownerBank,
        ownerBankName: formData.ownerBankName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        ownerCounty: formData.ownerCounty,
        ownerCity: formData.ownerCity,
        ownerRepresentative: formData.ownerRepresentative,
        tenantName: formData.tenantName,
        tenantReg: formData.tenantReg,
        tenantFiscal: formData.tenantFiscal,
        tenantAddress: formData.tenantAddress,
        tenantBank: formData.tenantBank,
        tenantBankName: formData.tenantBankName,
        tenantEmail: formData.tenantEmail,
        tenantPhone: formData.tenantPhone,
        tenantCounty: formData.tenantCounty,
        tenantCity: formData.tenantCity,
        tenantRepresentative: formData.tenantRepresentative,
        propertyAddress: formData.propertyAddress,
        rentAmount: formData.rentAmount,
        vatIncluded: formData.vatIncluded,
        contractDuration: formData.contractDuration,
        paymentDay: formData.paymentDay,
        roomCount: formData.roomCount,
        startDate: formData.startDate,
        lateFee: formData.lateFee,
        renewalPeriod: formData.renewalPeriod,
        unilateralNotice: formData.unilateralNotice,
        terminationNotice: formData.terminationNotice,
        earlyTerminationFee: formData.earlyTerminationFee,
        latePaymentTermination: formData.latePaymentTermination,
        securityDeposit: formData.securityDeposit,
        depositReturnPeriod: formData.depositReturnPeriod,
        waterColdMeter: formData.waterColdMeter,
        waterHotMeter: formData.waterHotMeter,
        electricityMeter: formData.electricityMeter,
        gasMeter: formData.gasMeter,
        ownerSignatureDate: formData.ownerSignatureDate,
        ownerSignatureName: formData.ownerSignatureName,
        ownerSignatureImage: formData.ownerSignatureImage,
        tenantSignatureDate: formData.tenantSignatureDate,
        tenantSignatureName: formData.tenantSignatureName,
        tenantSignatureImage: formData.tenantSignatureImage,
        assets: formData.assets
      };
      
      const { error } = await supabase
        .from('contracts')
        .update({ metadata: jsonMetadata })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      toast({
        title: "Success",
        description: "Contract updated successfully",
      });
      setEditedData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contract",
        variant: "destructive",
      });
    }
  });

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) throw new Error('Contract ID is required');

      console.log('Fetching contract with ID:', id);

      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*, properties(name)')
        .eq('id', id)
        .single();

      if (contractError) {
        console.error('Error fetching contract:', contractError);
        throw contractError;
      }

      if (!contractData) {
        console.error('No contract found with ID:', id);
        throw new Error('Contract not found');
      }

      console.log('Contract data fetched:', contractData);

      const { data: signatures, error: signaturesError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', id);

      if (signaturesError) {
        console.error('Error fetching signatures:', signaturesError);
        throw signaturesError;
      }

      console.log('Signatures fetched:', signatures);

      const metadataObj = contractData.metadata as Record<string, any> || {};

      if (signatures) {
        const uniqueSignatures = signatures.reduce((acc, curr) => {
          acc[curr.signer_role] = curr;
          return acc;
        }, {} as Record<string, any>);

        if (uniqueSignatures['landlord']) {
          metadataObj.ownerSignatureImage = uniqueSignatures['landlord'].signature_image;
          metadataObj.ownerSignatureName = uniqueSignatures['landlord'].signature_data;
          metadataObj.ownerSignatureDate = uniqueSignatures['landlord'].signed_at?.split('T')[0];
        }
        if (uniqueSignatures['tenant']) {
          metadataObj.tenantSignatureImage = uniqueSignatures['tenant'].signature_image;
          metadataObj.tenantSignatureName = uniqueSignatures['tenant'].signature_data;
          metadataObj.tenantSignatureDate = uniqueSignatures['tenant'].signed_at?.split('T')[0];
        }
      }

      const transformedMetadata: FormData = {
        contractNumber: String(metadataObj.contractNumber || ''),
        contractDate: String(metadataObj.contractDate || ''),
        ownerName: String(metadataObj.ownerName || ''),
        ownerReg: String(metadataObj.ownerReg || ''),
        ownerFiscal: String(metadataObj.ownerFiscal || ''),
        ownerAddress: String(metadataObj.ownerAddress || ''),
        ownerBank: String(metadataObj.ownerBank || ''),
        ownerBankName: String(metadataObj.ownerBankName || ''),
        ownerEmail: String(metadataObj.ownerEmail || ''),
        ownerPhone: String(metadataObj.ownerPhone || ''),
        ownerCounty: String(metadataObj.ownerCounty || ''),
        ownerCity: String(metadataObj.ownerCity || ''),
        ownerRepresentative: String(metadataObj.ownerRepresentative || ''),
        tenantName: String(metadataObj.tenantName || ''),
        tenantReg: String(metadataObj.tenantReg || ''),
        tenantFiscal: String(metadataObj.tenantFiscal || ''),
        tenantAddress: String(metadataObj.tenantAddress || ''),
        tenantBank: String(metadataObj.tenantBank || ''),
        tenantBankName: String(metadataObj.tenantBankName || ''),
        tenantEmail: String(metadataObj.tenantEmail || ''),
        tenantPhone: String(metadataObj.tenantPhone || ''),
        tenantCounty: String(metadataObj.tenantCounty || ''),
        tenantCity: String(metadataObj.tenantCity || ''),
        tenantRepresentative: String(metadataObj.tenantRepresentative || ''),
        propertyAddress: String(metadataObj.propertyAddress || ''),
        rentAmount: String(metadataObj.rentAmount || ''),
        vatIncluded: String(metadataObj.vatIncluded || ''),
        contractDuration: String(metadataObj.contractDuration || ''),
        paymentDay: String(metadataObj.paymentDay || ''),
        roomCount: String(metadataObj.roomCount || ''),
        startDate: String(metadataObj.startDate || ''),
        lateFee: String(metadataObj.lateFee || ''),
        renewalPeriod: String(metadataObj.renewalPeriod || ''),
        unilateralNotice: String(metadataObj.unilateralNotice || ''),
        terminationNotice: String(metadataObj.terminationNotice || ''),
        earlyTerminationFee: String(metadataObj.earlyTerminationFee || ''),
        latePaymentTermination: String(metadataObj.latePaymentTermination || ''),
        securityDeposit: String(metadataObj.securityDeposit || ''),
        depositReturnPeriod: String(metadataObj.depositReturnPeriod || ''),
        waterColdMeter: String(metadataObj.waterColdMeter || ''),
        waterHotMeter: String(metadataObj.waterHotMeter || ''),
        electricityMeter: String(metadataObj.electricityMeter || ''),
        gasMeter: String(metadataObj.gasMeter || ''),
        ownerSignatureDate: String(metadataObj.ownerSignatureDate || ''),
        ownerSignatureName: String(metadataObj.ownerSignatureName || ''),
        ownerSignatureImage: metadataObj.ownerSignatureImage || '',
        tenantSignatureDate: String(metadataObj.tenantSignatureDate || ''),
        tenantSignatureName: metadataObj.tenantSignatureName || '',
        tenantSignatureImage: metadataObj.tenantSignatureImage || '',
        assets: Array.isArray(metadataObj.assets) ? metadataObj.assets : []
      };

      return {
        ...contractData,
        metadata: transformedMetadata
      } as ContractResponse;
    },
    retry: false
  });

  if (error) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <div className="print:hidden">
          <DashboardSidebar />
        </div>
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/documents')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold">Error Loading Contract</h1>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-red-500">
                  {error instanceof Error ? error.message : 'Failed to load contract details'}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (!editedData) {
      const initialFormData: FormData = {
        contractNumber: contract?.metadata.contractNumber || '',
        contractDate: contract?.metadata.contractDate || '',
        ownerName: contract?.metadata.ownerName || '',
        ownerReg: contract?.metadata.ownerReg || '',
        ownerFiscal: contract?.metadata.ownerFiscal || '',
        ownerAddress: contract?.metadata.ownerAddress || '',
        ownerBank: contract?.metadata.ownerBank || '',
        ownerBankName: contract?.metadata.ownerBankName || '',
        ownerEmail: contract?.metadata.ownerEmail || '',
        ownerPhone: contract?.metadata.ownerPhone || '',
        ownerCounty: contract?.metadata.ownerCounty || '',
        ownerCity: contract?.metadata.ownerCity || '',
        ownerRepresentative: contract?.metadata.ownerRepresentative || '',
        tenantName: contract?.metadata.tenantName || '',
        tenantReg: contract?.metadata.tenantReg || '',
        tenantFiscal: contract?.metadata.tenantFiscal || '',
        tenantAddress: contract?.metadata.tenantAddress || '',
        tenantBank: contract?.metadata.tenantBank || '',
        tenantBankName: contract?.metadata.tenantBankName || '',
        tenantEmail: contract?.metadata.tenantEmail || '',
        tenantPhone: contract?.metadata.tenantPhone || '',
        tenantCounty: contract?.metadata.tenantCounty || '',
        tenantCity: contract?.metadata.tenantCity || '',
        tenantRepresentative: contract?.metadata.tenantRepresentative || '',
        propertyAddress: contract?.metadata.propertyAddress || '',
        rentAmount: contract?.metadata.rentAmount || '',
        vatIncluded: contract?.metadata.vatIncluded || '',
        contractDuration: contract?.metadata.contractDuration || '',
        paymentDay: contract?.metadata.paymentDay || '',
        roomCount: contract?.metadata.roomCount || '',
        startDate: contract?.metadata.startDate || '',
        lateFee: contract?.metadata.lateFee || '',
        renewalPeriod: contract?.metadata.renewalPeriod || '',
        unilateralNotice: contract?.metadata.unilateralNotice || '',
        terminationNotice: contract?.metadata.terminationNotice || '',
        earlyTerminationFee: contract?.metadata.earlyTerminationFee || '',
        latePaymentTermination: contract?.metadata.latePaymentTermination || '',
        securityDeposit: contract?.metadata.securityDeposit || '',
        depositReturnPeriod: contract?.metadata.depositReturnPeriod || '',
        waterColdMeter: contract?.metadata.waterColdMeter || '',
        waterHotMeter: contract?.metadata.waterHotMeter || '',
        electricityMeter: contract?.metadata.electricityMeter || '',
        gasMeter: contract?.metadata.gasMeter || '',
        ownerSignatureDate: contract?.metadata.ownerSignatureDate || '',
        ownerSignatureName: contract?.metadata.ownerSignatureName || '',
        tenantSignatureDate: contract?.metadata.tenantSignatureDate || '',
        tenantSignatureName: contract?.metadata.tenantSignatureName || '',
        assets: contract?.metadata.assets || []
      };
      setEditedData(initialFormData);
    }
    setEditedData(prev => {
      if (!prev) return {} as FormData;
      return { ...prev, [field]: value };
    });
  };

  const handleUpdateContract = () => {
    if (!editedData) {
      console.log('No changes to save');
      return;
    }
    console.log('Saving changes:', editedData);
    updateContractMutation.mutate(editedData);
  };

  const handleEditContract = () => {
    navigate(`/documents/contracts/${id}/edit`);
  };

  const handleViewContract = () => {
    setIsPreviewModalOpen(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }

    const printStyles = `
      <style>
        @media print {
          @page { 
            size: A4;
            margin: 20mm;
          }
          body { 
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #000;
          }
          .text-black { color: #000; }
          .text-2xl { font-size: 1.5rem; }
          .text-lg { font-size: 1.125rem; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .mb-8 { margin-bottom: 2rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .text-center { text-align: center; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-4 { gap: 1rem; }
          .w-full { width: 100%; }
          .border-collapse { border-collapse: collapse; }
          .border { border: 1px solid #000; }
          .border-gray-400 { border-color: #9ca3af; }
          .px-4 { padding-left: 1rem; padding-right: 1rem; }
          .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
          img {
            max-width: 150px;
            height: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
          }
          th, td {
            border: 1px solid #000;
            padding: 0.5rem;
            text-align: left;
          }
        }
      </style>
    `;

    const contractContent = <ContractContent formData={metadata} />;
    const contractSignatures = <ContractSignatures formData={metadata} contractId={id!} />;
    
    const contentHtml = ReactDOMServer.renderToString(
      <>
        {contractContent}
        {contractSignatures}
      </>
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contract de Închiriere - ${metadata.contractNumber}</title>
          ${printStyles}
        </head>
        <body>
          <div class="contract-preview">
            ${contentHtml}
          </div>
          <script>
            Promise.all(
              Array.from(document.images)
                .filter(img => !img.complete)
                .map(img => new Promise(resolve => {
                  img.onload = img.onerror = resolve;
                }))
            ).then(() => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSendContract = () => {
    setIsEmailModalOpen(true);
  };

  const handleEmailSubmit = async () => {
    try {
      let emailToSend = '';

      switch (selectedEmailOption) {
        case 'tenant':
          emailToSend = metadata.tenantEmail || '';
          break;
        case 'tenant-list':
          emailToSend = selectedTenantEmail;
          break;
        case 'custom':
          emailToSend = customEmail;
          break;
        default:
          throw new Error('Invalid email option selected');
      }

      if (!emailToSend) {
        throw new Error('No email address provided');
      }

      const contractElement = document.querySelector('.print\\:block');
      if (!contractElement) {
        throw new Error('Could not find contract content');
      }

      console.log('Sending contract to:', emailToSend);
      
      const { error: emailError } = await supabase.functions.invoke('send-contract', {
        body: {
          recipientEmail: emailToSend,
          contractData: {
            contractNumber: metadata.contractNumber,
            tenantName: metadata.tenantName,
            ownerName: metadata.ownerName,
            propertyAddress: String(metadata.propertyAddress || ''),
            contractContent: contractElement.innerHTML,
          },
        },
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        throw new Error(emailError.message || 'Failed to send email');
      }

      console.log('Contract sent successfully');

      toast({
        title: "Success",
        description: `Contract sent to ${emailToSend}`,
      });

      setIsEmailModalOpen(false);
      
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'pending' as ContractStatus })
        .eq('id', id);

      if (updateError) {
        console.error('Status update error:', updateError);
        throw updateError;
      }

    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send the contract. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInviteTenant = async () => {
    if (!contract || !inviteEmail) return;

    try {
      const { error } = await supabase.functions.invoke('send-contract-invitation', {
        body: {
          contractId: id,
          tenantEmail: inviteEmail,
          contractNumber: contract.metadata.contractNumber,
          ownerName: contract.metadata.ownerName,
          propertyAddress: contract.metadata.propertyAddress,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });

      setIsInviteModalOpen(false);
      setInviteEmail("");
      
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const renderInviteButton = () => {
    if (userRole !== 'landlord' || contract?.metadata.tenantSignatureName) return null;
    
    return (
      <Button
        onClick={() => setIsInviteModalOpen(true)}
        className="flex items-center gap-2"
      >
        <Mail className="h-4 w-4" />
        Invite Tenant to Sign
      </Button>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!contract) {
    return <div>Contract not found</div>;
  }

  const metadata = editedData || contract.metadata;

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <div className="print:hidden">
        <DashboardSidebar />
      </div>
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/documents')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Contract Details</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {renderInviteButton()}
              <Button
                variant="outline"
                onClick={handleViewContract}
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-none bg-white rounded-lg">
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Contract Number</Label>
                  <Input 
                    value={metadata.contractNumber || ''} 
                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-2">
                    <Badge variant="secondary" className={
                      contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                      contract.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {contract.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valid From</Label>
                  <Input value={contract.valid_from ? format(new Date(contract.valid_from), 'PPP') : 'Not specified'} readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valid Until</Label>
                  <Input value={contract.valid_until ? format(new Date(contract.valid_until), 'PPP') : 'Not specified'} readOnly className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none bg-white rounded-lg">
            <CardHeader>
              <CardTitle>Landlord Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(metadata)
                  .filter(([key]) => key.startsWith('owner'))
                  .map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-sm font-medium text-gray-500">
                        {key.replace('owner', '').replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Input 
                        value={value || ''} 
                        onChange={(e) => handleInputChange(key as keyof FormData, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {Object.entries(metadata)
                .filter(([key]) => key.startsWith('tenant'))
                .map(([key, value]) => (
                  <div key={key}>
                    <Label>{key.replace('tenant', '').replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Input 
                      value={value || ''} 
                      onChange={(e) => handleInputChange(key as keyof FormData, e.target.value)}
                    />
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contract Terms</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property</Label>
                <Input value={contract.properties?.name || 'Untitled Property'} readOnly />
              </div>
              <div>
                <Label>Contract Type</Label>
                <Input value={contract.contract_type} className="capitalize" readOnly />
              </div>
              <div>
                <Label>Rent Amount</Label>
                <Input 
                  value={metadata.rentAmount || ''} 
                  onChange={(e) => handleInputChange('rentAmount', e.target.value)}
                />
              </div>
              <div>
                <Label>Contract Duration (months)</Label>
                <Input 
                  value={metadata.contractDuration || ''} 
                  onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Day</Label>
                <Input 
                  value={metadata.paymentDay || ''} 
                  onChange={(e) => handleInputChange('paymentDay', e.target.value)}
                />
              </div>
              <div>
                <Label>Late Fee</Label>
                <Input 
                  value={metadata.lateFee || ''} 
                  onChange={(e) => handleInputChange('lateFee', e.target.value)}
                />
              </div>
              <div>
                <Label>Security Deposit</Label>
                <Input 
                  value={metadata.securityDeposit || ''} 
                  onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ContractModals
        isPreviewModalOpen={isPreviewModalOpen}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        metadata={metadata}
        contractId={id!}
      />
    </div>
  );
}
