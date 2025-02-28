
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ContractTerminationForm } from "./ContractTerminationForm";
import { useState } from "react";
import { ScrollableContractContent } from "@/components/contract/ScrollableContractContent"; 

interface ContractDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: {
    id: string;
    properties?: { name: string };
    contract_type: string;
    status: string;
    valid_from: string | null;
    valid_until: string | null;
    metadata?: {
      contractNumber?: string;
      ownerName?: string;
      ownerReg?: string;
      ownerFiscal?: string;
      ownerAddress?: string;
      ownerBank?: string;
      ownerBankName?: string;
      ownerEmail?: string;
      ownerPhone?: string;
      ownerCounty?: string;
      ownerCity?: string;
      ownerRepresentative?: string;
      tenantName?: string;
      tenantReg?: string;
      tenantFiscal?: string;
      tenantAddress?: string;
      tenantBank?: string;
      tenantBankName?: string;
      tenantEmail?: string;
      tenantPhone?: string;
      tenantCounty?: string;
      tenantCity?: string;
      tenantRepresentative?: string;
      rentAmount?: string;
      contractDuration?: string;
      paymentDay?: string;
      lateFee?: string;
      securityDeposit?: string;
    };
  } | null;
}

export function ContractDetailsDialog({ open, onOpenChange, contract }: ContractDetailsDialogProps) {
  const { userRole } = useUserRole();
  const [showTerminationForm, setShowTerminationForm] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  if (!contract) return null;
  const metadata = contract.metadata || {};

  console.log("Current user role:", userRole);
  console.log("Contract status:", contract.status);
  console.log("Show termination form:", showTerminationForm);

  const handleProceedToTermination = () => {
    setShowTerminationForm(true);
    setIsAlertOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        {!showTerminationForm ? (
          <>
            <DialogHeader className="flex flex-row items-center justify-between space-x-4">
              <DialogTitle>Contract Details</DialogTitle>
              {userRole === 'landlord' && contract.status !== 'cancelled' && (
                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      className="whitespace-nowrap"
                    >
                      Cancel Contract
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Contract Termination</AlertDialogTitle>
                      <AlertDialogDescription>
                        To cancel this contract, you'll need to provide termination details. Would you like to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-4 mt-4">
                      <AlertDialogCancel>No, keep contract</AlertDialogCancel>
                      <AlertDialogAction onClick={handleProceedToTermination}>
                        Yes, proceed to termination
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DialogHeader>

            <div className="space-y-6 print:space-y-6 max-h-[60vh] overflow-y-auto pr-2">
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
                        contract.status === 'cancelled' ? 'bg-red-100 text-red-800' :
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
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>Contract Termination Form</DialogTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowTerminationForm(false)}
                >
                  Back to Details
                </Button>
              </div>
            </DialogHeader>
            <ContractTerminationForm 
              contract={contract}
              onSuccess={() => {
                setShowTerminationForm(false);
                onOpenChange(false);
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
