
import { BaseScraper, ScrapingResult, UtilityBill } from './base.ts';

export class EngieRomaniaScraper extends BaseScraper {
  private sessionCookies?: string;
  private csrfToken?: string;
  private readonly BASE_URL = 'https://my.engie.ro';
  private readonly API_URL = 'https://my.engie.ro/api';
  private readonly TIMEOUT = 30000;

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      console.log(`Making request to: ${url}`, {
        method: options.method || 'GET',
        headers: options.headers
      });

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
          'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Request failed:', {
          url,
          status: response.status,
          statusText: response.statusText,
          response: text
        });
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async scrape(): Promise<ScrapingResult> {
    try {
      if (!this.validateCredentials()) {
        console.error('Invalid credentials provided');
        return {
          success: false,
          bills: [],
          error: 'Invalid credentials provided'
        };
      }

      console.log('Starting ENGIE Romania scraping process...');
      
      let loggedIn = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Login attempt ${attempt}/3`);
        loggedIn = await this.login();
        if (loggedIn) break;
        
        if (attempt < 3) {
          console.log('Waiting before next attempt...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      if (!loggedIn) {
        console.error('All login attempts failed');
        return {
          success: false,
          bills: [],
          error: 'Failed to login to ENGIE Romania after multiple attempts'
        };
      }

      console.log('Login successful, fetching bills...');
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
      console.log('Starting login process...');
      
      // Get initial session and CSRF token
      const initialResponse = await this.makeRequest(`${this.BASE_URL}/api/auth/csrf`);
      if (!initialResponse.ok) {
        console.error('Failed to get CSRF token');
        return false;
      }

      const csrfData = await initialResponse.json();
      this.csrfToken = csrfData.token;
      this.sessionCookies = initialResponse.headers.get('set-cookie');

      console.log('Got CSRF token and session cookies');

      // Perform login
      const loginResponse = await this.makeRequest(`${this.BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.sessionCookies || '',
          'X-CSRF-TOKEN': this.csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          email: this.credentials.username,
          password: this.credentials.password,
          remember: true
        })
      });

      if (!loginResponse.ok) {
        console.error('Login request failed:', {
          status: loginResponse.status,
          statusText: loginResponse.statusText
        });
        return false;
      }

      const loginData = await loginResponse.json();
      if (loginData.token) {
        console.log('Login successful, received authentication token');
        return true;
      }

      console.error('Login failed - no token received');
      return false;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  protected async fetchBills(): Promise<UtilityBill[]> {
    if (!this.sessionCookies || !this.csrfToken) {
      throw new Error('Not logged in - missing session cookies or CSRF token');
    }

    try {
      // Get all consumption places first
      const placesResponse = await this.makeRequest(`${this.API_URL}/locuri-consum`, {
        headers: {
          'Cookie': this.sessionCookies,
          'X-CSRF-TOKEN': this.csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!placesResponse.ok) {
        throw new Error('Failed to fetch consumption places');
      }

      const places = await placesResponse.json();
      console.log(`Found ${places.length} consumption places`);

      // Get bills for each consumption place
      const allBills: UtilityBill[] = [];
      for (const place of places) {
        console.log(`Fetching bills for consumption place: ${place.id}`);
        
        const billsResponse = await this.makeRequest(
          `${this.API_URL}/facturi?loc_consum=${place.id}`,
          {
            headers: {
              'Cookie': this.sessionCookies,
              'X-CSRF-TOKEN': this.csrfToken,
              'X-Requested-With': 'XMLHttpRequest'
            }
          }
        );

        if (!billsResponse.ok) {
          console.error(`Failed to fetch bills for place ${place.id}`);
          continue;
        }

        const placeBills = await billsResponse.json();
        console.log(`Found ${placeBills.length} bills for place ${place.id}`);

        const transformedBills = placeBills.map((bill: any) => ({
          amount: Number(bill.valoare_totala || 0),
          due_date: bill.data_scadenta,
          type: 'gas',
          bill_date: bill.data_emitere,
          meter_reading: bill.index_contor,
          consumption: Number(bill.consum || 0),
          period_start: bill.perioada_inceput,
          period_end: bill.perioada_sfarsit,
          status: 'pending'
        }));

        allBills.push(...transformedBills);
      }

      console.log(`Total bills found: ${allBills.length}`);
      return allBills;

    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }
}
