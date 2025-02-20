
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

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

  try {
    // First, get the CSRF token and session cookie
    const loginPageResponse = await fetch('https://my.engie.ro/login', {
      method: 'GET'
    });

    const cookies = loginPageResponse.headers.get('set-cookie') || '';
    const pageText = await loginPageResponse.text();
    const csrfMatch = pageText.match(/<meta name="_csrf" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    if (!csrfToken) {
      throw new Error('Could not get CSRF token');
    }

    // Login
    console.log('Attempting login...');
    const loginResponse = await fetch('https://my.engie.ro/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'X-CSRF-TOKEN': csrfToken
      },
      body: new URLSearchParams({
        username,
        password,
        '_csrf': csrfToken
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const sessionCookies = loginResponse.headers.get('set-cookie') || '';

    // Fetch bills
    console.log('Fetching bills...');
    const billsResponse = await fetch('https://my.engie.ro/facturi/istoric', {
      headers: {
        'Cookie': sessionCookies
      }
    });

    const billsHtml = await billsResponse.text();
    
    // Parse bills from HTML
    const bills: Bill[] = [];
    const rows = billsHtml.match(/<tr[^>]*>.*?<\/tr>/gs) || [];

    for (const row of rows) {
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/gs) || [];
      if (cells.length >= 6) {
        const invoiceNumber = cells[0].replace(/<[^>]+>/g, '').trim();
        const dateText = cells[2].replace(/<[^>]+>/g, '').trim();
        const amountText = cells[4].replace(/<[^>]+>/g, '').trim()
          .replace(/[^\d.,]/g, '')
          .replace(',', '.');
        const statusText = cells[5].replace(/<[^>]+>/g, '').trim();

        // Parse date (assuming format: DD.MM.YYYY)
        const [day, month, year] = dateText.split('.');
        const dueDate = `${year}-${month}-${day}`;

        bills.push({
          amount: parseFloat(amountText),
          due_date: dueDate,
          invoice_number: invoiceNumber,
          type: 'gas',
          status: statusText.toLowerCase().includes('platit') ? 'paid' : 'pending'
        });
      }
    }

    console.log(`Found ${bills.length} bills`);
    return bills;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
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
