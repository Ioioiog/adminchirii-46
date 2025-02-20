
import { createClient } from '@supabase/supabase-js';
import * as puppeteer from 'puppeteer';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapingRequest {
  username: string;
  password: string;
  utilityId: string;
  provider: string;
  type: string;
  location: string;
}

interface Bill {
  amount: number;
  due_date: string;
  invoice_number: string;
  type: string;
  status: string;
}

async function scrapeEngieRomania(username: string, password: string): Promise<Bill[]> {
  console.log('Starting ENGIE Romania scraping process');
  const startTime = Date.now();
  let browser: puppeteer.Browser | null = null;

  try {
    console.log('Launching browser...');
    const browserStartTime = Date.now();
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ]
    });
    console.log(`Browser launch took ${Date.now() - browserStartTime}ms`);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Optimize performance
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Set timeouts and logging
    page.setDefaultNavigationTimeout(45000); // 45 seconds
    page.setDefaultTimeout(45000);
    page.on('console', message => console.log('BROWSER:', message.text()));

    // Navigation timing
    console.log('Navigating to login page...');
    const navigationStartTime = Date.now();
    const loginUrl = 'https://my.engie.ro/autentificare';
    await page.goto(loginUrl, {
      waitUntil: 'networkidle0',
      timeout: 45000
    });
    console.log(`Navigation took ${Date.now() - navigationStartTime}ms`);

    // Handle cookie consent with timing
    const cookieStartTime = Date.now();
    try {
      console.log('Checking for cookie consent...');
      await page.waitForSelector('[id*="cookie"]', { timeout: 5000 });
      const acceptCookieButton = await page.$('button[id*="cookie"][id*="accept"]');
      if (acceptCookieButton) {
        await acceptCookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('No cookie consent dialog found');
    }
    console.log(`Cookie handling took ${Date.now() - cookieStartTime}ms`);

    // Login timing
    const loginStartTime = Date.now();
    console.log('Waiting for login form...');
    await page.waitForSelector('#username', { visible: true, timeout: 10000 });
    await page.waitForSelector('#password', { visible: true, timeout: 10000 });

    console.log('Filling login form...');
    await page.type('#username', username, { delay: 50 });
    await page.type('#password', password, { delay: 50 });

    console.log('Submitting login form...');
    const loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 45000 }),
      loginButton.click()
    ]);
    console.log(`Login process took ${Date.now() - loginStartTime}ms`);

    // Bills page navigation timing
    const billsStartTime = Date.now();
    console.log('Navigating to bills page...');
    const billsUrls = [
      'https://my.engie.ro/facturi',
      'https://my.engie.ro/facturi/istoric'
    ];

    let billsPageLoaded = false;
    for (const url of billsUrls) {
      try {
        console.log(`Trying bills URL: ${url}`);
        const urlStartTime = Date.now();
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 45000
        });
        console.log(`Navigation to ${url} took ${Date.now() - urlStartTime}ms`);
        
        const tableExists = await page.$('table.nj-table');
        if (tableExists) {
          billsPageLoaded = true;
          break;
        }
      } catch (e) {
        console.log(`Failed to load ${url}, trying next...`);
      }
    }

    if (!billsPageLoaded) {
      throw new Error('Could not load bills page');
    }
    console.log(`Bills page navigation took ${Date.now() - billsStartTime}ms`);

    // Data extraction timing
    const extractionStartTime = Date.now();
    console.log('Waiting for bills table...');
    await page.waitForSelector('table.nj-table', { 
      visible: true,
      timeout: 45000
    });
    
    console.log('Extracting bills data...');
    const bills = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.nj-table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        
        const invoiceNumber = cells[0]?.textContent?.trim().replace(/[^\d]/g, '') || '';
        
        const dateText = cells[2]?.textContent?.trim() || '';
        const [day, month, year] = dateText.split('.');
        const dueDate = `${year}-${month}-${day}`;
        
        const amountText = cells[4]?.textContent?.trim().replace(/[^\d.,]/g, '') || '0';
        const amount = parseFloat(amountText.replace(',', '.'));
        
        const statusText = cells[5]?.textContent?.trim().toLowerCase() || '';
        const status = statusText.includes('platit') ? 'paid' : 'pending';
        
        return {
          invoice_number: invoiceNumber,
          due_date: dueDate,
          amount: amount,
          type: 'gas',
          status: status
        };
      }).filter(bill => bill.invoice_number && bill.amount > 0);
    });

    console.log(`Data extraction took ${Date.now() - extractionStartTime}ms`);
    console.log(`Found ${bills.length} bills`);
    
    const totalTime = Date.now() - startTime;
    console.log(`Total scraping process took ${totalTime}ms`);
    
    return bills;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    if (browser) {
      const closeStartTime = Date.now();
      console.log('Closing browser...');
      await browser.close();
      console.log(`Browser cleanup took ${Date.now() - closeStartTime}ms`);
    }
  }
}

// Entry point for the Edge Function
Deno.serve(async (req) => {
  console.log('Received request:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Basic request validation
    if (!req.body) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request body is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const request: ScrapingRequest = await req.json();
    console.log('Request data:', JSON.stringify(request, null, 2));

    // Validate required fields
    if (!request.username || !request.password || !request.utilityId || !request.provider) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields in request'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create scraping job
    console.log('Creating scraping job...');
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: request.utilityId,
        status: 'in_progress',
        provider: request.provider,
        type: request.type,
        location: request.location
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create scraping job:', jobError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create scraping job'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    try {
      // Start scraping process
      console.log('Starting scraping process...');
      let bills: Bill[] = [];
      
      if (request.provider.toLowerCase() === 'engie_romania') {
        bills = await scrapeEngieRomania(request.username, request.password);
      } else {
        throw new Error('Unsupported provider');
      }

      if (bills.length > 0) {
        console.log('Storing bills in database...');
        const { error: billError } = await supabase
          .from('utilities')
          .insert(
            bills.map(bill => ({
              property_id: request.utilityId,
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
          console.error('Failed to store bills:', billError);
          throw new Error(`Failed to store utility bills: ${billError.message}`);
        }
      }

      // Update job status
      console.log('Updating job status to completed...');
      const { error: updateError } = await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id);

      if (updateError) {
        console.error('Error updating job status:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          jobId: jobData.id,
          bills
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (error) {
      console.error('Error during scraping process:', error);
      
      // Update job status to failed
      const { error: updateError } = await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id);

      if (updateError) {
        console.error('Error updating job status to failed:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
          jobId: jobData.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Keep 200 status even for errors
        }
      );
    }

  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Keep 200 status even for errors
      }
    );
  }
});
