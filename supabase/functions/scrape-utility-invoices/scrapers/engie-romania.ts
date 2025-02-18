
import { BaseScraper, ScrapingResult, UtilityBill } from './base.ts';

export class EngieRomaniaScraper extends BaseScraper {
  private sessionCookies?: string;
  private csrfToken?: string;
  private readonly BASE_URL = 'https://my.engie.ro';

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
      
      // First get the login page to capture CSRF token and session cookies
      const loginPageResponse = await fetch(`${this.BASE_URL}/autentificare`, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        }
      });

      if (!loginPageResponse.ok) {
        const errorText = await loginPageResponse.text();
        console.error('Failed to load login page:', {
          status: loginPageResponse.status,
          statusText: loginPageResponse.statusText,
          headers: Object.fromEntries(loginPageResponse.headers.entries()),
          body: errorText
        });
        throw new Error('Failed to load login page');
      }

      // Get cookies and store them
      const cookies = loginPageResponse.headers.get('set-cookie');
      if (!cookies) {
        console.error('No cookies received from login page');
        throw new Error('No cookies received from login page');
      }
      this.sessionCookies = cookies;
      console.log('Received initial cookies');

      // Extract CSRF token from the response
      const pageContent = await loginPageResponse.text();
      console.log('Got login page content, searching for CSRF token...');
      
      // Look for both possible CSRF token formats
      const csrfMatch = pageContent.match(/<meta name="_csrf" content="([^"]+)"/) || 
                       pageContent.match(/name="_csrf" value="([^"]+)"/);
                       
      if (!csrfMatch) {
        console.error('Could not find CSRF token in page content');
        throw new Error('Could not find CSRF token');
      }
      this.csrfToken = csrfMatch[1];
      console.log('Found CSRF token');

      // Prepare login request body
      const formData = new URLSearchParams();
      formData.append('username', this.credentials.username);
      formData.append('password', this.credentials.password);
      formData.append('_csrf', this.csrfToken);
      formData.append('remember-me', 'true');
      
      // Log request preparation (without sensitive data)
      console.log('Preparing login request:', {
        url: `${this.BASE_URL}/login`,
        hasCsrf: !!this.csrfToken,
        hasCookies: !!this.sessionCookies,
        username: this.credentials.username
      });

      // Perform login
      const loginResponse = await fetch(`${this.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `${this.BASE_URL}/autentificare`,
          'Origin': this.BASE_URL,
          'X-CSRF-TOKEN': this.csrfToken,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1'
        },
        body: formData.toString(),
        redirect: 'manual'
      });

      // Log the login response details (without sensitive data)
      console.log('Login response:', {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        headers: Object.fromEntries(loginResponse.headers.entries())
      });

      // Check for successful login (usually indicated by a 302 redirect)
      if (loginResponse.status === 302) {
        const newCookies = loginResponse.headers.get('set-cookie');
        if (newCookies) {
          this.sessionCookies = newCookies;
          console.log('Received new session cookies after login');
        }
        console.log('Login successful (302 redirect received)');
        return true;
      }

      // If we get here, login failed
      const responseText = await loginResponse.text();
      console.error('Login failed:', {
        status: loginResponse.status,
        headers: Object.fromEntries(loginResponse.headers.entries()),
        body: responseText
      });
      return false;
    } catch (error) {
      console.error('Login error:', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  protected async fetchBills(): Promise<UtilityBill[]> {
    if (!this.sessionCookies) {
      throw new Error('Not logged in to ENGIE Romania');
    }

    try {
      console.log('Fetching bills from ENGIE Romania...');
      
      // First fetch the bills page to get any necessary tokens
      const billsPageResponse = await fetch(`${this.BASE_URL}/facturi`, {
        headers: {
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': this.BASE_URL,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin'
        }
      });

      if (!billsPageResponse.ok) {
        console.error('Failed to access bills page:', {
          status: billsPageResponse.status,
          statusText: billsPageResponse.statusText
        });
        throw new Error('Failed to access bills page');
      }

      // Fetch bills data
      const billsResponse = await fetch(`${this.BASE_URL}/api/facturi/toate`, {
        headers: {
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': `${this.BASE_URL}/facturi`,
          'X-CSRF-TOKEN': this.csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      });

      if (!billsResponse.ok) {
        const errorText = await billsResponse.text();
        console.error('Failed to fetch bills:', {
          status: billsResponse.status,
          statusText: billsResponse.statusText,
          body: errorText
        });
        throw new Error('Failed to fetch bills data');
      }

      const billsData = await billsResponse.json();
      console.log('Successfully fetched bills data:', {
        count: billsData.facturi?.length || 0
      });
      
      // Transform the ENGIE-specific bill format to our standard format
      return billsData.facturi.map((bill: any) => ({
        amount: Number(bill.valoare_factura || 0),
        due_date: bill.data_scadenta,
        type: 'gas',
        bill_date: bill.data_emitere,
        meter_reading: bill.index_contor,
        consumption: Number(bill.consum || 0),
        period_start: bill.perioada_consum_start,
        period_end: bill.perioada_consum_sfarsit,
        status: bill.status || 'pending'
      }));
    } catch (error) {
      console.error('Failed to fetch bills:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
