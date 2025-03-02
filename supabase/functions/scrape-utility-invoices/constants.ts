
export interface Bill {
  amount: number;
  due_date: string;
  invoice_number: string;
  url?: string;
  type?: string;
  status?: string;
  issued_date?: string;
}

export interface ScrapingResult {
  success: boolean;
  error?: string;
  message?: string;
  bills?: Bill[];
}
