
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Check, MoreHorizontal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UtilityPaymentActionsProps {
  utilityId: string;
  status: string;
  userRole: "landlord" | "tenant";
  onStatusChange?: () => void;
}

export const UtilityPaymentActions = ({
  utilityId,
  status,
  userRole,
  onStatusChange,
}: UtilityPaymentActionsProps) => {
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log("Updating utility status:", { utilityId, newStatus });
      
      const { error } = await supabase
        .from("utilities")
        .update({ status: newStatus })
        .eq("id", utilityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Utility bill marked as ${newStatus}`,
      });

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error updating utility status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update utility status",
      });
    }
  };

  if (userRole === "tenant") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status !== "paid" && (
          <DropdownMenuItem onClick={() => handleStatusChange("paid")}>
            <Check className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        {status !== "overdue" && (
          <DropdownMenuItem onClick={() => handleStatusChange("overdue")}>
            <X className="mr-2 h-4 w-4" />
            Mark as Overdue
          </DropdownMenuItem>
        )}
        {status !== "pending" && (
          <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
            <X className="mr-2 h-4 w-4" />
            Mark as Pending
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
