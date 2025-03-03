
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Invoice } from "@/types/invoice";

export interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => void;
  onViewInvoice?: () => void;
  isSendingEmail?: boolean;
}

export function InvoiceActions({ 
  invoiceId, 
  status, 
  userRole, 
  onStatusUpdate, 
  onViewInvoice, 
  isSendingEmail = false 
}: InvoiceActionsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onViewInvoice && (
          <DropdownMenuItem onClick={onViewInvoice} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            View Invoice
          </DropdownMenuItem>
        )}
        
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
