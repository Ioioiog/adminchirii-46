
export interface UtilityBill {
  amount: number;
  due_date: string;
  type: string;
  bill_date?: string;
  meter_reading?: string;
  consumption?: number;
  period_start?: string;
  period_end?: string;
  status?: string;
}

export interface ScrapingResult {
  success: boolean;
  bills: UtilityBill[];
  error?: string;
}

export interface ScraperCredentials {
  username: string;
  password: string;
}

export abstract class BaseScraper {
  protected credentials: ScraperCredentials;

  constructor(credentials: ScraperCredentials) {
    this.credentials = credentials;
  }

  protected validateCredentials(): boolean {
    return !!(this.credentials.username && this.credentials.password);
  }

  abstract scrape(): Promise<ScrapingResult>;
}
