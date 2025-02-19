
import { Scraper, ScraperResult } from './base.ts';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { solve } from 'https://deno.land/x/captcha_solver@v1.0.0/mod.ts';

export class EngieRomaniaScraper implements Scraper {
  private username: string;
  private password: string;
  private captchaApiKey: string;

  constructor(credentials: { 
    username: string; 
    password: string;
    captchaApiKey: string;
  }) {
    this.username = credentials.username;
    this.password = credentials.password;
    this.captchaApiKey = credentials.captchaApiKey;
  }

  private async handleCookies(page: any) {
    console.log('🍪 Checking for cookie consent...');
    try {
      await page.waitForSelector('#cookieConsentBtnRight', { timeout: 5000 });
      const acceptButton = await page.$('#cookieConsentBtnRight');
      if (acceptButton) {
        console.log('✅ Clicking "Acceptă toate"');
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      console.log('✅ No cookie modal detected, proceeding...');
    }
  }

  private async solveCaptcha(page: any) {
    console.log('🔍 Checking for reCAPTCHA...');
    try {
      await page.waitForSelector('[data-sitekey]', { timeout: 5000 });
      const sitekey = await page.$eval('[data-sitekey]', (el: any) => el.getAttribute('data-sitekey'));

      console.log('🔑 Requesting CAPTCHA solution...');
      const captchaSolution = await solve(this.captchaApiKey, {
        googlekey: sitekey,
        pageurl: page.url(),
        invisible: true
      });

      console.log('✅ CAPTCHA solved. Injecting...');
      await page.evaluate((token: string) => {
        const textArea = document.querySelector('textarea[name="g-recaptcha-response"]');
        const input = document.querySelector('input[name="g-recaptcha-response"]');
        if (textArea) textArea.value = token;
        if (input) input.value = token;
      }, captchaSolution);
    } catch (error) {
      console.error('❌ CAPTCHA Error:', error);
      throw error;
    }
  }

  private async login(page: any) {
    console.log('🔑 Navigating to login page...');
    await page.goto('https://my.engie.ro/autentificare', { waitUntil: 'networkidle2' });

    await this.handleCookies(page);

    console.log('📝 Entering login credentials...');
    await page.waitForSelector('#username', { visible: true });
    await page.waitForSelector('#password', { visible: true });

    // Clear input fields before typing
    await page.evaluate(() => {
      const username = document.querySelector('#username');
      const password = document.querySelector('#password');
      if (username) username.value = '';
      if (password) password.value = '';
    });

    await page.type('#username', this.username, { delay: 150 });

    // Handle password typing with retries
    let passwordCorrectlyEntered = false;
    for (let i = 0; i < 3; i++) {
      console.log(`🔑 Typing password attempt ${i + 1}...`);

      await page.evaluate(() => {
        const password = document.querySelector('#password');
        if (password) password.value = '';
      });

      await page.type('#password', this.password, { delay: 150 });

      const enteredPassword = await page.evaluate(() => {
        const password = document.querySelector('#password');
        return password ? password.value : '';
      });

      if (enteredPassword === this.password) {
        console.log('✅ Password entered correctly');
        passwordCorrectlyEntered = true;
        break;
      } else {
        console.log(`❌ Password incorrect. Retrying (${i + 1}/3)...`);
      }
    }

    if (!passwordCorrectlyEntered) {
      throw new Error('❌ Failed to enter full password.');
    }

    await this.solveCaptcha(page);

    console.log('🔓 Clicking login button...');
    await page.click('button[type="submit"].nj-btn.nj-btn--primary');

    console.log('⏳ Waiting for login to process...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    const isLoggedIn = await page.$('.dashboard');
    if (!isLoggedIn) throw new Error('❌ Login failed. Check credentials or CAPTCHA.');

    console.log('✅ Login successful!');
  }

  private async getInvoices(page: any) {
    console.log('📄 Navigating to invoices page...');
    await page.goto('https://my.engie.ro/facturi/istoric', { waitUntil: 'networkidle2' });

    console.log('⏳ Waiting for invoices table...');
    await page.waitForSelector('.invoice-item', { timeout: 15000 });

    const invoices = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.invoice-item')).map(invoice => {
        const amountText = invoice.querySelector('.invoice-amount')?.textContent?.trim() || '0';
        const amount = parseFloat(amountText.replace(/[^\d.-]/g, ''));

        return {
          invoice_number: invoice.querySelector('.invoice-number')?.textContent?.trim() || '',
          amount,
          due_date: invoice.querySelector('.due-date')?.textContent?.trim() || '',
          status: invoice.querySelector('.status')?.textContent?.trim() || '',
          download_link: invoice.querySelector('.download-button')?.getAttribute('href') || ''
        };
      });
    });

    console.log(`✅ Found ${invoices.length} invoices.`);
    return invoices;
  }

  async scrape(): Promise<ScraperResult> {
    console.log('Starting ENGIE Romania scraping process');
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });
    
    const page = await browser.newPage();

    try {
      await this.login(page);
      const invoices = await this.getInvoices(page);

      const bills = invoices.map(invoice => ({
        amount: invoice.amount,
        due_date: new Date(invoice.due_date).toISOString().split('T')[0],
        invoice_number: invoice.invoice_number,
        period_start: new Date().toISOString().split('T')[0], // ENGIE doesn't show period dates, using current date
        period_end: new Date().toISOString().split('T')[0],
        type: 'gas',
        status: invoice.status.toLowerCase() === 'paid' ? 'paid' : 'pending'
      }));

      console.log('✅ Scraping completed successfully');
      return {
        success: true,
        bills
      };
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      return {
        success: false,
        error: error.message,
        bills: []
      };
    } finally {
      await browser.close();
    }
  }
}
