
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

    // Get the utility provider details to access the correct property_id
    const { data: providerData, error: providerError } = await supabase
      .from('utility_provider_credentials')
      .select('property_id')
      .eq('id', request.utilityId)
      .single();

    if (providerError || !providerData?.property_id) {
      console.error('Failed to fetch provider details:', providerError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch provider details'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Create scraping job record
    console.log('Creating scraping job');
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: request.utilityId,
        status: 'pending' as ScrapingStatus,
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
          status: 500,
        }
      );
    }

    // Update status to in_progress
    const { error: updateError } = await supabase
      .from('scraping_jobs')
      .update({ 
        status: 'in_progress' as ScrapingStatus,
        last_run_at: new Date().toISOString()
      })
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

    // Store the mock bill
    if (scrapingResult.bills?.length) {
      const { error: billError } = await supabase
        .from('utilities')
        .insert(
          scrapingResult.bills.map(bill => ({
            property_id: providerData.property_id, // Using the correct property_id from the provider
            utility_provider_id: request.utilityId,
            type: request.type,
            amount: bill.amount,
            due_date: bill.due_date,
            invoice_number: bill.invoice_number,
            status: bill.status,
            currency: 'USD'
          }))
        );

      if (billError) {
        console.error('Failed to store utility bills:', billError);
        
        // Update job as failed
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed' as ScrapingStatus,
            error_message: billError.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobData.id);

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

    // Update job as completed
    const { error: completionError } = await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed' as ScrapingStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    if (completionError) {
      console.error('Failed to update job completion status:', completionError);
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
