
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scrapers } from './scrapers/index.ts';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  console.log('Scrape utility invoices function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Safely parse the request body with error handling
    let requestData;
    try {
      const bodyText = await req.text();
      
      // Log request information (without sensitive data)
      console.log('Request method:', req.method);
      console.log('Request headers:', Object.fromEntries([...req.headers]));
      console.log('Request body length:', bodyText.length);
      
      // Check if body is empty
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body');
      }
      
      // Try to parse JSON
      requestData = JSON.parse(bodyText);
      
      // Log parsed data (excluding password)
      const logData = { ...requestData };
      if (logData.password) logData.password = '***'; // Mask password
      console.log('Parsed request data:', logData);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid request format: ${parseError.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields
    const { username, password, utilityId, provider } = requestData;
    if (!username || !password || !utilityId || !provider) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: username, password, utilityId, and provider are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create scraping job record
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: 'in_progress',
        provider: provider,
        type: requestData.type || null,
        location: requestData.location || null
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Error creating scraping job:', jobError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create scraping job: ${jobError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const jobId = jobData.id;
    console.log(`Created scraping job with ID: ${jobId}`);

    // Process the scraping request asynchronously
    (async () => {
      try {
        // Find the appropriate scraper based on provider
        const scraperKey = provider.toLowerCase().replace(/\s+/g, '-');
        const scraper = scrapers[scraperKey];

        if (!scraper) {
          throw new Error(`No scraper found for provider: ${provider}`);
        }

        console.log(`Using scraper for provider: ${provider}`);

        // Execute the scrape
        const result = await scraper.scrape({
          username,
          password,
          ...requestData // Pass through any additional options
        });

        console.log(`Scraping completed for job ${jobId}`);

        // Update the job record with success status
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        console.log(`Updated job ${jobId} to completed status`);
      } catch (error) {
        console.error(`Scraping error for job ${jobId}:`, error);

        // Update the job record with failure status
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: `${provider} scraping failed: ${error.message || error}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId);

        console.log(`Updated job ${jobId} to failed status`);
      }
    })();

    // Return immediate success response with job ID
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobId,
        message: 'Scraping job created and processing started'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Unhandled error in scrape-utility-invoices function:', err);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${err.message || 'Unknown error'}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
