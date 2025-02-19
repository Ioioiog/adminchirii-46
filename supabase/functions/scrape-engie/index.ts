
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chromium } from "https://deno.land/x/playwright@0.3.0/mod.ts";

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
  console.log('🔍 Attempting to solve reCAPTCHA...');
  
  const sitekey = await page.evaluate(() => {
    const element = document.querySelector('[data-sitekey]');
    return element?.getAttribute('data-sitekey') || null;
  });

  if (!sitekey) {
    throw new Error('Could not find reCAPTCHA sitekey');
  }

  const pageUrl = await page.evaluate(() => window.location.href);

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

  const captchaId = result.request;
  let solution = null;

  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const checkResponse = await fetch(`https://2captcha.com/res.php?key=${captchaApiKey}&action=get&id=${captchaId}&json=1`);
    const checkResult = await checkResponse.json();
    
    if (checkResult.status === 1) {
      solution = checkResult.request;
      break;
    }
  }

  if (!solution) {
    throw new Error('Failed to solve CAPTCHA after maximum attempts');
  }

  await page.evaluate((token: string) => {
    document.querySelectorAll<HTMLTextAreaElement>('.g-recaptcha-response').forEach(element => {
      element.innerHTML = token;
      element.value = token;
    });
  }, solution);

  console.log('✅ CAPTCHA solved successfully');
}

async function handleCookies(page: any) {
  console.log('🍪 Checking for cookie consent...');
  try {
    const acceptButton = await page.waitForSelector('#cookieConsentBtnRight', { timeout: 5000 });
    if (acceptButton) {
      console.log('Accepting cookies...');
      await acceptButton.click();
      await page.waitForTimeout(1000);
    }
  } catch {
    console.log('✅ No cookie modal detected');
  }
}

async function scrapeEngie(credentials: ScraperCredentials, captchaApiKey: string): Promise<ScraperResult> {
  console.log('🚀 Starting ENGIE Romania scraping process');
  
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🔑 Navigating to login page...');
    await page.goto('https://my.engie.ro/autentificare');
    
    await handleCookies(page);

    console.log('📝 Entering credentials...');
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);

    await solveCaptcha(page, captchaApiKey);

    console.log('🔓 Submitting login form...');
    await page.click('button[type="submit"].nj-btn.nj-btn--primary');
    
    try {
      await page.waitForNavigation({ timeout: 30000 });
    } catch (error) {
      console.error('Navigation timeout after login');
      throw new Error('Login failed - navigation timeout');
    }

    const isLoggedIn = await page.$('.dashboard');
    if (!isLoggedIn) {
      throw new Error('Login failed - dashboard not found');
    }

    console.log('📄 Navigating to invoices page...');
    await page.goto('https://my.engie.ro/facturi/istoric');
    
    console.log('⏳ Waiting for invoice table...');
    await page.waitForSelector('table', { timeout: 15000 });

    const bills = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const text = (cell: Element) => cell.textContent?.trim() || '';
        
        const amountText = text(cells[4]).replace(/[^\d.,]/g, '').replace(',', '.');
        const amount = parseFloat(amountText);
        const dueDate = text(cells[2]);
        const isPaid = text(cells[5]).toLowerCase().includes('platit');

        return {
          amount,
          due_date: dueDate,
          invoice_number: text(cells[0]),
          period_start: dueDate,
          period_end: dueDate,
          type: 'gas',
          status: isPaid ? 'paid' : 'pending'
        };
      });
    });

    console.log(`✅ Successfully found ${bills.length} invoices`);
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
    console.log('📨 Received scraping request for:', requestData.username);

    const result = await scrapeEngie({
      username: requestData.username,
      password: requestData.password
    }, captchaApiKey);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error in scrape-engie function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        bills: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
