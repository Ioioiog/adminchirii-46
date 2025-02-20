
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

type ScrapingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

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
    console.log('Scraping function called with method:', req.method);
    
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
    console.log('Processing request for provider:', request.provider);

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
    console.log('Creating scraping job');
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: request.utilityId,
        status: 'pending' as ScrapingStatus,
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
          status: 500,
        }
      );
    }

    // Update status to in_progress
    const { error: updateError } = await supabase
      .from('scraping_jobs')
      .update({ status: 'in_progress' as ScrapingStatus })
      .eq('id', jobData.id);

    if (updateError) {
      console.error('Failed to update job status:', updateError);
    }

    // Mock successful scraping
    const scrapingResult: ScrapingResponse = {
      success: true,
      jobId: jobData.id,
      bills: [{
        amount: 150.00,
        due_date: new Date().toISOString(),
        invoice_number: "INV001",
        type: request.type,
        status: "pending"
      }]
    };

    // Update job as completed
    const { error: completionError } = await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed' as ScrapingStatus,
        last_run_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    if (completionError) {
      console.error('Failed to update job completion status:', completionError);
    }

    // Store the mock bill
    if (scrapingResult.bills?.length) {
      const { error: billError } = await supabase
        .from('utilities')
        .insert(
          scrapingResult.bills.map(bill => ({
            property_id: request.utilityId, // Using utilityId as property_id
            type: request.type,
            amount: bill.amount,
            due_date: bill.due_date,
            invoice_number: bill.invoice_number,
            status: bill.status,
            currency: 'USD' // Default currency
          }))
        );

      if (billError) {
        console.error('Failed to store utility bills:', billError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to store utility bills'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    console.log('Successfully completed scraping job');
    return new Response(
      JSON.stringify(scrapingResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
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
