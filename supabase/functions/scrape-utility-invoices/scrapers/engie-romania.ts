
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

  private extractCsrfToken(html: string): string | null {
    // Try different possible CSRF token patterns
    const patterns = [
      /<input[^>]*name="_csrf"[^>]*value="([^"]+)"/i,
      /<meta[^>]*name="_csrf"[^>]*content="([^"]+)"/i,
      /var\s+csrf\s*=\s*['"]([^'"]+)['"]/i,
      /name="csrf-token"\s+content="([^"]+)"/i,
      /_csrf:\s*['"]([^'"]+)['"]/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        console.log('Found CSRF token using pattern:', pattern.toString());
        return match[1];
      }
    }

    // Log the first 1000 characters of HTML for debugging
    console.error('Could not find CSRF token in HTML. First 1000 chars:', html.substring(0, 1000));
    return null;
  }

  protected async login(): Promise<boolean> {
    try {
      console.log('Attempting to login to ENGIE Romania...');
      
      // First try to get the login page directly
      let loginPageResponse = await fetch(`${this.BASE_URL}/login`, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // If direct login page fails, try the authentication page
      if (!loginPageResponse.ok) {
        console.log('Direct login page failed, trying authentication page...');
        loginPageResponse = await fetch(`${this.BASE_URL}/autentificare`, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
      }

      if (!loginPageResponse.ok) {
        console.error('Failed to load login page:', {
          status: loginPageResponse.status,
          statusText: loginPageResponse.statusText
        });
        throw new Error('Failed to load login page');
      }

      // Get and store cookies
      const cookies = loginPageResponse.headers.get('set-cookie');
      if (!cookies) {
        console.error('No cookies received from login page');
        throw new Error('No cookies received from login page');
      }
      this.sessionCookies = cookies;
      console.log('Received initial cookies');

      // Get page content and extract CSRF token
      const pageContent = await loginPageResponse.text();
      console.log('Got login page content, searching for CSRF token...');
      
      // Extract CSRF token using multiple patterns
      const csrfToken = this.extractCsrfToken(pageContent);
      if (!csrfToken) {
        throw new Error('Could not find CSRF token');
      }
      this.csrfToken = csrfToken;
      console.log('Successfully extracted CSRF token');

      // Prepare login request body
      const formData = new URLSearchParams();
      formData.append('username', this.credentials.username);
      formData.append('password', this.credentials.password);
      formData.append('_csrf', this.csrfToken);
      formData.append('remember-me', 'true');
      
      console.log('Preparing login request with credentials and CSRF token');

      // Perform login
      const loginResponse = await fetch(`${this.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Origin': this.BASE_URL,
          'Referer': `${this.BASE_URL}/login`,
          'X-CSRF-TOKEN': this.csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: formData.toString(),
        redirect: 'manual'
      });

      // Log login response details (without sensitive data)
      console.log('Login response:', {
        status: loginResponse.status,
        statusText: loginResponse.statusText,
        hasLocationHeader: !!loginResponse.headers.get('location')
      });

      // Check for successful login (302 redirect or 200 OK)
      if (loginResponse.status === 302 || loginResponse.status === 200) {
        const newCookies = loginResponse.headers.get('set-cookie');
        if (newCookies) {
          this.sessionCookies = newCookies;
          console.log('Received new session cookies after login');
        }
        console.log('Login successful');
        return true;
      }

      // If login failed, log the response for debugging
      const responseText = await loginResponse.text();
      console.error('Login failed:', {
        status: loginResponse.status,
        hasLocationHeader: !!loginResponse.headers.get('location'),
        responseLength: responseText.length
      });
      return false;

    } catch (error) {
      console.error('Login error:', {
        message: error.message,
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
      
      // First fetch the bills page
      const billsPageResponse = await fetch(`${this.BASE_URL}/facturi`, {
        headers: {
          'Cookie': this.sessionCookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Referer': this.BASE_URL,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
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
      const billsResponse = await fetch(`${this.BASE_URL}/api/facturi`, {
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
          error: errorText
        });
        throw new Error('Failed to fetch bills data');
      }

      const billsData = await billsResponse.json();
      console.log('Successfully fetched bills data');
      
      // Transform bills data to our format
      return (billsData.facturi || []).map((bill: any) => ({
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
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
