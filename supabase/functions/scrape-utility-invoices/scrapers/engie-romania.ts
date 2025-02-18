
import { BaseScraper, ScrapingResult, UtilityBill } from './base.ts';

export class EngieRomaniaScraper extends BaseScraper {
  private sessionCookies?: string;
  private csrfToken?: string;
  private readonly BASE_URL = 'https://my.engie.ro';
  private readonly TIMEOUT = 30000; // 30 seconds timeout

  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Accept-Language': 'en-US,en;q=0.9,ro;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
      });
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
      const initialResponse = await this.makeRequest(`${this.BASE_URL}/autentificare`);
      
      if (!initialResponse.ok) {
        console.error('Failed to access login page:', {
          status: initialResponse.status,
          statusText: initialResponse.statusText
        });
        return false;
      }

      // Get cookies
      const cookies = initialResponse.headers.get('set-cookie');
      if (!cookies) {
        console.error('No cookies received');
        return false;
      }
      this.sessionCookies = cookies;

      // Get CSRF token
      const pageContent = await initialResponse.text();
      const csrfMatch = pageContent.match(/name="_csrf" value="([^"]+)"/);
      
      if (!csrfMatch) {
        console.error('No CSRF token found');
        return false;
      }
      this.csrfToken = csrfMatch[1];

      // Prepare login data
      const formData = new URLSearchParams();
      formData.append('username', this.credentials.username);
      formData.append('password', this.credentials.password);
      formData.append('_csrf', this.csrfToken);
      formData.append('remember-me', 'true');

      // Perform login
      const loginResponse = await this.makeRequest(`${this.BASE_URL}/autentificare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': this.sessionCookies,
          'Origin': this.BASE_URL,
          'Referer': `${this.BASE_URL}/autentificare`
        },
        body: formData.toString(),
        redirect: 'manual'
      });

      // Check login success
      if (loginResponse.status === 302) {
        const newCookies = loginResponse.headers.get('set-cookie');
        if (newCookies) {
          this.sessionCookies = newCookies;
        }
        console.log('Login successful');
        return true;
      }

      console.error('Login failed:', {
        status: loginResponse.status,
        statusText: loginResponse.statusText
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
      const billsResponse = await this.makeRequest(`${this.BASE_URL}/facturi-plati`, {
        headers: {
          'Cookie': this.sessionCookies,
          'Referer': this.BASE_URL
        }
      });

      if (!billsResponse.ok) {
        throw new Error('Failed to access bills page');
      }

      const pageContent = await billsResponse.text();
      
      // Extract bills data from the page content
      // This is a simplified example - adjust based on actual page structure
      const bills: UtilityBill[] = [];
      
      // Example bill extraction (modify based on actual page structure)
      const billElements = pageContent.match(/<div class="factura">(.*?)<\/div>/g) || [];
      
      for (const element of billElements) {
        // Extract bill details (modify based on actual HTML structure)
        const amount = element.match(/suma: (\d+)/)?.[1];
        const dueDate = element.match(/scadenta: (\d{4}-\d{2}-\d{2})/)?.[1];
        
        if (amount && dueDate) {
          bills.push({
            amount: Number(amount),
            due_date: dueDate,
            type: 'gas',
            status: 'pending'
          });
        }
      }

      console.log(`Found ${bills.length} bills`);
      return bills;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }
}
