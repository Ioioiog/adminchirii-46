
export interface ScrapingResult {
  success: boolean;
  bills: UtilityBill[];
  error?: string;
}

export interface UtilityBill {
  amount: number;
  due_date: string;
  type: string;
  bill_date?: string;
  meter_reading?: number;
  consumption?: number;
  period_start?: string;
  period_end?: string;
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

  abstract scrape(): Promise<ScrapingResult>;
  
  protected async login(): Promise<boolean> {
    throw new Error('Login method must be implemented by provider scraper');
  }

  protected async fetchBills(): Promise<UtilityBill[]> {
    throw new Error('FetchBills method must be implemented by provider scraper');
  }

  protected validateCredentials(): boolean {
    return Boolean(this.credentials.username && this.credentials.password);
  }
}
