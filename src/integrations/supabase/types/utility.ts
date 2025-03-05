
export interface Utility {
  Row: {
    id: string;
    property_id: string;
    type: string;
    amount: number;
    currency: string;
    due_date: string;
    issued_date: string | null;
    invoice_number: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    invoiced_amount: number | null;
    invoiced: boolean | null;
  };
  Insert: {
    id?: string;
    property_id: string;
    type: string;
    amount: number;
    currency: string;
    due_date: string;
    issued_date?: string | null;
    invoice_number?: string | null;
    status?: string;
    invoiced_amount?: number | null;
    invoiced?: boolean | null;
  };
  Update: {
    type?: string;
    amount?: number;
    currency?: string;
    due_date?: string;
    issued_date?: string | null;
    invoice_number?: string | null;
    status?: string;
    invoiced_amount?: number | null;
    invoiced?: boolean | null;
  };
}

export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance' | 'other';

export interface UtilityProviderCredentials {
  Row: {
    id: string;
    provider_name: string;
    username: string;
    encrypted_password: string;
    property_id: string | null;
    landlord_id: string;
    location_name: string | null;
    utility_type: UtilityType | null;
    start_day: number | null;
    end_day: number | null;
    created_at: string;
    updated_at: string;
    password: string | null;
  };
  Insert: {
    id?: string;
    provider_name: string;
    username: string;
    password: string;
    property_id?: string | null;
    landlord_id: string;
    location_name?: string | null;
    utility_type?: UtilityType | null;
    start_day?: number | null;
    end_day?: number | null;
  };
  Update: {
    provider_name?: string;
    username?: string;
    password?: string | null;
    property_id?: string | null;
    landlord_id?: string;
    location_name?: string | null;
    utility_type?: UtilityType | null;
    start_day?: number | null;
    end_day?: number | null;
  };
}
