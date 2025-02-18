
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaymentActions } from "@/components/payments/PaymentActions";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { Separator } from "@/components/ui/separator";

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
    <div className="grid gap-4">
      {utilities.map((utility) => {
        if (!utility?.id) {
          console.error("Invalid utility object:", utility);
          return null;
        }

        return (
          <Card key={utility.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Property</div>
                  <div className="font-medium">{utility.property?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{utility.property?.address || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Bill Details</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm text-gray-500">Type:</span>
                      <div className="font-medium capitalize">{utility.type}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Amount:</span>
                      <div className="font-medium">
                        {utility.amount} {utility.currency}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Dates</div>
                  <div className="grid gap-1">
                    <div>
                      <span className="text-sm text-gray-500">Due Date:</span>
                      <div className="font-medium">
                        {new Date(utility.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    {utility.issued_date && (
                      <div>
                        <span className="text-sm text-gray-500">Issued Date:</span>
                        <div className="font-medium">
                          {new Date(utility.issued_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Invoice Details</div>
                  {utility.invoice_number ? (
                    <div className="font-medium">{utility.invoice_number}</div>
                  ) : (
                    <div className="text-sm text-gray-500">No invoice number</div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                  <Badge
                    variant={utility.status === "paid" ? "default" : "secondary"}
                    className="mb-2"
                  >
                    {utility.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInvoice(utility.id)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Invoice
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
                </div>
                {userRole === "landlord" ? (
                  <div className="flex gap-2">
                    <PaymentActions
                      paymentId={utility.id}
                      status={utility.status}
                      userRole={userRole}
                      onStatusChange={onStatusUpdate}
                    />
                  </div>
                ) : (
                  utility.status !== "paid" && (
                    <PaymentActions
                      paymentId={utility.id}
                      status={utility.status}
                      userRole={userRole}
                      onStatusChange={onStatusUpdate}
                    />
                  )
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {utilities.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No utility bills found.
        </div>
      )}
    </div>
  );
}
