
import { Json } from './json';

export interface ServiceProviderInvoiceInfo {
  companyName: string;
  companyAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankSwiftCode: string;
  vatNumber: string;
  registrationNumber: string;
  paymentTerms: string;
  invoiceNotes: string;
  applyVat: boolean;
}

export interface ServiceProviderProfile {
  id: string;
  business_name: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  website?: string;
  service_area?: string[];
  is_first_login?: boolean;
  profile_id?: string;
  created_at?: string;
  updated_at?: string;
  review_count?: number;
  rating?: number;
  availability_hours?: Json;
  invoice_info?: ServiceProviderInvoiceInfo;
}
