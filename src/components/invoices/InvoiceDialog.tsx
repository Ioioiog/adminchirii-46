
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDialogProps } from "@/types/invoice";

export function InvoiceDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userRole, 
  onInvoiceCreated 
}: InvoiceDialogProps) {
  const handleInvoiceCreated = async () => {
    if (onInvoiceCreated) {
      await onInvoiceCreated();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Note: Invoices are automatically generated on the monthly renewal date of each active tenancy.
            Manual invoice creation should only be used for special cases or partial payments.
          </DialogDescription>
        </DialogHeader>
        <InvoiceForm onSuccess={handleInvoiceCreated} />
      </DialogContent>
    </Dialog>
  );
}
