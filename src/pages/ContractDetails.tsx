
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

export default function ContractDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

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
      return data;
    },
  });

  const handleEditContract = () => {
    navigate(`/documents/contracts/${id}/edit`);
  };

  const handleViewContract = () => {
    navigate(`/documents/contracts/${id}/view`);
  };

  const handlePrintContract = () => {
    window.print();
  };

  const handleSendContract = async () => {
    try {
      // Here you would typically update the contract status and trigger email sending
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'sent' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract has been sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send the contract. Please try again.",
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

  const metadata = contract.metadata || {};

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
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
      </main>
    </div>
  );
}
