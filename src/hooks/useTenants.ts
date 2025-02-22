import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/types/tenant";

export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async (): Promise<Tenant[]> => {
      console.log("Fetching tenants from tenant_details view...");
      
      const { data: tenantDetails, error } = await supabase
        .from('tenant_details')
        .select('*');

      if (error) {
        console.error("Error fetching tenants:", error);
        throw error;
      }

      console.log("Raw tenant details:", tenantDetails);

      const formattedTenants = tenantDetails.map(detail => ({
        id: detail.tenant_id,
        first_name: detail.first_name,
        last_name: detail.last_name,
        email: detail.email,
        phone: detail.phone,
        role: detail.role,
        created_at: new Date().toISOString(), // This field isn't in the view but required by type
        updated_at: new Date().toISOString(), // This field isn't in the view but required by type
        property: {
          id: detail.property_id,
          name: detail.property_name,
          address: detail.property_address,
        },
        tenancy: {
          id: detail.tenancy_id,
          start_date: detail.start_date,
          end_date: detail.end_date,
          status: detail.tenancy_status,
        },
      }));

      console.log("Formatted tenants:", formattedTenants);
      return formattedTenants;
    },
    staleTime: 30000,
  });
}