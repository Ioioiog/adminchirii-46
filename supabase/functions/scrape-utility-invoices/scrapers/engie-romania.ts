
import { Scraper, ScraperResult, UtilityBill } from './base.ts';
import { solve } from "https://esm.sh/recaptcha2@1.3.3";

export class EngieRomaniaScraper implements Scraper {
  private username: string;
  private password: string;
  private CAPTCHA_API_KEY: string;

  constructor(credentials: { username: string; password: string }) {
    this.username = credentials.username;
    this.password = credentials.password;
    this.CAPTCHA_API_KEY = Deno.env.get('CAPTCHA_API_KEY') || '';

    if (!this.CAPTCHA_API_KEY) {
      console.error('Missing CAPTCHA API key');
      throw new Error('CAPTCHA API key is required');
    }
  }

  async scrape(): Promise<ScraperResult> {
    console.log('Starting ENGIE Romania scraping process');
    
    try {
      // Initialize Puppeteer
      const browser = await Deno.createBrowser();
      const page = await browser.newPage();
      
      console.log('Navigating to ENGIE login page');
      await page.goto('https://engie.ro/myaccount/autentificare');

      // Accept cookies
      console.log('Handling cookie consent');
      try {
        const cookieButton = await page.waitForSelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
        if (cookieButton) {
          await cookieButton.click();
          console.log('Cookie consent accepted');
        }
      } catch (error) {
        console.log('No cookie consent dialog found or already accepted');
      }

      // Handle reCAPTCHA
      console.log('Solving reCAPTCHA');
      try {
        const siteKey = await page.$eval('[data-sitekey]', el => el.getAttribute('data-sitekey'));
        if (siteKey) {
          const captchaToken = await solve(this.CAPTCHA_API_KEY, {
            sitekey: siteKey,
            pageurl: page.url(),
          });
          
          await page.evaluate(`document.querySelector('[name="g-recaptcha-response"]').innerHTML="${captchaToken}";`);
          console.log('reCAPTCHA solved successfully');
        }
      } catch (error) {
        console.error('Error solving reCAPTCHA:', error);
        throw new Error('Failed to solve reCAPTCHA');
      }

      // Fill login form
      console.log('Filling login credentials');
      await page.type('#username', this.username);
      await page.type('#password', this.password);
      
      // Submit login form
      console.log('Submitting login form');
      await Promise.all([
        page.waitForNavigation(),
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
      await page.goto('https://engie.ro/myaccount/facturi-plati');
      await page.waitForSelector('.invoices-list');

      // Extract invoice data
      console.log('Extracting invoice information');
      const bills: UtilityBill[] = await page.evaluate(() => {
        const invoiceElements = document.querySelectorAll('.invoice-item');
        return Array.from(invoiceElements).map(element => {
          const amountText = element.querySelector('.amount')?.textContent || '0';
          const amount = parseFloat(amountText.replace(/[^\d.-]/g, ''));
          
          const dueDateText = element.querySelector('.due-date')?.textContent || '';
          const dueDate = new Date(dueDateText);
          
          const periodText = element.querySelector('.period')?.textContent || '';
          const [periodStart, periodEnd] = periodText.split('-').map(d => d.trim());
          
          const invoiceNumber = element.querySelector('.invoice-number')?.textContent || '';
          
          return {
            amount,
            due_date: dueDate.toISOString().split('T')[0],
            invoice_number: invoiceNumber,
            period_start: periodStart,
            period_end: periodEnd,
            type: 'gas',
            status: 'pending'
          };
        });
      });

      // Download invoice PDFs
      console.log(`Found ${bills.length} invoices, downloading PDFs`);
      for (const bill of bills) {
        try {
          const downloadButton = await page.$(`.invoice-item[data-invoice="${bill.invoice_number}"] .download-button`);
          if (downloadButton) {
            await downloadButton.click();
            await page.waitForSelector('.download-complete');
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
