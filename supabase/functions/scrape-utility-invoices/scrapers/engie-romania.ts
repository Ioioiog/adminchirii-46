
import { Scraper, ScraperResult } from './base.ts';

export class EngieRomaniaScraper implements Scraper {
  private username: string;
  private password: string;
  private browser: any;
  private page: any;

  constructor(credentials: { username: string; password: string }) {
    this.username = credentials.username;
    this.password = credentials.password;
  }

  async scrape(): Promise<ScraperResult> {
    console.log('Starting ENGIE Romania scraping process');
    
    try {
      console.log('Initializing browser...');
      const browser = await Deno.createBrowser();
      const page = await browser.newPage();
      
      console.log('Navigating to ENGIE login page');
      await page.goto('https://engie.ro/myaccount/autentificare', {
        waitUntil: 'networkidle0'
      });

      // Handle cookie consent
      console.log('Handling cookie consent');
      try {
        const cookieButton = await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', {
          timeout: 5000
        });
        if (cookieButton) {
          await cookieButton.click();
          console.log('Cookie consent accepted');
        }
      } catch (error) {
        console.log('No cookie consent dialog found or already accepted');
      }

      // Login process
      console.log('Attempting login...');
      await page.type('#username', this.username);
      await page.type('#password', this.password);
      
      // Submit login form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);

      // Check for login errors
      const errorElement = await page.$('.error-message');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }

      // Navigate to invoices page
      console.log('Navigating to invoices page');
      await page.goto('https://engie.ro/myaccount/facturi-plati', {
        waitUntil: 'networkidle0'
      });

      // Extract invoice data
      console.log('Extracting invoice information');
      const bills = await page.evaluate(() => {
        const invoiceElements = document.querySelectorAll('.invoice-item');
        return Array.from(invoiceElements).map(element => {
          const amountText = element.querySelector('.amount')?.textContent || '0';
          const amount = parseFloat(amountText.replace(/[^\d.-]/g, ''));
          
          const dueDateText = element.querySelector('.due-date')?.textContent || '';
          const dueDate = new Date(dueDateText);
          
          const periodText = element.querySelector('.period')?.textContent || '';
          const [periodStart, periodEnd] = periodText.split('-').map(d => new Date(d.trim()));
          
          const invoiceNumber = element.querySelector('.invoice-number')?.textContent || '';
          
          return {
            amount,
            due_date: dueDate.toISOString().split('T')[0],
            invoice_number: invoiceNumber,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            type: 'gas',
            status: 'pending'
          };
        });
      });

      console.log(`Found ${bills.length} bills`);

      // Download invoice PDFs
      console.log('Downloading invoice PDFs');
      for (const bill of bills) {
        try {
          const downloadButton = await page.$(`.invoice-item[data-invoice="${bill.invoice_number}"] .download-button`);
          if (downloadButton) {
            await downloadButton.click();
            await page.waitForSelector('.download-complete', { timeout: 5000 });
            console.log(`Downloaded PDF for invoice ${bill.invoice_number}`);
          }
        } catch (error) {
          console.error(`Failed to download PDF for invoice ${bill.invoice_number}:`, error);
        }
      }

      await browser.close();
      console.log('Scraping completed successfully');

      return {
        success: true,
        bills
      };
    } catch (error) {
      console.error('Scraping failed:', error);
      return {
        success: false,
        error: error.message,
        bills: []
      };
    }
  }
}
