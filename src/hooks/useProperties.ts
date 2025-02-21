
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

        const { data, error } = await supabase
          .from("properties")
          .select(`
            id,
            name,
            address,
            monthly_rent,
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
          tenant_count: property.tenancies?.filter(t => t.status === 'active').length || 0
        })) as Property[];

        setProperties(propertiesWithStatus);
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
