
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { scrapeEngieRomania } from './scrapers/engie-romania.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  username: string;
  password: string;
  utilityId: string;
  provider: string;
  type: string;
  location: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');

    if (!browserlessApiKey) {
      console.error('BROWSERLESS_API_KEY is not set in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'BROWSERLESS_API_KEY is not configured. Please set this in your environment variables.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const requestData: RequestBody = await req.json();
    console.log('Received request for provider:', requestData.provider);
    
    // Create a scraping job record
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: requestData.utilityId,
        status: 'in_progress',
        provider: requestData.provider,
        type: requestData.type,
        location: requestData.location
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error('Error creating scraping job record:', jobError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create scraping job record' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    const jobId = jobData.id;
    console.log('Created scraping job:', jobId);
    
    // Run the scraping in the background to avoid timeout
    (async () => {
      try {
        // Handle different providers
        let invoices = [];
        
        if (requestData.provider.toLowerCase().includes('engie')) {
          console.log('Scraping ENGIE Romania...');
          invoices = await scrapeEngieRomania(
            { 
              username: requestData.username, 
              password: requestData.password 
            },
            browserlessApiKey
          );
        } else {
          throw new Error(`Unsupported provider: ${requestData.provider}`);
        }
        
        console.log(`Successfully scraped ${invoices.length} invoices`);
        
        // Update the job record with the results
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'completed',
            result: { invoices },
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        console.log('Updated job status to completed');
      } catch (error) {
        console.error('Error processing job', jobId, ':', error);
        
        // Update the job record with the error
        await supabase
          .from('scraping_jobs')
          .update({ 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        console.error('Updated job status to failed:', error.message);
      }
    })();
    
    // Return immediate success response with the job ID
    return new Response(
      JSON.stringify({ success: true, jobId }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
