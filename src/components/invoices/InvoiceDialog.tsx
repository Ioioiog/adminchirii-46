
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { InvoiceForm } from "./InvoiceForm";

export interface InvoiceDialogProps {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: "landlord" | "tenant";
  onInvoiceCreated?: () => Promise<void>;
}

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
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          Note: Invoices are automatically generated on the monthly renewal date of each active tenancy.
          Manual invoice creation should only be used for special cases.
        </div>
        <InvoiceForm onSuccess={handleInvoiceCreated} />
      </DialogContent>
    </Dialog>
  );
}
