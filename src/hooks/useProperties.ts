
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";

export interface UsePropertiesProps {
  userRole: "landlord" | "tenant";
}

export interface UsePropertiesReturn {
  properties: Property[];
  isLoading: boolean;
  handleAdd?: (data: any) => Promise<boolean>;
  handleEdit?: (property: Property, data: any) => Promise<boolean>;
  handleDelete?: (property: Property) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function useProperties({ userRole }: UsePropertiesProps): UsePropertiesReturn {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", userRole],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error fetching user in useProperties:", userError);
          throw userError;
        }

        if (!user) {
          console.error("No authenticated user found in useProperties");
          return [];
        }

        console.log("useProperties - User ID:", user.id);
        console.log("useProperties - User Role:", userRole);

        if (userRole === "landlord") {
          console.log("Executing landlord properties query...");
          const { data, error } = await supabase
            .from("properties")
            .select(`
              *,
              tenancies!inner(
                id,
                status,
                tenant_id,
                tenant:profiles!inner(
                  id,
                  first_name,
                  last_name,
                  email
                )
              )
            `)
            .eq("landlord_id", user.id)
            .eq("tenancies.status", "active")
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching landlord properties:", error);
            throw error;
          }

          console.log("Raw landlord properties data:", data);

          // Transform the data to match our Property interface
          const transformedData = data?.map(property => ({
            ...property,
            status: property.tenancies?.length > 0 ? 'occupied' : 'vacant',
            tenant_count: property.tenancies?.length || 0
          })) || [];

          console.log("Transformed landlord properties:", transformedData);
          return transformedData;
        } else {
          // For tenants, fetch through tenancies table
          console.log("Fetching tenant properties for user:", user.id);
          const { data: tenanciesData, error } = await supabase
            .from("tenancies")
            .select(`
              property:properties(*),
              status,
              start_date,
              end_date
            `)
            .eq("tenant_id", user.id)
            .eq("status", "active");

          if (error) {
            console.error("Error fetching tenant properties:", error);
            throw error;
          }
          
          console.log("Raw tenancies data:", tenanciesData);
          
          const properties = tenanciesData?.map(item => ({
            ...item.property,
            status: 'occupied',
            tenant_count: 1,
            tenancy: {
              end_date: item.end_date,
              start_date: item.start_date
            }
          })) || [];

          console.log("Transformed tenant properties:", properties);
          return properties;
        }
      } catch (error) {
        console.error("Error in useProperties:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache data for 30 seconds
  });

  return { properties: properties as Property[], isLoading };
}
