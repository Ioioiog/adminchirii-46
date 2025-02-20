
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { chromium } from 'npm:playwright-core@1.41.2';
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
    await page.click('#cookieConsentBtnRight');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Cookie consent handled');
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
  
  // Use playwright-core with chromium
  const browser = await chromium.launch({
    chromiumSandbox: false,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login process
    console.log('🔑 Navigating to login page...');
    await page.goto('https://my.engie.ro/autentificare');
    await handleCookies(page);

    console.log('📝 Entering login credentials...');
    await page.fill('#username', credentials.username);
    await page.fill('#password', credentials.password);

    await solveCaptcha(page, captchaApiKey);

    console.log('🔓 Submitting login form...');
    await page.click('button[type="submit"].nj-btn.nj-btn--primary');
    await page.waitForNavigation();

    // Navigate to invoices page
    console.log('📄 Navigating to invoices page...');
    await page.goto('https://my.engie.ro/facturi/istoric');

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
    console.log('Starting scraping process...');
    
    if (!req.body) {
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

    let request: ScrapingRequest;
    try {
      request = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const captchaApiKey = Deno.env.get('CAPTCHA_API_KEY');

    if (!supabaseUrl || !supabaseKey || !captchaApiKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error - missing required environment variables'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: providerData, error: providerError } = await supabase
      .from('utility_provider_credentials')
      .select(`
        id,
        property_id,
        properties!inner (id)
      `)
      .eq('id', request.utilityId)
      .single();

    if (providerError || !providerData) {
      console.error('Error fetching provider:', providerError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch provider details'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

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
      console.error('Error creating job:', jobError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create scraping job'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    await supabase
      .from('scraping_jobs')
      .update({ status: 'in_progress' })
      .eq('id', jobData.id);

    console.log('Starting ENGIE scraping...');
    const scrapingResult = await scrapeEngie(
      { 
        username: request.username, 
        password: request.password 
      },
      captchaApiKey
    );

    if (!scrapingResult.success) {
      console.error('Scraping failed:', scrapingResult.error);
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: scrapingResult.error,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: scrapingResult.error || 'Failed to fetch bills'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (scrapingResult.bills && scrapingResult.bills.length > 0) {
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
            currency: 'RON'
          }))
        );

      if (billError) {
        console.error('Error storing bills:', billError);
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: 'Failed to store bills in database',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobData.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to store utility bills'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    console.log('Scraping completed successfully');
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
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
