
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { scrapeEngieRomania } from "./scrapers/engie-romania.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapingRequest {
  username: string;
  password: string;
  utilityId: string;
  provider: string;
  type: string;
  location: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing scraping request...');
    
    const { username, password, utilityId, provider, type, location } = await req.json() as ScrapingRequest;
    
    console.log(`Starting scraping for provider: ${provider}`);

    // Create new scraping job record first
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a job record to track the scraping progress
    const { data: jobData, error: jobError } = await supabaseClient
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: 'in_progress',
        provider: provider,
        type: type,
        location: location
      })
      .select('id')
      .single();
      
    if (jobError) {
      console.error('Error creating job record:', jobError);
      throw new Error('Failed to create scraping job record');
    }
    
    const jobId = jobData.id;
    console.log(`Created scraping job with ID: ${jobId}`);

    let bills = [];
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');

    if (!browserlessApiKey) {
      throw new Error('Browserless API key not configured');
    }

    if (provider === 'engie_romania') {
      console.log('Starting ENGIE Romania scraper...');
      bills = await scrapeEngieRomania({
        username,
        password,
        utilityId,
        type,
        location,
        browserlessApiKey
      });
      console.log(`ENGIE scraper finished. Found ${bills.length} bills.`);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Only insert bills if we found any
    if (bills && bills.length > 0) {
      console.log(`Inserting ${bills.length} bills into database`);
      const { error: billsError } = await supabaseClient
        .from('utilities')
        .insert(bills.map(bill => ({
          ...bill,
          property_id: utilityId
        })));

      if (billsError) {
        console.error('Error inserting bills:', billsError);
        // Update job with error
        await supabaseClient
          .from('scraping_jobs')
          .update({ 
            status: 'failed',
            error_message: `Failed to insert bills: ${billsError.message}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
        throw billsError;
      }
    } else {
      console.log('No bills found to insert');
    }

    // Update job as completed
    await supabaseClient
      .from('scraping_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_run_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: jobId,
        billsCount: bills.length,
        message: `Successfully scraped ${bills.length} bills`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in scrape-utility-invoices:', error);
    
    // If we have jobId and supabaseClient in this scope, update the job status
    // For simplicity, we'll create a new client
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Try to update the most recent job for this utility provider
      await supabaseClient
        .from('scraping_jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'An unknown error occurred',
          completed_at: new Date().toISOString()
        })
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
