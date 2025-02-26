
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

          console.log("Fetching properties for tenant:", userData.user.id);

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
              landlord:profiles!properties_landlord_id_fkey(first_name, last_name, email, phone),
              tenancies(id, status, tenant_id),
              contracts(id, status, tenant_id)
            `)
            .or(
              `tenancies.tenant_id.eq.${userData.user.id},contracts.tenant_id.eq.${userData.user.id}`
            );

          if (error) {
            console.error("Error fetching properties:", error);
            throw error;
          }

          console.log("Properties data:", data);

          const propertyList = (data || []).map(item => {
            const hasActiveTenancy = item.tenancies?.some(
              (t: any) => t.status === 'active' && t.tenant_id === userData.user.id
            );
            const hasSignedContract = item.contracts?.some(
              (c: any) => c.status === 'signed' && c.tenant_id === userData.user.id
            );

            // Only include properties where the tenant has either an active tenancy or a signed contract
            if (!hasActiveTenancy && !hasSignedContract) {
              return null;
            }

            const landlordProfile = Array.isArray(item.landlord) ? item.landlord[0] : item.landlord;

            return {
              ...item,
              status: hasActiveTenancy ? 'occupied' as const : 'vacant' as const,
              tenant_count: item.tenancies?.filter((t: any) => t.status === 'active').length || 0,
              landlord: landlordProfile as LandlordProfile
            } as Property;
          }).filter(Boolean);

          console.log("Filtered property list:", propertyList);

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
        console.error("Error in fetchProperties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [userRole]);

  return { properties, isLoading };
};
