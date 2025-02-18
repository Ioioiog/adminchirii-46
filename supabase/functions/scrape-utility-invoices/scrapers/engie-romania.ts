
import { BaseScraper, ScrapingResult, UtilityBill } from './base.ts';

export class EngieRomaniaScraper extends BaseScraper {
  private sessionCookies?: string;
  private csrfToken?: string;
  private readonly BASE_URL = 'https://my.engie.ro';
  private readonly TIMEOUT = 30000;

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ro,en-US;q=0.7,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private extractCsrfToken(html: string): string | null {
    // Look for Laravel CSRF token in meta tag
    const metaMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    if (metaMatch && metaMatch[1]) {
      console.log('Found CSRF token in meta tag');
      return metaMatch[1];
    }

    // Look for Laravel CSRF token in window.Laravel object
    const scriptMatch = html.match(/window\.Laravel\s*=\s*{\s*csrfToken:\s*"([^"]+)"/);
    if (scriptMatch && scriptMatch[1]) {
      console.log('Found CSRF token in window.Laravel object');
      return scriptMatch[1];
    }

    // Look for hidden input field
    const inputMatch = html.match(/<input[^>]*name="_token"[^>]*value="([^"]+)"/);
    if (inputMatch && inputMatch[1]) {
      console.log('Found CSRF token in hidden input');
      return inputMatch[1];
    }

    console.error('Could not find CSRF token in HTML');
    return null;
  }

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
      
      // Try logging in with multiple attempts
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
        return {
          success: false,
          bills: [],
          error: 'Failed to login to ENGIE Romania after multiple attempts'
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
      console.log('Starting login process...');
      
      // Initial request to get CSRF token and cookies
      const initialResponse = await this.makeRequest(`${this.BASE_URL}/login`);
      
      if (!initialResponse.ok) {
        console.error('Failed to access login page:', {
          status: initialResponse.status,
          statusText: initialResponse.statusText
        });
        return false;
      }

      // Get cookies including Laravel session
      const cookies = initialResponse.headers.get('set-cookie');
      if (!cookies) {
        console.error('No cookies received');
        return false;
      }
      this.sessionCookies = cookies;
      console.log('Received cookies:', cookies);

      // Get page content and extract CSRF token
      const pageContent = await initialResponse.text();
      console.log('Got login page, searching for CSRF token...');
      
      this.csrfToken = this.extractCsrfToken(pageContent);
      if (!this.csrfToken) {
        console.error('Failed to extract CSRF token');
        return false;
      }
      console.log('Found CSRF token:', this.csrfToken);

      // Prepare login data
      const formData = new URLSearchParams();
      formData.append('email', this.credentials.username);
      formData.append('password', this.credentials.password);
      formData.append('_token', this.csrfToken);
      formData.append('remember', '1');

      // Perform login
      const loginResponse = await this.makeRequest(`${this.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.sessionCookies,
          'Origin': this.BASE_URL,
          'Referer': `${this.BASE_URL}/login`,
          'X-CSRF-TOKEN': this.csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData.toString(),
        redirect: 'manual'
      });

      // Check login response
      const responseStatus = loginResponse.status;
      console.log('Login response status:', responseStatus);

      if (responseStatus === 302 || responseStatus === 200) {
        const newCookies = loginResponse.headers.get('set-cookie');
        if (newCookies) {
          this.sessionCookies = newCookies;
          console.log('Received new session cookies');
        }

        // Verify login success by checking redirect or response
        const location = loginResponse.headers.get('location');
        if (location && (location.includes('/dashboard') || location.includes('/home'))) {
          console.log('Login successful - redirected to dashboard');
          return true;
        }

        const responseBody = await loginResponse.text();
        if (responseBody.includes('dashboard') || responseBody.includes('Deconectare')) {
          console.log('Login successful - found dashboard content');
          return true;
        }
      }

      console.error('Login failed:', {
        status: responseStatus,
        location: loginResponse.headers.get('location')
      });
      return false;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  protected async fetchBills(): Promise<UtilityBill[]> {
    if (!this.sessionCookies) {
      throw new Error('Not logged in');
    }

    try {
      // Get bills page
      const billsResponse = await this.makeRequest(`${this.BASE_URL}/facturi`, {
        headers: {
          'Cookie': this.sessionCookies,
          'X-CSRF-TOKEN': this.csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `${this.BASE_URL}/dashboard`
        }
      });

      if (!billsResponse.ok) {
        throw new Error('Failed to access bills page');
      }

      const responseData = await billsResponse.json();
      console.log('Bills response:', responseData);

      // Transform the response data into our bill format
      return (responseData.facturi || []).map((bill: any) => ({
        amount: Number(bill.suma || 0),
        due_date: bill.data_scadenta,
        type: 'gas',
        bill_date: bill.data_emitere,
        meter_reading: bill.index_contor,
        consumption: Number(bill.consum || 0),
        period_start: bill.perioada_start,
        period_end: bill.perioada_sfarsit,
        status: 'pending'
      }));
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }
}
