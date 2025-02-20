
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

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

    // Call the actual scraping function based on provider
    let scrapingResult: ScrapingResponse;
    
    if (request.provider === 'engie_romania') {
      // Example mock response for now
      scrapingResult = {
        success: true,
        jobId: jobData.id,
        bills: [{
          amount: 150.00,
          due_date: new Date().toISOString(),
          invoice_number: "INV001",
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString(),
          type: request.type,
          status: "pending"
        }]
      };
    } else {
      throw new Error(`Unsupported provider: ${request.provider}`);
    }

    // Update job status
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    // Store bills if available
    if (scrapingResult.bills?.length) {
      const { error: billsError } = await supabase
        .from('utilities')
        .insert(
          scrapingResult.bills.map(bill => ({
            utility_provider_id: request.utilityId,
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

    return new Response(JSON.stringify(scrapingResult), {
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
