
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";

interface UsePropertiesProps {
  userRole: "landlord" | "tenant" | "service_provider";
}

interface LandlordProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
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

        if (userRole === "tenant") {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            setProperties([]);
            setIsLoading(false);
            return;
          }

          // Query both active tenancies and signed contracts
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
              landlord:profiles!properties_landlord_id_fkey!inner(first_name, last_name, email, phone),
              tenancies!inner(id, status, tenant_id),
              contracts!contracts_property_id_fkey(
                id,
                status,
                tenant_id
              )
            `)
            .or(`tenancies.tenant_id.eq.${userData.user.id},contracts.tenant_id.eq.${userData.user.id}`)
            .or('tenancies.status.eq.active,contracts.status.eq.signed');

          if (error) throw error;

          const propertyList = (data || []).map(item => {
            // Get the first (and only) landlord profile since it's a foreign key relationship
            const landlordProfile = Array.isArray(item.landlord) ? item.landlord[0] : item.landlord;

            return {
              ...item,
              status: item.tenancies?.some((t: any) => t.status === 'active') ? 'occupied' as const : 'vacant' as const,
              tenant_count: item.tenancies?.filter((t: any) => t.status === 'active').length || 0,
              landlord: landlordProfile as LandlordProfile
            } as Property;
          });

          setProperties(propertyList);
        } else {
          // For landlords, fetch all their properties
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
            status: property.tenancies?.some(t => t.status === 'active') ? 'occupied' as const : 'vacant' as const,
            tenant_count: property.tenancies?.filter(t => t.status === 'active').length || 0
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
