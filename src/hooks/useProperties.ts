
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";

interface UsePropertiesProps {
  userRole: "landlord" | "tenant" | "service_provider";
}

export const useProperties = ({ userRole }: UsePropertiesProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching properties for ${userRole} role`);
      
      if (userRole === "service_provider") {
        setProperties([]);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setProperties([]);
        return;
      }

      // For tenants, only fetch properties where they have an active tenancy
      if (userRole === "tenant") {
        const { data, error } = await supabase
          .from("properties")
          .select(`
            *,
            tenancies!inner(
              id,
              status,
              tenant_id,
              start_date,
              end_date
            )
          `)
          .eq('tenancies.tenant_id', userData.user.id)
          .eq('tenancies.status', 'active');

        if (error) throw error;

        // Process tenancy data on client side
        const propertiesWithStatus = (data || []).map(property => {
          const activeTenancies = property.tenancies?.filter(t => t.status === 'active') || [];
          
          return {
            ...property,
            status: activeTenancies.length > 0 ? 'occupied' : 'vacant',
            tenant_count: activeTenancies.length,
            tenancy: activeTenancies.length > 0 ? {
              end_date: activeTenancies[0].end_date,
              start_date: activeTenancies[0].start_date
            } : undefined
          };
        }) as Property[];

        setProperties(propertiesWithStatus);
      } else {
        // For landlords, fetch all their properties with optimized query
        const { data, error } = await supabase
          .from("properties")
          .select(`
            *,
            tenancies(
              id,
              status,
              start_date,
              end_date
            )
          `)
          .eq('landlord_id', userData.user.id);

        if (error) throw error;

        const propertiesWithStatus = (data || []).map(property => {
          const activeTenancies = property.tenancies?.filter(t => t.status === 'active') || [];
          
          return {
            ...property,
            status: activeTenancies.length > 0 ? 'occupied' : 'vacant',
            tenant_count: activeTenancies.length
          };
        }) as Property[];

        setProperties(propertiesWithStatus);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return { properties, isLoading, fetchProperties };
};
