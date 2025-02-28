
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaymentActions } from "@/components/payments/PaymentActions";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Utility {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  issued_date?: string | null;
  invoice_number?: string | null;
  created_at?: string;
  updated_at?: string;
  property?: {
    name: string;
    address: string;
  } | null;
}

interface UtilityListProps {
  utilities: Utility[];
  userRole: "landlord" | "tenant";
  onStatusUpdate?: () => void;
}

export function UtilityList({ utilities, userRole, onStatusUpdate }: UtilityListProps) {
  const { toast } = useToast();
  const { formatAmount } = useCurrency();

  console.log('UtilityList - Received utilities:', utilities);
  console.log('UtilityList - User role:', userRole);

  const handleStatusUpdate = async (utilityId: string, newStatus: string) => {
    try {
      console.log('Updating utility status:', { utilityId, newStatus });
      const { error } = await supabase
        .from("utilities")
        .update({ status: newStatus })
        .eq("id", utilityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility bill status updated successfully!",
      });
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error updating utility status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update utility bill status.",
      });
    }
  };

  const handleViewInvoice = async (utilityId: string) => {
    try {
      console.log("Fetching invoice for utility ID:", utilityId);
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('utility_invoices')
        .select('pdf_path')
        .eq('utility_id', utilityId)
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      if (!invoice?.pdf_path) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No invoice file found for this utility bill.",
        });
        return;
      }

      const { data: { signedUrl }, error: urlError } = await supabase
        .storage
        .from('utility-invoices')
        .createSignedUrl(invoice.pdf_path, 60);

      if (urlError) throw urlError;

      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error("Error viewing invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retrieve the invoice file.",
      });
    }
  };

  const handleDelete = async (utilityId: string) => {
    try {
      console.log("Deleting utility with ID:", utilityId);
      
      const { error: invoiceError } = await supabase
        .from('utility_invoices')
        .delete()
        .eq('utility_id', utilityId);

      if (invoiceError) {
        console.error("Error deleting associated invoices:", invoiceError);
        throw invoiceError;
      }

      const { error } = await supabase
        .from('utilities')
        .delete()
        .eq('id', utilityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility bill deleted successfully!",
      });
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error deleting utility:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete utility bill.",
      });
    }
  };

  if (!Array.isArray(utilities)) {
    console.error("Utilities prop is not an array:", utilities);
    return (
      <div className="text-center py-8 text-gray-500">
        Error loading utilities.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {utilities.map((utility) => (
            <TableRow key={utility.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{utility.property?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{utility.property?.address || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell className="capitalize">{utility.type}</TableCell>
              <TableCell>{utility.invoice_number || 'N/A'}</TableCell>
              <TableCell className="font-medium text-blue-600">
                {formatAmount(utility.amount, utility.currency)}
              </TableCell>
              <TableCell>{new Date(utility.due_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge
                  variant={utility.status === "paid" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {utility.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInvoice(utility.id)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View
                  </Button>
                  {userRole === "landlord" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(utility.id)}
                      className="flex items-center gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                  {(userRole === "landlord" || utility.status !== "paid") && (
                    <PaymentActions
                      paymentId={utility.id}
                      status={utility.status}
                      userRole={userRole}
                      onStatusChange={onStatusUpdate}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {utilities.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No utility bills found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
