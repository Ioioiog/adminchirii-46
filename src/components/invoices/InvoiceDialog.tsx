
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Receipt } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDialogProps } from "@/types/invoice";

export function InvoiceDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userRole, 
  onInvoiceCreated,
  calculationData
}: InvoiceDialogProps) {
  const handleInvoiceCreated = async () => {
    if (onInvoiceCreated) {
      await onInvoiceCreated();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white rounded-lg shadow-lg border-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Receipt size={20} />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-800">Create Invoice</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-gray-600">
              Note: Invoices are automatically generated on the monthly renewal date of each active tenancy.
              Manual invoice creation should only be used for special cases or partial payments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <InvoiceForm 
              onSuccess={handleInvoiceCreated} 
              userId={userId} 
              userRole={userRole} 
              calculationData={calculationData}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
