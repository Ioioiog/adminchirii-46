import { supabase } from "@/integrations/supabase/client";

export type PropertyType = "Apartment" | "House" | "Condo" | "Commercial";
export type PropertyStatus = "vacant" | "occupied" | "maintenance";

export interface Property {
  id: string;
  name: string;
  address: string;
  monthly_rent: number;
  type: PropertyType;
  description?: string;
  available_from?: string | null;
  landlord_id?: string;
  created_at: string;
  updated_at: string;
  status: PropertyStatus;
  tenant_count: number;
  tenancies?: {
    id: string;
    status: string;
  }[];
  photos?: string[];
  monthly_electricity_cost?: number;
  monthly_water_cost?: number;
  monthly_gas_cost?: number;
  monthly_other_utilities_cost?: number;
  other_utilities_description?: string;
  amenities?: string[];
  parking_spots?: number;
  bedrooms?: number;
  bathrooms?: number;
  total_area?: number;
  construction_year?: number;
  tenancy?: {
    end_date: string | null;
    start_date: string;
  };
}

export interface PropertyInput extends Omit<Property, 'id' | 'landlord_id'> {
  landlord_id: string;
}

export async function fetchLandlordProperties(userId: string) {
  if (!userId) {
    console.log("No user ID provided for fetchLandlordProperties");
    return [];
  }

  console.log("Fetching landlord properties for user:", userId);
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("landlord_id", userId);

  if (error) {
    console.error("Error fetching landlord properties:", error);
    throw error;
  }

  console.log("Fetched landlord properties:", data);
  return data;
}

export async function fetchTenantProperties(userId: string) {
  if (!userId) {
    console.error("❌ No user ID provided for fetchTenantProperties");
    return [];
  }

  console.log("🔍 Starting tenant properties fetch for user:", userId);
  
  // First, let's check if the user exists in profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("❌ Error fetching user profile:", profileError);
    return [];
  }

  console.log("👤 Found user profile:", profile);
  
  // Then, check for active tenancies
  const { data: tenancies, error: tenancyError } = await supabase
    .from('tenancies')
    .select(`
      *,
      property:properties(*)
    `)
    .eq('tenant_id', userId)
    .eq('status', 'active');

  if (tenancyError) {
    console.error("❌ Error fetching tenancies:", tenancyError);
    throw tenancyError;
  }

  console.log("📋 Found tenancies:", tenancies);

  if (!tenancies?.length) {
    console.log("ℹ️ No active tenancies found for user");
    return [];
  }

  // Extract and return the properties from the tenancies, including tenancy details
  const properties = tenancies.map(tenancy => ({
    ...tenancy.property,
    tenancy: {
      end_date: tenancy.end_date,
      start_date: tenancy.start_date
    }
  }));
  
  console.log("✅ Extracted properties from tenancies:", properties);
  
  // Additional validation to ensure we're returning valid properties
  const validProperties = properties.filter(property => property && property.id);
  console.log("🏠 Final properties list:", validProperties);
  
  return validProperties;
}

export async function addProperty(property: PropertyInput) {
  console.log("Adding property:", property);
  const { data, error } = await supabase
    .from("properties")
    .insert(property)
    .select()
    .single();

  if (error) {
    console.error("Error adding property:", error);
    throw error;
  }

  console.log("Added property:", data);
  return data;
}

export async function updateProperty(id: string, updates: Partial<PropertyInput>) {
  console.log("Updating property:", id, updates);
  const { data, error } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating property:", error);
    throw error;
  }

  console.log("Updated property:", data);
  return data;
}

export async function deleteProperty(id: string) {
  console.log("Deleting property:", id);
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting property:", error);
    throw error;
  }

  console.log("Deleted property:", id);
}
