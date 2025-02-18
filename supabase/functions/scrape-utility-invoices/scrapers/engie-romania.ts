
import { BaseScraper, ScrapingResult, UtilityBill } from './base.ts';

export class EngieRomaniaScraper extends BaseScraper {
  private sessionCookies?: string;
  private readonly BASE_URL = 'https://my.engie.ro';

  async scrape(): Promise<ScrapingResult> {
    try {
      if (!this.validateCredentials()) {
        return {
          success: false,
          bills: [],
          error: 'Invalid credentials provided'
        };
      }

      console.log('Starting ENGIE Romania scraping process...');
      const loggedIn = await this.login();
      
      if (!loggedIn) {
        return {
          success: false,
          bills: [],
          error: 'Failed to login to ENGIE Romania'
        };
      }

      const bills = await this.fetchBills();
      return {
        success: true,
        bills
      };
    } catch (error) {
      console.error('ENGIE Romania scraping failed:', error);
      return {
        success: false,
        bills: [],
        error: error.message
      };
    }
  }

  protected async login(): Promise<boolean> {
    try {
      console.log('Attempting to login to ENGIE Romania...');
      
      // First get the login page to capture any necessary tokens/cookies
      const loginPageResponse = await fetch(`${this.BASE_URL}/autentificare`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!loginPageResponse.ok) {
        throw new Error('Failed to load login page');
      }

      // Get cookies from initial response
      const cookies = loginPageResponse.headers.get('set-cookie');
      
      // Perform login
      const loginResponse = await fetch(`${this.BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': `${this.BASE_URL}/autentificare`
        },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password
        })
      });

      if (!loginResponse.ok) {
        console.error('Login failed:', await loginResponse.text());
        return false;
      }

      this.sessionCookies = loginResponse.headers.get('set-cookie');
      console.log('Login successful');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  protected async fetchBills(): Promise<UtilityBill[]> {
    if (!this.sessionCookies) {
      throw new Error('Not logged in to ENGIE Romania');
    }

    try {
      console.log('Fetching bills from ENGIE Romania...');
      
      // Fetch bills from the invoices endpoint
      const billsResponse = await fetch(`${this.BASE_URL}/api/facturi`, {
        headers: {
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!billsResponse.ok) {
        throw new Error('Failed to fetch bills');
      }

      const billsData = await billsResponse.json();
      
      // Transform the ENGIE-specific bill format to our standard format
      return billsData.facturi.map((bill: any) => ({
        amount: Number(bill.suma),
        due_date: bill.data_scadenta,
        type: 'gas', // ENGIE Romania primarily provides gas
        bill_date: bill.data_emitere,
        meter_reading: bill.index_contor,
        consumption: bill.consum,
        period_start: bill.perioada_start,
        period_end: bill.perioada_sfarsit
      }));
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      throw error;
    }
  }

  private parseConsumption(text: string): number {
    // Remove any non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    return Number(numericValue);
  }
}
