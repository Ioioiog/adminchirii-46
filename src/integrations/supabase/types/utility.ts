

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
  };
  Update: {
    type?: string;
    amount?: number;
    currency?: string;
    due_date?: string;
    issued_date?: string | null;
    invoice_number?: string | null;
    status?: string;
  };
}

export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';

