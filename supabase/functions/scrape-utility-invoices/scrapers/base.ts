
export interface UtilityBill {
  amount: number;
  due_date: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  type: 'electricity' | 'water' | 'gas';
  status: 'pending' | 'paid' | 'overdue';
}

export interface ScraperResult {
  success: boolean;
  bills: UtilityBill[];
  error?: string;
}

export interface Scraper {
  scrape(): Promise<ScraperResult>;
}
