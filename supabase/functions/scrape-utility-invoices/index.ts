
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeEngieRomania } from "./scrapers/index.ts";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Browserless API key from environment variables
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('BROWSERLESS_API_KEY is required for web scraping');
    }
    
    // Get 2Captcha API key for solving reCAPTCHA
    const captchaApiKey = Deno.env.get('CAPTCHA_API_KEY');
    if (!captchaApiKey) {
      throw new Error('CAPTCHA_API_KEY is required for solving reCAPTCHA challenges');
    }
    
    // Parse request body
    const requestData = await req.json();
    const { username, password, provider_id, provider, type, location } = requestData;

    if (!username || !password || !provider_id) {
      throw new Error('Username, password, and provider_id are required');
    }
    
    console.log(`Starting scraping for provider: ${provider}`);
    
    // Create a scraping job record
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: provider_id,
        status: 'in_progress',
        provider: provider,
        type: type,
        location: location
      })
      .select('id')
      .single();
      
    if (jobError) {
      throw new Error(`Failed to create scraping job: ${jobError.message}`);
    }
    
    const jobId = jobData.id;
    console.log(`Created scraping job with ID: ${jobId}`);
    
    // Start scraping in a non-blocking way
    (async () => {
      try {
        let invoices = [];
        
        // Select the appropriate scraper based on the provider
        if (provider.toUpperCase().includes('ENGIE')) {
          invoices = await scrapeEngieRomania(
            { username, password },
            browserlessApiKey,
            captchaApiKey
          );
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
        
        console.log(`Successfully scraped ${invoices.length} invoices`);
        
        // Process and store the invoices
        if (invoices.length > 0) {
          const processedInvoices = invoices.map(invoice => ({
            property_id: provider_id,
            type: type || invoice.type,
            amount: invoice.amount,
            currency: 'RON',
            due_date: invoice.due_date,
            invoice_number: invoice.invoice_number,
            status: 'pending'
          }));
          
          const { error: insertError } = await supabase
            .from('utilities')
            .upsert(processedInvoices, { 
              onConflict: 'invoice_number',
              ignoreDuplicates: false 
            });
            
          if (insertError) {
            throw new Error(`Failed to store invoices: ${insertError.message}`);
          }
          
          // Update job status to completed
          await supabase
            .from('scraping_jobs')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', jobId);
            
          console.log(`Job ${jobId} completed successfully`);
        } else {
          // If no invoices were found
          await supabase
            .from('scraping_jobs')
            .update({ 
              status: 'completed', 
              error_message: 'No invoices found',
              completed_at: new Date().toISOString()
            })
            .eq('id', jobId);
            
          console.log(`Job ${jobId} completed with no invoices found`);
        }
      } catch (error) {
        console.error('Error during scraping process:', error);
        
        // Update job status to failed
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'failed', 
            error_message: error.message || 'Unknown error during scraping',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        console.log(`Job ${jobId} failed: ${error.message}`);
      }
    })();
    
    // Return job ID immediately
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobId,
        message: 'Scraping job created and started'
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
