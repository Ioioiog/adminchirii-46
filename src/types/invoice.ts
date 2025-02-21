
export interface InvoiceSettings {
  apply_vat: boolean;
  auto_generate: boolean;
  generate_day: number;
}

export interface ProfileInvoiceInfo {
  invoice_info: InvoiceSettings;
}
