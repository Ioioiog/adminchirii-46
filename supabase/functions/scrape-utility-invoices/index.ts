
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { SELECTORS, JOB_STATUS } from "./scrapers/constants";
import { scrapeEngieRomania } from "./scrapers/engie-romania";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  // Get the Browserless API key from environment variables
  const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
  if (!browserlessApiKey) {
    console.error("BROWSERLESS_API_KEY environment variable is not set");
    return new Response(
      JSON.stringify({
        success: false,
        error: "BROWSERLESS_API_KEY is not configured"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  try {
    // Parse the request body
    const { username, password, utilityId, provider, type, location } = await req.json();
    
    if (!username || !password || !utilityId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters: username, password, or utilityId"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: JOB_STATUS.IN_PROGRESS,
        provider,
        type,
        location
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error('Error creating job record:', jobError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not create job record"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    // Start the scraping process asynchronously
    (async () => {
      try {
        // Determine which scraper to use based on provider
        if (provider === 'ENGIE Romania' || provider.toLowerCase().includes('engie')) {
          console.log('Starting ENGIE Romania scraper...');
          const invoices = await scrapeEngieRomania(
            { username, password },
            browserlessApiKey
          );
          
          // Update job with success status
          await supabase
            .from('scraping_jobs')
            .update({
              status: JOB_STATUS.COMPLETED,
              result: { invoices },
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
            
          console.log('Scraping completed successfully for job:', job.id);
        } else {
          // Update job with error for unsupported provider
          await supabase
            .from('scraping_jobs')
            .update({
              status: JOB_STATUS.FAILED,
              error_message: "Unsupported provider: " + provider,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
            
          console.error('Unsupported provider:', provider);
        }
      } catch (error) {
        console.error('Error processing job', job.id + ':', error);
        
        // Update job with error status
        await supabase
          .from('scraping_jobs')
          .update({
            status: JOB_STATUS.FAILED,
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    })();
    
    // Immediately return the job ID to the client
    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
