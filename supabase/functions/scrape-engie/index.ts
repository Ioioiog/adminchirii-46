
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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
  const sitekey = await page.$eval('[data-sitekey]', (el: any) => el.getAttribute('data-sitekey'));
  const pageUrl = page.url();

  const apiEndpoint = 'https://2captcha.com/in.php';
  const submitUrl = `${apiEndpoint}?key=${captchaApiKey}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${pageUrl}&json=1`;
  
  const submitResponse = await fetch(submitUrl);
  const submitResult = await submitResponse.json();

  if (submitResult.status !== 1) {
    throw new Error(`Failed to submit captcha: ${submitResult.request}`);
  }

  const captchaId = submitResult.request;
  let solution = null;
  let attempts = 0;

  while (!solution && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const checkUrl = `https://2captcha.com/res.php?key=${captchaApiKey}&action=get&id=${captchaId}&json=1`;
    const checkResponse = await fetch(checkUrl);
    const checkResult = await checkResponse.json();

    if (checkResult.status === 1) {
      solution = checkResult.request;
      break;
    }

    attempts++;
  }

  if (!solution) {
    throw new Error('Failed to solve CAPTCHA after maximum attempts');
  }

  await page.evaluate((token: string) => {
    const elements = document.getElementsByClassName('g-recaptcha-response');
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLTextAreaElement;
      element.innerHTML = token;
      element.value = token;
    }
    document.dispatchEvent(new Event('recaptcha-solved', { bubbles: true }));
  }, solution);
}

async function handleCookies(page: any) {
  console.log('🍪 Checking for cookie consent...');
  try {
    await page.waitForSelector('#cookieConsentBtnRight', { timeout: 5000 });
    const acceptButton = await page.$('#cookieConsentBtnRight');
    if (acceptButton) {
      console.log('✅ Clicking "Acceptă toate"');
      await acceptButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
    await page.goto('https://my.engie.ro/autentificare', { waitUntil: 'networkidle2' });
    await handleCookies(page);

    console.log('📝 Entering login credentials...');
    await page.waitForSelector('#username', { visible: true });
    await page.waitForSelector('#password', { visible: true });

    await page.type('#username', credentials.username, { delay: 100 });
    await page.type('#password', credentials.password, { delay: 100 });

    await solveCaptcha(page, captchaApiKey);

    console.log('🔓 Submitting login form...');
    await page.click('button[type="submit"].nj-btn.nj-btn--primary');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Navigate to invoices page
    console.log('📄 Navigating to invoices page...');
    await page.goto('https://my.engie.ro/facturi/istoric', { waitUntil: 'networkidle2' });

    // Wait for and extract invoices
    console.log('⏳ Waiting for invoices table...');
    await page.waitForSelector('table', { timeout: 15000 });

    const bills = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const text = (cell: Element) => cell.textContent?.trim() || '';
        
        const amountText = text(cells[4]).replace(/[^\d.,]/g, '').replace(',', '.');
        const amount = parseFloat(amountText);

        const invoiceNumber = text(cells[0]);
        const dueDate = text(cells[2]);
        const status = text(cells[5]).toLowerCase();

        return {
          amount,
          due_date: dueDate,
          invoice_number: invoiceNumber,
          period_start: dueDate, // ENGIE doesn't show period dates
          period_end: dueDate,
          type: 'gas' as const,
          status: status.includes('platit') ? 'paid' as const : 'pending' as const
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
  // Handle CORS preflight requests
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
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
