export interface InvoiceSettings {
  apply_vat: boolean;
  auto_generate: boolean;
  generate_day: number;
  company_name?: string;
  company_address?: string;
  bank_name?: string;
  bank_account_number?: string;
  additional_notes?: string;
  tenant_company_name?: string;
  tenant_company_address?: string;
  tenant_registration_number?: string;
  tenant_vat_number?: string;
}

export interface ProfileInvoiceInfo {
  invoice_info: InvoiceSettings;
}

export interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  created_at: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  currency: string;
  vat_rate?: number;
  property?: {
    name: string;
    address: string;
  };
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}
