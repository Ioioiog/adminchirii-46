
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { Browser, launch } from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

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
  let browser: Browser | null = null;

  try {
    console.log('Launching browser...');
    browser = await launch({
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

    // Updated login URL and navigation
    console.log('Navigating to login page...');
    const loginUrl = 'https://engie.ro/servicii-online/';
    await page.goto(loginUrl, {
      waitUntil: 'networkidle0'
    });

    // Click the login button to open the login form if needed
    try {
      console.log('Looking for login button...');
      const loginTrigger = await page.$('a[href*="autentificare"]');
      if (loginTrigger) {
        await loginTrigger.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('No login trigger button found, proceeding...');
    }

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
    await page.waitForSelector('input[type="text"]', { visible: true });
    await page.waitForSelector('input[type="password"]', { visible: true });

    // Type credentials
    console.log('Filling login form...');
    await page.type('input[type="text"]', username, { delay: 100 });
    await page.type('input[type="password"]', password, { delay: 100 });

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

    // Navigate to bills page with updated URLs
    console.log('Navigating to bills page...');
    const billsUrls = [
      'https://engie.ro/servicii-online/facturi-plati/',
      'https://engie.ro/servicii-online/facturi/',
      'https://engie.ro/servicii-online/istoric-facturi/'
    ];

    let billsPageLoaded = false;
    for (const url of billsUrls) {
      try {
        console.log(`Trying bills URL: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle0' });
        // Updated selector for bills table
        const tableExists = await page.$('.facturi-table, .bills-table, table');
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

    // Wait for table to load with updated selector
    console.log('Waiting for bills table...');
    await page.waitForSelector('.facturi-table, .bills-table, table', { visible: true });
    
    // Extract bills data with more flexible selectors
    console.log('Extracting bills data...');
    const bills = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.facturi-table tr, .bills-table tr, table tr')).slice(1);
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 5) return null;
        
        // More flexible data extraction
        const invoiceNumber = cells[0]?.textContent?.trim().replace(/[^\d]/g, '') || '';
        
        // Handle different date formats
        const dateText = cells[2]?.textContent?.trim() || '';
        let dueDate = '';
        if (dateText) {
          try {
            const dateMatch = dateText.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
            if (dateMatch) {
              const [_, day, month, year] = dateMatch;
              dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } catch (e) {
            console.log('Date parsing error:', e);
          }
        }
        
        // Handle different amount formats
        const amountText = cells[4]?.textContent?.trim().replace(/[^\d.,]/g, '') || '0';
        const amount = parseFloat(amountText.replace(',', '.'));
        
        // More flexible status detection
        const statusText = cells[5]?.textContent?.trim().toLowerCase() || '';
        const status = /platit|achitat|paid/i.test(statusText) ? 'paid' : 'pending';
        
        if (!invoiceNumber || !dueDate || isNaN(amount)) return null;
        
        return {
          invoice_number: invoiceNumber,
          due_date: dueDate,
          amount: amount,
          type: 'gas',
          status: status
        };
      }).filter(bill => bill !== null);
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

// Handle the incoming request
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: ScrapingRequest = await req.json();
    console.log('Processing request for provider:', request.provider);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create scraping job
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

    if (jobError || !jobData) {
      throw new Error('Failed to create scraping job');
    }

    try {
      let bills: Bill[] = [];
      if (request.provider.toLowerCase() === 'engie_romania') {
        bills = await scrapeEngieRomania(request.username, request.password);
      } else {
        throw new Error('Unsupported provider');
      }

      if (bills.length > 0) {
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
          throw new Error(`Failed to store utility bills: ${billError.message}`);
        }
      }

      // Update job status to completed
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
      throw error;
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
        status: 200,
      }
    );
  }
});
