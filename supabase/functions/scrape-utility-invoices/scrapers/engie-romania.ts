
export interface EngieScraperResult {
  success: boolean;
  bills: Array<{
    amount: number;
    due_date: string;
    invoice_number: string;
    period_start: string;
    period_end: string;
    type: string;
    status: string;
  }>;
  error?: string;
}

export interface EngieScraperCredentials {
  username: string;
  password: string;
}
