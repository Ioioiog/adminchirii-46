
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
