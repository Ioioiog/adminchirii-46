
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import * as puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

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
    
    // Set default timeout
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Enable logging
    page.on('console', message => console.log('BROWSER:', message.text()));

    console.log('Navigating to login page...');
    await page.goto('https://my.engie.ro/AUTENTIFICARE', {
      waitUntil: 'networkidle0'
    });

    // Handle cookie consent if present
    try {
      const acceptCookieButton = await page.$('button#cookieConsentBtnRight');
      if (acceptCookieButton) {
        await acceptCookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('No cookie consent dialog found');
    }

    console.log('Filling login form...');
    await page.waitForSelector('#username', { visible: true });
    await page.waitForSelector('#password', { visible: true });

    // Type credentials
    await page.type('#username', username, { delay: 100 });
    await page.type('#password', password, { delay: 100 });

    // Submit form
    console.log('Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // Wait for successful login
    await page.waitForTimeout(2000);

    // Handle any popups
    try {
      const popupClose = await page.$('button.close');
      if (popupClose) {
        await popupClose.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('No popup found');
    }

    // Navigate to bills page
    console.log('Navigating to bills page...');
    await page.goto('https://my.engie.ro/FACTURI/ISTORIC', {
      waitUntil: 'networkidle0'
    });

    // Wait for table to load
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: ScrapingRequest = await req.json();
    console.log('Processing request for provider:', request.provider);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
