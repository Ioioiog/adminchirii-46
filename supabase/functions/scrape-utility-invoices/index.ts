
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from '@supabase/supabase-js'
import { scrapeEngieRomania } from './scrapers/index.ts'

interface ScrapingError {
  message: string;
  details?: unknown;
  step: string;
}

const handleScrapingError = async (error: ScrapingError, supabaseClient: any, jobId?: string) => {
  console.error(`Error during ${error.step}:`, {
    message: error.message,
    details: error.details
  });

  if (jobId) {
    try {
      await supabaseClient
        .from('scraping_jobs')
        .update({ 
          status: 'failed',
          error_message: `${error.step}: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: error.message,
      step: error.step
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    }
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let jobId: string | undefined;

  try {
    const { username, password, utilityId, provider, type, location } = await req.json()
    console.log(`Starting scraping for ${provider} at location ${location}`);

    if (!username || !password || !utilityId || !provider) {
      return handleScrapingError({
        message: 'Missing required parameters',
        step: 'parameter_validation'
      }, supabaseClient);
    }

    // Create a scraping job record
    const { data: jobData, error: jobError } = await supabaseClient
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: 'in_progress',
        provider: provider,
        location: location
      })
      .select()
      .single();

    if (jobError) {
      return handleScrapingError({
        message: `Failed to create scraping job: ${jobError.message}`,
        details: jobError,
        step: 'job_creation'
      }, supabaseClient);
    }

    jobId = jobData.id;
    console.log(`Created scraping job: ${jobId}`);

    // Get Browserless API key
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return handleScrapingError({
        message: 'Browserless API key not configured',
        step: 'api_configuration'
      }, supabaseClient, jobId);
    }

    // Call the appropriate scraper based on provider
    let bills;
    if (provider === 'engie_romania') {
      bills = await scrapeEngieRomania({ 
        username, 
        password, 
        utilityId, 
        type, 
        location, 
        browserlessApiKey 
      });
    } else {
      return handleScrapingError({
        message: `Unsupported provider: ${provider}`,
        step: 'provider_validation'
      }, supabaseClient, jobId);
    }

    // Insert the bills into the database
    if (bills.length > 0) {
      const { error: billsError } = await supabaseClient
        .from('utilities')
        .insert(bills.map(bill => ({
          ...bill,
          property_id: utilityId
        })));

      if (billsError) {
        return handleScrapingError({
          message: `Failed to insert bills: ${billsError.message}`,
          details: billsError,
          step: 'bill_insertion'
        }, supabaseClient, jobId);
      }
    }

    // Update job status to completed
    const { error: updateError } = await supabaseClient
      .from('scraping_jobs')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      return handleScrapingError({
        message: `Failed to update job status: ${updateError.message}`,
        details: updateError,
        step: 'job_completion'
      }, supabaseClient, jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobId,
        billsCount: bills.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return handleScrapingError({
      message: error.message || 'An unexpected error occurred',
      details: error,
      step: 'unknown'
    }, supabaseClient, jobId);
  }
})
