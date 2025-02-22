import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Eye, Printer, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types/json";
import { ContractContent } from "@/components/contract/ContractContent";
import { FormData } from "@/types/contract";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { useTenants } from "@/hooks/useTenants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailOption, setSelectedEmailOption] = useState<string>('tenant');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedTenantEmail, setSelectedTenantEmail] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
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
      console.log('Contract data from Supabase:', data);
      
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!contract) {
    return <div>Contract not found</div>;
  }

  const metadata = contract.metadata;

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
                onClick={handleEditContract}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintContract}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleSendContract}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                Send Contract
              </Button>
            </div>
          </div>

          {/* Contract Preview Modal */}
          <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
            <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ContractContent formData={metadata} />
              </div>
            </DialogContent>
          </Dialog>

          
          <div className="print:hidden">
            <Card>
              <CardHeader>
                <CardTitle>Contract Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract Number</Label>
                  <Input value={metadata.contractNumber || ''} readOnly />
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
                <div>
                  <Label>Name</Label>
                  <Input value={metadata.ownerName || ''} readOnly />
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input value={metadata.ownerReg || ''} readOnly />
                </div>
                <div>
                  <Label>Fiscal Code</Label>
                  <Input value={metadata.ownerFiscal || ''} readOnly />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={metadata.ownerAddress || ''} readOnly />
                </div>
                <div>
                  <Label>Bank Account</Label>
                  <Input value={metadata.ownerBank || ''} readOnly />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input value={metadata.ownerBankName || ''} readOnly />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={metadata.ownerEmail || ''} readOnly />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={metadata.ownerPhone || ''} readOnly />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tenant Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={metadata.tenantName || ''} readOnly />
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input value={metadata.tenantReg || ''} readOnly />
                </div>
                <div>
                  <Label>Fiscal Code</Label>
                  <Input value={metadata.tenantFiscal || ''} readOnly />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={metadata.tenantAddress || ''} readOnly />
                </div>
                <div>
                  <Label>Bank Account</Label>
                  <Input value={metadata.tenantBank || ''} readOnly />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input value={metadata.tenantBankName || ''} readOnly />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={metadata.tenantEmail || ''} readOnly />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={metadata.tenantPhone || ''} readOnly />
                </div>
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
                  <Input value={metadata.rentAmount || ''} readOnly />
                </div>
                <div>
                  <Label>Contract Duration (months)</Label>
                  <Input value={metadata.contractDuration || ''} readOnly />
                </div>
                <div>
                  <Label>Payment Day</Label>
                  <Input value={metadata.paymentDay || ''} readOnly />
                </div>
                <div>
                  <Label>Late Fee</Label>
                  <Input value={metadata.lateFee || ''} readOnly />
                </div>
                <div>
                  <Label>Security Deposit</Label>
                  <Input value={metadata.securityDeposit || ''} readOnly />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden print:block">
            <ContractContent formData={metadata} />
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
        </div>
      </main>
    </div>
  );
}
