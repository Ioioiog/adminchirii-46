
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Invoice, InvoiceMetadata } from "@/types/invoice";
import { InvoiceDetailsDialog } from "./InvoiceDetailsDialog";

export interface InvoiceActionsProps {
  invoiceId: string;
  status: 'pending' | 'paid' | 'overdue';
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => void;
  onViewInvoice?: () => void;
  isSendingEmail?: boolean;
  onDelete?: () => void;
}

export function InvoiceActions({ 
  invoiceId, 
  status, 
  userRole, 
  onStatusUpdate, 
  onViewInvoice, 
  isSendingEmail = false,
  onDelete
}: InvoiceActionsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleStatusUpdate = async (newStatus: 'pending' | 'paid' | 'overdue') => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus, ...(newStatus === "paid" ? { paid_at: new Date().toISOString() } : {}) })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invoice marked as ${newStatus}`,
      });

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update invoice status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      setIsUpdating(true);
      
      const { data: invoiceData, error: fetchError } = await supabase
        .from("invoices")
        .select("metadata")
        .eq("id", invoiceId)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (invoiceData?.metadata) {
        const metadata = invoiceData.metadata as InvoiceMetadata;
        
        if (metadata && metadata.utilities_included && Array.isArray(metadata.utilities_included)) {
          const utilities = metadata.utilities_included;
          
          for (const utility of utilities) {
            // Get the current utility record to calculate the updated invoiced_amount
            const { data: utilityData, error: utilityFetchError } = await supabase
              .from("utilities")
              .select("invoiced_amount")
              .eq("id", utility.id)
              .single();
              
            if (utilityFetchError) {
              console.error("Error fetching utility data:", utilityFetchError);
              continue;
            }
            
            // Calculate the new invoiced_amount by subtracting the amount in this invoice
            const currentInvoicedAmount = utilityData.invoiced_amount || 0;
            const amountInThisInvoice = utility.amount || 0;
            const newInvoicedAmount = Math.max(0, currentInvoicedAmount - amountInThisInvoice);
            
            // Set invoiced to false if newInvoicedAmount is 0
            const isInvoiced = newInvoicedAmount > 0;
            
            await supabase
              .from("utilities")
              .update({ 
                invoiced: isInvoiced,
                invoiced_amount: newInvoicedAmount
              })
              .eq("id", utility.id);
          }
        }
      }
      
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });

      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete invoice",
      });
    } finally {
      setIsUpdating(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleViewInvoice = () => {
    if (onViewInvoice) {
      onViewInvoice();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewInvoice} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            View Invoice
          </DropdownMenuItem>
          
          {userRole === "landlord" && status !== "paid" && (
            <DropdownMenuItem 
              onClick={() => handleStatusUpdate("paid")} 
              disabled={isUpdating}
              className="cursor-pointer text-green-600"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          )}

          {userRole === "tenant" && status === "pending" && (
            <DropdownMenuItem 
              onClick={() => handleStatusUpdate("paid")}
              disabled={isUpdating || isSendingEmail}
              className="cursor-pointer text-green-600"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isSendingEmail ? "Processing Payment..." : "Pay Now"}
            </DropdownMenuItem>
          )}

          {userRole === "landlord" && status !== "overdue" && (
            <DropdownMenuItem 
              onClick={() => handleStatusUpdate("overdue")}
              disabled={isUpdating}
              className="cursor-pointer text-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Mark as Overdue
            </DropdownMenuItem>
          )}
          
          {userRole === "landlord" && (
            <DropdownMenuItem 
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={isUpdating}
              className="cursor-pointer text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Invoice
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invoice{status === 'paid' ? ' even though it is marked as paid' : ''}.
              {invoiceId && status === 'paid' && 
                " The payment record will remain, but the invoice will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvoice}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
