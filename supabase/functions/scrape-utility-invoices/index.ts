
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { getScraper } from "./scrapers/index.ts";
import { JOB_STATUS } from "./constants.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body
    const body = await req.json();
    const { username, password, utilityId, provider, type, location } = body;

    // Validate required fields
    if (!username || !password || !provider) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: JOB_STATUS.IN_PROGRESS,
        provider: provider,
        type: type,
        location: location
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Error creating job record:', jobError);
      throw new Error('Failed to create job record');
    }

    console.log(`Created job ${job.id} for provider ${provider}`);

    // Process the job in the background
    (async () => {
      try {
        console.log(`Starting scraping for job ${job.id}`);
        
        // Get the appropriate scraper
        const scraper = getScraper(provider);
        
        // Run the scraper
        const result = await scraper(username, password);
        
        console.log(`Scraping completed for job ${job.id}`);
        
        // Update job status to completed
        const { error: updateError } = await supabase
          .from('scraping_jobs')
          .update({
            status: JOB_STATUS.COMPLETED,
            completed_at: new Date().toISOString(),
            results: result.bills
          })
          .eq('id', job.id);
        
        if (updateError) {
          console.error('Error updating job status:', updateError);
        }
        
        // Insert the utility bills if any were found
        if (result.bills && result.bills.length > 0 && utilityId) {
          const utilityBills = result.bills.map((bill: any) => ({
            utility_provider_id: utilityId,
            amount: bill.amount,
            due_date: bill.due_date,
            invoice_number: bill.invoice_number,
            type: bill.type || type,
            status: bill.status || 'unpaid',
            issued_date: new Date().toISOString(),
            scraping_job_id: job.id
          }));
          
          const { error: billsError } = await supabase
            .from('utilities')
            .insert(utilityBills);
          
          if (billsError) {
            console.error('Error inserting utility bills:', billsError);
          }
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        // Update job status to failed
        await supabase
          .from('scraping_jobs')
          .update({
            status: JOB_STATUS.FAILED,
            error_message: error.message
          })
          .eq('id', job.id);
      }
    })();

    // Return success with job id (background processing continues)
    return new Response(JSON.stringify({
      success: true,
      jobId: job.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
