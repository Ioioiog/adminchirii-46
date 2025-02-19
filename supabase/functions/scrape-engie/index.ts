
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScraperCredentials {
  username: string;
  password: string;
}

interface Bill {
  amount: number;
  due_date: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  type: 'gas' | 'electricity';
  status: 'pending' | 'paid';
}

interface ScraperResult {
  success: boolean;
  bills: Bill[];
  error?: string;
}

async function solveCaptcha(page: any, captchaApiKey: string): Promise<void> {
  console.log('🔍 Solving reCAPTCHA...');
  
  // Get the reCAPTCHA sitekey
  const sitekey = await page.evaluate(() => {
    const element = document.querySelector('[data-sitekey]');
    return element ? element.getAttribute('data-sitekey') : null;
  });

  if (!sitekey) {
    throw new Error('Could not find reCAPTCHA sitekey');
  }

  const pageUrl = await page.url();

  // Submit CAPTCHA solving request
  const response = await fetch('https://2captcha.com/in.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: captchaApiKey,
      method: 'userrecaptcha',
      googlekey: sitekey,
      pageurl: pageUrl,
      json: 1
    })
  });

  const result = await response.json();
  if (!result.request) {
    throw new Error('Failed to submit CAPTCHA solving request');
  }

  // Poll for solution
  const captchaId = result.request;
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const checkResponse = await fetch(`https://2captcha.com/res.php?key=${captchaApiKey}&action=get&id=${captchaId}&json=1`);
    const checkResult = await checkResponse.json();
    
    if (checkResult.status === 1) {
      // Insert the solution
      await page.evaluate((token: string) => {
        document.querySelectorAll<HTMLTextAreaElement>('.g-recaptcha-response').forEach(element => {
          element.innerHTML = token;
        });
        document.querySelectorAll<HTMLInputElement>('input[name="g-recaptcha-response"]').forEach(element => {
          element.value = token;
        });
      }, checkResult.request);
      
      console.log('✅ CAPTCHA solved successfully');
      return;
    }
  }

  throw new Error('CAPTCHA solving timeout');
}

async function handleCookies(page: any) {
  console.log('🍪 Checking for cookie consent...');
  try {
    await page.waitForSelector('#cookieConsentBtnRight', { timeout: 5000 });
    await page.evaluate(() => {
      const button = document.querySelector('#cookieConsentBtnRight') as HTMLElement;
      if (button) button.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch {
    console.log('✅ No cookie modal detected, proceeding...');
  }
}

async function scrapeEngie(credentials: ScraperCredentials, captchaApiKey: string): Promise<ScraperResult> {
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
    // Login process
    console.log('🔑 Navigating to login page...');
    await page.goto('https://my.engie.ro/autentificare');
    await page.waitForSelector('#username', { visible: true });
    
    await handleCookies(page);

    // Fill credentials
    console.log('📝 Entering login credentials...');
    await page.evaluate((username: string, password: string) => {
      const usernameInput = document.querySelector('#username') as HTMLInputElement;
      const passwordInput = document.querySelector('#password') as HTMLInputElement;
      if (usernameInput) usernameInput.value = username;
      if (passwordInput) passwordInput.value = password;
    }, credentials.username, credentials.password);

    await solveCaptcha(page, captchaApiKey);

    // Submit login
    console.log('🔓 Submitting login form...');
    await page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"].nj-btn.nj-btn--primary') as HTMLButtonElement;
      if (submitButton) submitButton.click();
    });

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Check login success
    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('.dashboard');
    });

    if (!isLoggedIn) {
      throw new Error('Login failed');
    }

    // Navigate to invoices
    console.log('📄 Navigating to invoices page...');
    await page.goto('https://my.engie.ro/facturi/istoric');
    await page.waitForSelector('table', { timeout: 15000 });

    // Extract invoices
    const bills = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const text = (cell: Element) => cell.textContent?.trim() || '';
        
        const amountText = text(cells[4]).replace(/[^\d.,]/g, '').replace(',', '.');
        const amount = parseFloat(amountText);
        const dueDate = text(cells[2]);

        return {
          amount,
          due_date: dueDate,
          invoice_number: text(cells[0]),
          period_start: dueDate,
          period_end: dueDate,
          type: 'gas',
          status: text(cells[5]).toLowerCase().includes('platit') ? 'paid' : 'pending'
        };
      });
    });

    console.log(`✅ Found ${bills.length} invoices`);
    return { success: true, bills };

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return {
      success: false,
      bills: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  } finally {
    await browser.close();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const captchaApiKey = Deno.env.get("CAPTCHA_API_KEY");
    if (!captchaApiKey) {
      throw new Error("CAPTCHA API key not configured");
    }

    const requestData = await req.json();
    console.log('Received scraping request for:', requestData.username);

    const result = await scrapeEngie({
      username: requestData.username,
      password: requestData.password
    }, captchaApiKey);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in scrape-engie function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        bills: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
