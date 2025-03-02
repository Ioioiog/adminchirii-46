
import { BillScraper } from './index.ts';
import { ScrapingResult } from '../constants.ts';

export class EngieRomaniaScraperImpl implements BillScraper {
  async scrape(username: string, password: string): Promise<ScrapingResult> {
    console.log('Executing ENGIE Romania scraper with username:', username);
    
    try {
      const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
      
      if (!BROWSERLESS_API_KEY) {
        throw new Error('BROWSERLESS_API_KEY environment variable is not set');
      }
      
      // Browserless.io API endpoint for connecting to a remote browser
      const browserlessEndpoint = `https://chrome.browserless.io/content?token=${BROWSERLESS_API_KEY}`;
      
      // The script that will be executed in the browser
      const script = `
        async function run() {
          try {
            console.log('Starting ENGIE Romania scraping...');
            
            // Navigate to login page
            await page.goto('https://servicii.engie.ro/pages/autentificare-1.jsf');
            await page.waitForSelector('#j_username', { timeout: 30000 });
            console.log('Login page loaded');
            
            // Fill in login form
            await page.type('#j_username', '${username}');
            await page.type('#j_password', '${password}');
            console.log('Credentials filled in');
            
            // Click login button
            await page.click('.login-panel input[type="submit"]');
            console.log('Login button clicked');
            
            // Wait for the dashboard to load - check for a common element on the dashboard
            await page.waitForSelector('.ui-dashboard-column', { timeout: 30000 });
            console.log('Dashboard loaded');
            
            // Navigate to bills page
            await page.goto('https://servicii.engie.ro/pages/facturi-plati-1.jsf');
            await page.waitForSelector('.ui-datatable-tablewrapper', { timeout: 30000 });
            console.log('Bills page loaded');
            
            // Extract bills data
            const bills = await page.evaluate(() => {
              const rows = Array.from(document.querySelectorAll('.ui-datatable-data tr'));
              return rows.map(row => {
                const columns = row.querySelectorAll('td');
                if (columns.length < 5) return null;
                
                const dateText = columns[0]?.textContent?.trim() || '';
                const invoiceNumberText = columns[1]?.textContent?.trim() || '';
                const amountText = columns[3]?.textContent?.trim() || '0';
                
                // Parse amount - remove currency symbol and convert to number
                const amountStr = amountText.replace(/[^0-9.,]/g, '').replace(',', '.');
                const amount = parseFloat(amountStr);
                
                // Parse date in format DD.MM.YYYY
                const dueDateParts = dateText.split('.');
                let dueDate = '';
                if (dueDateParts.length === 3) {
                  dueDate = \`\${dueDateParts[2]}-\${dueDateParts[1]}-\${dueDateParts[0]}\`;
                }
                
                return {
                  amount: isNaN(amount) ? 0 : amount,
                  due_date: dueDate || new Date().toISOString().split('T')[0],
                  invoice_number: invoiceNumberText || \`ENGIE-\${Date.now()}\`,
                  type: 'gas',
                  status: 'pending'
                };
              }).filter(bill => bill !== null);
            });
            
            console.log('Bills extracted:', JSON.stringify(bills));
            
            // Logout
            await page.goto('https://servicii.engie.ro/pages/j_spring_security_logout');
            console.log('Logged out');
            
            return { success: true, bills };
          } catch (error) {
            console.error('Error in browser script:', error);
            return { 
              success: false, 
              error: \`Browser script error: \${error.message}\` 
            };
          }
        }
        
        return run();
      `;
      
      // Send the script to browserless.io
      const response = await fetch(browserlessEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          code: script,
          context: {
            waitForTimeout: 60000, // 60 second timeout
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Browserless error:', errorText);
        throw new Error(`Browserless request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Browserless result:', JSON.stringify(result));
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to scrape ENGIE website'
        };
      }
      
      if (!result.bills || result.bills.length === 0) {
        return {
          success: true,
          message: 'No bills found on the ENGIE account',
          bills: []
        };
      }
      
      return {
        success: true,
        message: `Successfully scraped ${result.bills.length} bills from ENGIE`,
        bills: result.bills
      };
      
    } catch (error) {
      console.error('ENGIE scraper error:', error);
      return {
        success: false,
        error: `ENGIE scraping failed: ${error.message}`
      };
    }
  }
}
