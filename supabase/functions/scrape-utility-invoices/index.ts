
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
    console.log('Fetching login page...');
    const loginPageResponse = await fetch('https://my.engie.ro/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!loginPageResponse.ok) {
      throw new Error(`Failed to fetch login page: ${loginPageResponse.status} ${loginPageResponse.statusText}`);
    }

    const cookies = loginPageResponse.headers.get('set-cookie') || '';
    const pageText = await loginPageResponse.text();
    console.log('Login page fetched successfully');

    const csrfMatch = pageText.match(/<meta name="_csrf" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    if (!csrfToken) {
      console.log('Page content:', pageText.substring(0, 500)); // Log first 500 chars for debugging
      throw new Error('Could not get CSRF token');
    }

    console.log('CSRF token obtained:', csrfToken.substring(0, 10) + '...');

    // Login
    console.log('Attempting login...');
    const loginResponse = await fetch('https://my.engie.ro/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'X-CSRF-TOKEN': csrfToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Origin': 'https://my.engie.ro',
        'Referer': 'https://my.engie.ro/login'
      },
      body: new URLSearchParams({
        username,
        password,
        '_csrf': csrfToken
      }),
      redirect: 'follow'
    });

    const responseText = await loginResponse.text();
    if (!loginResponse.ok) {
      console.log('Login response:', responseText.substring(0, 500));
      throw new Error(`Login failed with status: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const sessionCookies = loginResponse.headers.get('set-cookie') || cookies;
    console.log('Login successful, got session cookies');

    // Small delay to ensure session is established
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch bills
    console.log('Fetching bills...');
    const billsResponse = await fetch('https://my.engie.ro/facturi/istoric', {
      headers: {
        'Cookie': sessionCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://my.engie.ro/login'
      }
    });

    const billsResponseText = await billsResponse.text();
    if (!billsResponse.ok) {
      console.log('Bills response:', billsResponseText.substring(0, 500));
      throw new Error(`Failed to fetch bills page with status: ${billsResponse.status} ${billsResponse.statusText}`);
    }

    // Parse bills from HTML
    const bills: Bill[] = [];
    const rows = billsResponseText.match(/<tr[^>]*>.*?<\/tr>/gs) || [];

    console.log(`Found ${rows.length} bill rows`);

    for (const row of rows) {
      try {
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
          if (!day || !month || !year) {
            console.log('Invalid date format:', dateText);
            continue;
          }

          const dueDate = `${year}-${month}-${day}`;

          console.log('Parsed bill:', {
            invoiceNumber,
            dueDate,
            amount: amountText,
            status: statusText
          });

          bills.push({
            amount: parseFloat(amountText),
            due_date: dueDate,
            invoice_number: invoiceNumber,
            type: 'gas',
            status: statusText.toLowerCase().includes('platit') ? 'paid' : 'pending'
          });
        }
      } catch (error) {
        console.error('Error parsing bill row:', error);
        continue;
      }
    }

    if (bills.length === 0) {
      console.log('No bills found in HTML:', billsResponseText.substring(0, 500));
      throw new Error('No bills found in the response');
    }

    console.log(`Successfully parsed ${bills.length} bills`);
    return bills;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
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

    if (jobError) {
      console.error('Error creating scraping job:', jobError);
      throw new Error(`Failed to create scraping job: ${jobError.message}`);
    }

    if (!jobData) {
      throw new Error('No job data returned after creation');
    }

    try {
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
        status: 200, // Return 200 even for errors to avoid Supabase error
      }
    );
  }
});
