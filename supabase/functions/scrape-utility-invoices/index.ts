
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { ENGIE_ROMANIA_URL } from './constants.ts';

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
  bills?: Array<{
    amount: number;
    due_date: string;
    invoice_number: string;
    period_start: string;
    period_end: string;
    type: string;
    status: string;
  }>;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    if (!req.body) {
      throw new Error('Request body is required');
    }
    
    const request: ScrapingRequest = await req.json();
    console.log('Received scraping request for:', {
      provider: request.provider,
      type: request.type,
      location: request.location,
      utilityId: request.utilityId
    });

    // Validate request
    if (!request.username || !request.password || !request.provider || !request.type) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Start background scraping process
    const response = await startScraping(request, supabase);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in scrape-utility-invoices:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function startScraping(request: ScrapingRequest, supabase: any): Promise<ScrapingResponse> {
  try {
    // Create scraping job record
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
      throw new Error(`Failed to create scraping job: ${jobError.message}`);
    }

    // Start scraping based on provider
    let scrapingResult: ScrapingResponse;
    
    switch (request.provider) {
      case 'engie_romania':
        scrapingResult = await scrapeEngie(request);
        break;
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }

    // Update job status
    await updateScrapingJob(
      supabase,
      jobData.id,
      scrapingResult.success ? 'completed' : 'failed',
      scrapingResult.error
    );

    // If successful, store the bills
    if (scrapingResult.success && scrapingResult.bills) {
      await storeBills(supabase, request.utilityId, scrapingResult.bills);
    }

    return scrapingResult;

  } catch (error) {
    console.error('Error in startScraping:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function scrapeEngie(request: ScrapingRequest): Promise<ScrapingResponse> {
  try {
    const response = await fetch(ENGIE_ROMANIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: request.username,
        password: request.password,
        type: request.type,
        location: request.location
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to scrape Engie: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      bills: data.bills
    };

  } catch (error) {
    console.error('Error scraping Engie:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function updateScrapingJob(supabase: any, jobId: string, status: string, error?: string) {
  const { error: updateError } = await supabase
    .from('scraping_jobs')
    .update({
      status,
      error_message: error,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .eq('id', jobId);

  if (updateError) {
    console.error('Error updating scraping job:', updateError);
  }
}

async function storeBills(supabase: any, utilityId: string, bills: any[]) {
  const { error: billsError } = await supabase
    .from('utilities')
    .insert(
      bills.map(bill => ({
        utility_provider_id: utilityId,
        amount: bill.amount,
        due_date: bill.due_date,
        invoice_number: bill.invoice_number,
        period_start: bill.period_start,
        period_end: bill.period_end,
        type: bill.type,
        status: bill.status
      }))
    );

  if (billsError) {
    console.error('Error storing bills:', billsError);
    throw new Error(`Failed to store bills: ${billsError.message}`);
  }
}
