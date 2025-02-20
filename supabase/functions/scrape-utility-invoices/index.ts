
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import puppeteer from "npm:puppeteer@16.2.0";
import { corsHeaders } from '../_shared/cors.ts';

type ScrapingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface ScrapingRequest {
  username: string;
  password: string;
  utilityId: string;
  provider: string;
  type: string;
  location: string;
}

interface ScrapingResponse {
  success: boolean;
  jobId?: string;
  bills?: Array<{
    amount: number;
    due_date: string;
    invoice_number: string;
    type: string;
    status: string;
  }>;
  error?: string;
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

async function scrapeEngie(credentials: { username: string; password: string }, captchaApiKey: string) {
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
          type: 'gas',
          status: status.includes('platit') ? 'paid' : 'pending'
        };
      });
    });

    console.log(`✅ Found ${bills.length} invoices`);
    await browser.close();
    return { success: true, bills };

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    await browser.close();
    return {
      success: false,
      bills: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Scraping function called with method:', req.method);
    
    if (!req.body) {
      console.error('No request body provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request body is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const request: ScrapingRequest = await req.json();
    console.log('Processing request for provider:', request.provider);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const captchaApiKey = Deno.env.get('CAPTCHA_API_KEY');
    
    if (!supabaseUrl || !supabaseKey || !captchaApiKey) {
      throw new Error('Server configuration error - missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the utility provider details
    const { data: providerData, error: providerError } = await supabase
      .from('utility_provider_credentials')
      .select(`
        id,
        property_id,
        properties!inner (
          id
        )
      `)
      .eq('id', request.utilityId)
      .single();

    if (providerError || !providerData) {
      throw new Error('Failed to fetch provider details');
    }

    if (!providerData.property_id) {
      throw new Error('No property associated with provider');
    }

    // Create scraping job record
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: request.utilityId,
        status: 'pending' as ScrapingStatus,
        provider: request.provider,
        type: request.type,
        location: request.location,
        last_run_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError || !jobData) {
      throw new Error('Failed to create scraping job');
    }

    // Update status to in_progress
    await supabase
      .from('scraping_jobs')
      .update({ 
        status: 'in_progress' as ScrapingStatus,
      })
      .eq('id', jobData.id);

    // Use the ENGIE scraper to fetch real bills
    const scrapingResult = await scrapeEngie(
      { username: request.username, password: request.password },
      captchaApiKey
    );

    if (!scrapingResult.success || !scrapingResult.bills?.length) {
      throw new Error(scrapingResult.error || 'Failed to fetch bills from ENGIE');
    }

    // Store the real bills
    const { error: billError } = await supabase
      .from('utilities')
      .insert(
        scrapingResult.bills.map(bill => ({
          property_id: providerData.property_id,
          utility_provider_id: request.utilityId,
          type: request.type,
          amount: bill.amount,
          due_date: bill.due_date,
          invoice_number: bill.invoice_number,
          status: bill.status,
          currency: 'RON' // ENGIE Romania uses RON
        }))
      );

    if (billError) {
      console.error('Failed to store utility bills:', billError);
      
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed' as ScrapingStatus,
          error_message: billError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id);
        
      throw new Error(`Failed to store utility bills: ${billError.message}`);
    }

    // Update job as completed
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed' as ScrapingStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    console.log('Successfully completed scraping job with real ENGIE data');
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        bills: scrapingResult.bills
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
