
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";

interface UsePropertiesProps {
  userRole: "landlord" | "tenant" | "service_provider";
}

export const useProperties = ({ userRole }: UsePropertiesProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (userRole === "service_provider") {
          setProperties([]);
          setIsLoading(false);
          return;
        }

        // Different query based on user role
        if (userRole === "tenant") {
          // For tenants, only fetch properties where they have an active tenancy
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            setProperties([]);
            setIsLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from("properties")
            .select(`
              id,
              name,
              address,
              monthly_rent,
              currency,
              type,
              created_at,
              updated_at,
              description,
              available_from,
              landlord_id,
              tenancies!inner (
                id,
                status,
                tenant_id
              )
            `)
            .eq('tenancies.tenant_id', userData.user.id)
            .eq('tenancies.status', 'active');

          if (error) throw error;

          const propertiesWithStatus = (data || []).map(property => ({
            ...property,
            status: property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant',
            tenant_count: property.tenancies?.filter(t => t.status === 'active').length || 0,
            currency: property.currency || 'EUR' // Ensure currency has a default value
          })) as Property[];

          setProperties(propertiesWithStatus);
        } else {
          // For landlords, fetch all their properties
          const { data, error } = await supabase
            .from("properties")
            .select(`
              id,
              name,
              address,
              monthly_rent,
              currency,
              type,
              created_at,
              updated_at,
              description,
              available_from,
              landlord_id,
              tenancies (
                id,
                status
              )
            `);

          if (error) throw error;

          const propertiesWithStatus = (data || []).map(property => ({
            ...property,
            status: property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant',
            tenant_count: property.tenancies?.filter(t => t.status === 'active').length || 0,
            currency: property.currency || 'EUR' // Ensure currency has a default value
          })) as Property[];

          setProperties(propertiesWithStatus);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [userRole]);

  return { properties, isLoading };
};
