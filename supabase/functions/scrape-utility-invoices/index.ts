
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { scrapeEngieRomania } from "./scrapers/engie-romania";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Browserless API key
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    if (!browserlessApiKey) {
      throw new Error("BROWSERLESS_API_KEY is not set in environment variables");
    }

    // Parse request body
    const { username, password, utilityId, provider, type, location } = await req.json();
    console.log(`Received scraping request for ${provider} (${type}) at ${location}`);

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing credentials" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a scraping job record
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: 'pending',
        provider,
        type,
        location
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Error creating scraping job:', jobError);
      throw new Error('Failed to create job record');
    }

    // Start scraping process in the background
    EdgeRuntime.waitUntil((async () => {
      try {
        let bills = [];
        
        console.log(`Starting scraping process for provider: ${provider}`);
        
        // Determine which scraper to use based on provider name
        if (provider.toLowerCase().includes('engie')) {
          try {
            bills = await scrapeEngieRomania({ username, password }, browserlessApiKey);
          } catch (e) {
            if (e.message.includes("reCAPTCHA") || e.message.includes("captcha")) {
              await supabase
                .from('scraping_jobs')
                .update({
                  status: 'failed',
                  error_message: "Provider website requires CAPTCHA verification. Please log in directly to the provider website."
                })
                .eq('id', job.id);
              return;
            }
            throw e;
          }
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
        
        // Update job with success status
        console.log(`Scraping completed successfully, updating job ${job.id}`);
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            bills: bills,
          })
          .eq('id', job.id);
      } catch (error) {
        console.error('Error in background scraping task:', error);
        
        // Update job with failure status
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', job.id);
      }
    })());

    // Return immediate response with job ID
    return new Response(
      JSON.stringify({ success: true, jobId: job.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in scrape-utility-invoices function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
