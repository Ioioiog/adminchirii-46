
import { DateRange } from "react-day-picker";

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

export interface UtilityItem {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  percentage?: number; // Added percentage for partial utility payments
  original_amount?: number; // Store the original amount before any partial calculation
}

export interface InvoiceMetadata {
  is_partial?: boolean;
  partial_percentage?: number;
  full_amount?: number;
  calculation_method?: 'percentage' | 'days';
  days_calculated?: number;
  daily_rate?: number;
  date_range?: {
    from: string;
    to: string;
  };
  utilities_included?: UtilityItem[];
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
  paid_at?: string | null;
  updated_at: string;
  metadata?: InvoiceMetadata;
  property: {
    name: string;
    address: string;
  };
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

export interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: "landlord" | "tenant";
  onInvoiceCreated?: () => Promise<void>;
}

export interface InvoiceFormProps {
  onSuccess: () => void;
  userId: string;
  userRole: "tenant" | "landlord" | "service_provider";
}
