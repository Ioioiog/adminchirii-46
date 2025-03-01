
export interface Utility {
  Row: {
    id: string;
    property_id: string;
    type: 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';
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
    type: 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';
    amount: number;
    currency: string;
    due_date: string;
    issued_date?: string | null;
    invoice_number?: string | null;
    status?: string;
  };
  Update: {
    type?: 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';
    amount?: number;
    currency?: string;
    due_date?: string;
    issued_date?: string | null;
    invoice_number?: string | null;
    status?: string;
  };
}
