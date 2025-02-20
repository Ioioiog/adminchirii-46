
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
      console.error('No request body provided');
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
    
    const request: ScrapingRequest = await req.json();
    console.log('Received scraping request:', request);

    // Validate request
    if (!request.username || !request.password || !request.provider || !request.type) {
      console.error('Missing required fields in request:', {
        hasUsername: !!request.username,
        hasPassword: !!request.password,
        hasProvider: !!request.provider,
        hasType: !!request.type
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
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
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create scraping job record
    console.log('Creating scraping job for provider:', request.provider);
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
          error: `Failed to create scraping job: ${jobError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Mock scraping response for now
    const scrapingResult: ScrapingResponse = {
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

    // Update job status
    console.log('Updating job status to completed');
    const { error: updateError } = await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    if (updateError) {
      console.error('Failed to update job status:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to update job status: ${updateError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Store bills
    if (scrapingResult.bills?.length) {
      console.log('Storing bills:', scrapingResult.bills);
      const { error: billsError } = await supabase
        .from('utilities')
        .insert(
          scrapingResult.bills.map(bill => ({
            utility_provider_id: request.utilityId,
            amount: bill.amount,
            due_date: bill.due_date,
            invoice_number: bill.invoice_number,
            type: bill.type,
            status: bill.status
          }))
        );

      if (billsError) {
        console.error('Failed to store bills:', billsError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to store bills: ${billsError.message}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    console.log('Scraping completed successfully');
    return new Response(
      JSON.stringify(scrapingResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unexpected error in scrape-utility-invoices:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
