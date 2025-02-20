
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';
import { chromium } from "https://deno.land/x/playwright@v1.41.2/mod.ts";

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
  const browser = await chromium.launch({
    args: ['--no-sandbox']
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('Navigating to login page...');
    await page.goto('https://my.engie.ro/login');

    // Handle cookie consent if present
    try {
      await page.click('#cookieConsentBtnRight', { timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie consent dialog found or already accepted');
    }

    // Login
    console.log('Entering credentials...');
    await page.fill('#username', username);
    await page.fill('#password', password);
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Navigate to invoices page
    console.log('Navigating to invoices page...');
    await page.goto('https://my.engie.ro/facturi/istoric');
    await page.waitForSelector('table tbody tr');

    // Extract bills
    console.log('Extracting bill information...');
    const bills = await page.$$eval('table tbody tr', (rows) => {
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        const text = (cell: Element) => cell.textContent?.trim() || '';
        
        const amountText = text(cells[4]).replace(/[^\d.,]/g, '').replace(',', '.');
        const amount = parseFloat(amountText);
        
        // Parse date from Romanian format to ISO
        const dateText = text(cells[2]);
        const [day, month, year] = dateText.split('.');
        const due_date = `${year}-${month}-${day}`;

        return {
          amount,
          due_date,
          invoice_number: text(cells[0]),
          type: 'gas',
          status: text(cells[5]).toLowerCase().includes('platit') ? 'paid' : 'pending'
        };
      });
    });

    console.log(`Found ${bills.length} bills`);
    return bills;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
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

    // Perform scraping based on provider
    let bills: Bill[] = [];
    if (request.provider.toLowerCase() === 'engie_romania') {
      bills = await scrapeEngieRomania(request.username, request.password);
    } else {
      throw new Error('Unsupported provider');
    }

    // Store bills in database
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
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

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
    console.error('Error in edge function:', error);
    
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
