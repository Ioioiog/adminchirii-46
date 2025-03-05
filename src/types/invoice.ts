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
  original_amount?: number;
  currency?: string;
  invoiced_amount?: number;
  remaining_amount?: number;
}

export interface InvoiceMetadata {
  is_partial?: boolean;
  full_amount?: number;
  calculation_method?: 'percentage' | 'days';
  days_calculated?: number;
  daily_rate?: number;
  date_range?: {
    from: string;
    to: string;
  };
  utilities_included?: Array<{
    id: string;
    amount: number;
    type: string;
    invoiced_amount?: number;
    original_amount?: number;
    current_invoiced_amount?: number; // Track the previously invoiced amount
    percentage?: number; // Keep for backward compatibility with existing invoices
  }>;
  subtotal?: number;
  vat_amount?: number;
  [key: string]: any; // Add index signature to make it compatible with Json
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
  calculationData?: CalculationData;
}

export interface InvoiceFormProps {
  onSuccess?: () => void;
  userId: string;
  userRole: "landlord" | "tenant";
  calculationData?: CalculationData;
}

export interface CalculationData {
  propertyId?: string;
  rentAmount?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  currency?: string;
  grandTotal?: number;
  utilities?: UtilityForInvoice[];
}

export interface UtilityForInvoice {
  id: string;
  type: string;
  amount: number;
  original_amount?: number;
  selected?: boolean;
  currency?: string;
  invoiced_amount?: number;
  is_partially_invoiced?: boolean;
  due_date?: string;
  remaining_amount?: number;
  applied_amount?: number; // Add applied_amount to track amount from calculator
}
