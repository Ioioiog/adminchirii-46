
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Property } from "@/utils/propertyUtils";
import { TenantAssignForm } from "./TenantAssignForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantAssignDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void; // Made optional to maintain backward compatibility
}

export function TenantAssignDialog({ properties, open, onOpenChange, onClose }: TenantAssignDialogProps) {
  const { data: availableTenants = [], isLoading, error } = useQuery({
    queryKey: ["available-tenants"],
    queryFn: async () => {
      try {
        // Fetch tenants with role = tenant
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "tenant");

        if (error) throw error;
        
        console.log("Available tenants:", data);
        return data || [];
      } catch (e) {
        console.error("Error fetching available tenants:", e);
        throw e;
      }
    },
    enabled: open, // Only run query when dialog is open
  });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Existing Tenant</DialogTitle>
          <DialogDescription>
            Select a tenant and assign them to a property. This will create a new tenancy record.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
            Error loading tenants. Please try again later.
          </div>
        ) : (
          <TenantAssignForm 
            properties={properties} 
            availableTenants={availableTenants}
            onClose={() => handleOpenChange(false)}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
