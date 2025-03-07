export interface Property {
  Row: {
    id: string;
    name: string;
    address: string;
    landlord_id: string;
    monthly_rent: number;
    created_at: string;
    updated_at: string;
    type: 'Apartment' | 'House' | 'Condo' | 'Commercial';
    description: string | null;
    available_from: string | null;
  };
  Insert: {
    id?: string;
    name: string;
    address: string;
    landlord_id: string;
    monthly_rent: number;
    type?: 'Apartment' | 'House' | 'Condo' | 'Commercial';
    description?: string | null;
    available_from?: string | null;
  };
  Update: {
    name?: string;
    address?: string;
    monthly_rent?: number;
    type?: 'Apartment' | 'House' | 'Condo' | 'Commercial';
    description?: string | null;
    available_from?: string | null;
  };
}