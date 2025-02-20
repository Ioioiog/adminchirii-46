
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
  let browser: puppeteer.Browser | null = null;

  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set default timeout and enable logging
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    page.on('console', message => console.log('BROWSER:', message.text()));

    // Use the correct login URL
    console.log('Navigating to login page...');
    const loginUrl = 'https://my.engie.ro/autentificare';
    await page.goto(loginUrl, {
      waitUntil: 'networkidle0'
    });

    // Handle cookie consent if present
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

    console.log('Waiting for login form...');
    await page.waitForSelector('#username', { visible: true });
    await page.waitForSelector('#password', { visible: true });

    // Type credentials
    console.log('Filling login form...');
    await page.type('#username', username, { delay: 100 });
    await page.type('#password', password, { delay: 100 });

    // Submit form
    console.log('Submitting login form...');
    const loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      loginButton.click()
    ]);

    // Wait for successful login
    await page.waitForTimeout(2000);

    // Navigate to bills page
    console.log('Navigating to bills page...');
    const billsUrls = [
      'https://my.engie.ro/facturi',
      'https://my.engie.ro/facturi/istoric'
    ];

    let billsPageLoaded = false;
    for (const url of billsUrls) {
      try {
        console.log(`Trying bills URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle0' });
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

    // Wait for table to load
    console.log('Waiting for bills table...');
    await page.waitForSelector('table.nj-table', { visible: true });
    
    // Extract bills data
    console.log('Extracting bills data...');
    const bills = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.nj-table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        
        // Extract invoice number from first column
        const invoiceNumber = cells[0]?.textContent?.trim().replace(/[^\d]/g, '') || '';
        
        // Extract date from the date column (format: DD.MM.YYYY)
        const dateText = cells[2]?.textContent?.trim() || '';
        const [day, month, year] = dateText.split('.');
        const dueDate = `${year}-${month}-${day}`;
        
        // Extract amount from amount column
        const amountText = cells[4]?.textContent?.trim().replace(/[^\d.,]/g, '') || '0';
        const amount = parseFloat(amountText.replace(',', '.'));
        
        // Extract status from status column
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

    console.log(`Found ${bills.length} bills`);
    return bills;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
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
