
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/types/tenant";
import { format } from "date-fns";
import { TenantFormFields } from "./TenantFormFields";

interface EditTenantDialogProps {
  tenant: Tenant;
  onUpdate: () => void;
}

export function EditTenantDialog({ tenant, onUpdate }: EditTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: tenant.first_name || "",
    lastName: tenant.last_name || "",
    email: tenant.email || "",
    phone: tenant.phone || "",
    startDate: tenant.tenancy?.start_date ? new Date(tenant.tenancy.start_date) : null,
    endDate: tenant.tenancy?.end_date ? new Date(tenant.tenancy.end_date) : null,
    monthlyPayDay: tenant.tenancy?.monthly_pay_day?.toString() || "1",
    propertyId: tenant.property?.id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("Updating tenant profile and tenancy...", {
        tenantId: tenant.id,
        propertyId: formData.propertyId,
        formData
      });

      // Update tenant profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        })
        .eq("id", tenant.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }

      console.log("Profile updated successfully, updating tenancy...");

      // Get the specific tenancy ID for the selected property
      const { data: tenancyData, error: tenancyFetchError } = await supabase
        .from("tenancies")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("property_id", formData.propertyId)
        .eq("status", "active")
        .maybeSingle();

      if (tenancyFetchError) {
        console.error("Error fetching tenancy:", tenancyFetchError);
        throw tenancyFetchError;
      }

      if (!tenancyData) {
        toast({
          title: "Error",
          description: "No active tenancy found for this property. Please check the property selection.",
          variant: "destructive",
        });
        return;
      }

      // Update tenancy details for the specific property using the tenancy ID
      const { error: tenancyError } = await supabase
        .from("tenancies")
        .update({
          start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
          end_date: formData.endDate ? format(formData.endDate, 'yyyy-MM-dd') : null,
          monthly_pay_day: parseInt(formData.monthlyPayDay),
        })
        .eq("id", tenancyData.id);

      if (tenancyError) {
        console.error("Error updating tenancy:", tenancyError);
        throw tenancyError;
      }

      console.log("Tenancy updated successfully");

      toast({
        title: "Success",
        description: "Tenant information updated successfully for the selected property.",
      });
      
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to update tenant information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        <span className="sr-only">Edit tenant</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tenant Information</DialogTitle>
          <DialogDescription>
            Update the tenant's information for the selected property.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TenantFormFields formData={formData} setFormData={setFormData} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
