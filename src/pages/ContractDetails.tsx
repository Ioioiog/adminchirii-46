import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Send, Save, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types/json";
import { ContractContent } from "@/components/contract/ContractContent";
import { ContractSignatures } from "@/components/contract/ContractSignatures";
import { FormData } from "@/types/contract";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { useTenants } from "@/hooks/useTenants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserRole } from "@/hooks/use-user-role";

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

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, properties(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const metadataObj = data.metadata as Record<string, any> || {};
      
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
        tenantSignatureDate: String(metadataObj.tenantSignatureDate || ''),
        tenantSignatureName: String(metadataObj.tenantSignatureName || ''),
        assets: Array.isArray(metadataObj.assets) ? metadataObj.assets : []
      };

      return {
        ...data,
        metadata: transformedMetadata
      } as ContractResponse;
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async (updatedData: FormData) => {
      const jsonData: Json = Object.entries(updatedData).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
          acc[key] = value;
        } else {
          acc[key] = String(value || '');
        }
        return acc;
      }, {} as { [key: string]: string | string[] });

      console.log('Saving contract with data:', jsonData);

      const { error } = await supabase
        .from('contracts')
        .update({
          metadata: jsonData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      toast({
        title: "Success",
        description: "Contract has been updated successfully",
      });
      setEditedData(null);
    },
    onError: (error) => {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive",
      });
    },
  });

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

  const handlePrintContract = () => {
    window.print();
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

  const renderInviteModal = () => (
    <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Tenant to Sign Contract</DialogTitle>
          <DialogDescription>
            Send an invitation email to the tenant to review and sign this contract.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Tenant Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tenant@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInviteTenant}>
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
          <div className="flex items-center gap-4 mb-6 print:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/documents')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Contract Details</h1>
            
            <div className="flex items-center gap-2 ml-auto">
              {renderInviteButton()}
              <Button
                variant="outline"
                onClick={handleViewContract}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintContract}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              {editedData && (
                <Button
                  onClick={handleUpdateContract}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  Save Modifications
                </Button>
              )}
              <Button
                onClick={handleSendContract}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                Send Contract
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)] print:hidden">
            <div className="space-y-6 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contract Number</Label>
                    <Input 
                      value={metadata.contractNumber || ''} 
                      onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
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
                  <div>
                    <Label>Valid From</Label>
                    <Input value={contract.valid_from ? format(new Date(contract.valid_from), 'PPP') : 'Not specified'} readOnly />
                  </div>
                  <div>
                    <Label>Valid Until</Label>
                    <Input value={contract.valid_until ? format(new Date(contract.valid_until), 'PPP') : 'Not specified'} readOnly />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Landlord Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {Object.entries(metadata)
                    .filter(([key]) => key.startsWith('owner'))
                    .map(([key, value]) => (
                      <div key={key}>
                        <Label>{key.replace('owner', '').replace(/([A-Z])/g, ' $1').trim()}</Label>
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
          </ScrollArea>

          <div className="hidden print:block">
            <ContractContent formData={metadata} />
            <ContractSignatures formData={metadata} contractId={id || ''} />
          </div>

          <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Contract</DialogTitle>
                <DialogDescription>
                  Choose where to send the contract
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <RadioGroup
                  value={selectedEmailOption}
                  onValueChange={(value) => {
                    setSelectedEmailOption(value);
                    if (value !== 'tenant-list') {
                      setSelectedTenantEmail('');
                    }
                  }}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant" id="tenant" />
                    <Label htmlFor="tenant">
                      Contract Tenant ({metadata.tenantEmail || 'Not provided'})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tenant-list" id="tenant-list" />
                    <Label htmlFor="tenant-list">Select from Tenant List</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Custom Email</Label>
                  </div>
                </RadioGroup>

                {selectedEmailOption === 'tenant-list' && (
                  <div className="space-y-2">
                    <Label>Select Tenant</Label>
                    <Select
                      value={selectedTenantEmail}
                      onValueChange={setSelectedTenantEmail}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem 
                            key={tenant.id} 
                            value={tenant.email || ''}
                          >
                            {tenant.first_name} {tenant.last_name} ({tenant.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedEmailOption === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customEmail">Custom Email Address</Label>
                    <Input
                      id="customEmail"
                      type="email"
                      placeholder="Enter email address"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEmailSubmit}>
                    Send Contract
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Contract Preview</DialogTitle>
                <DialogDescription>
                  Preview and share the contract
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-4">
                  <RadioGroup
                    value={selectedEmailOption}
                    onValueChange={(value) => {
                      setSelectedEmailOption(value);
                      if (value !== 'tenant-list') {
                        setSelectedTenantEmail('');
                      }
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tenant" id="preview-tenant" />
                      <Label htmlFor="preview-tenant">
                        Contract Tenant ({metadata.tenantEmail || 'Not provided'})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tenant-list" id="preview-tenant-list" />
                      <Label htmlFor="preview-tenant-list">Select from Tenant List</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="preview-custom" />
                      <Label htmlFor="preview-custom">Custom Email</Label>
                    </div>
                  </RadioGroup>

                  {selectedEmailOption === 'tenant-list' && (
                    <div className="space-y-2">
                      <Label>Select Tenant</Label>
                      <Select
                        value={selectedTenantEmail}
                        onValueChange={setSelectedTenantEmail}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map((tenant) => (
                            <SelectItem 
                              key={tenant.id} 
                              value={tenant.email || ''}
                            >
                              {tenant.first_name} {tenant.last_name} ({tenant.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedEmailOption === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="customEmail">Custom Email Address</Label>
                      <Input
                        id="customEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <ScrollArea className="h-[calc(90vh-16rem)]">
                  <div className="mt-4 px-4">
                    <ContractContent formData={metadata} />
                    <ContractSignatures formData={metadata} contractId={id || ''} />
                  </div>
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={handleEmailSubmit}>
                    Send Contract
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {renderInviteModal()}
        </div>
      </main>
    </div>
  );
}
