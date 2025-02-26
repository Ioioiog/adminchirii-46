
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
              tenancies!inner(id, status, tenant_id)
            `)
            .eq('tenancies.tenant_id', userData.user.id)
            .eq('tenancies.status', 'active')
            .single();

          if (error) throw error;

          // Get the first (and only) landlord profile since it's a foreign key relationship
          const landlordProfile = Array.isArray(data.landlord) ? data.landlord[0] : data.landlord;

          const propertyWithStatus = {
            ...data,
            status: data.tenancies?.some((t: any) => t.status === 'active') ? 'occupied' as const : 'vacant' as const,
            tenant_count: data.tenancies?.filter((t: any) => t.status === 'active').length || 0,
            landlord: landlordProfile as LandlordProfile
          } as Property;

          setProperties([propertyWithStatus]);
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
