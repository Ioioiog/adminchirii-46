
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from '@supabase/supabase-js'

interface BrowserlessResponse {
  data: string;
  status: number;
  statusText: string;
}

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

    // Make request to Browserless API
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return handleScrapingError({
        message: 'Browserless API key not configured',
        step: 'api_configuration'
      }, supabaseClient, jobId);
    }

    console.log('Making request to Browserless API...');
    
    // For Engie Romania, we need to handle the login process manually
    const script = `
      async () => {
        try {
          console.log('Waiting for login form elements...');
          // Wait for the login form
          await page.waitForSelector('#email', { timeout: 10000 });
          await page.waitForSelector('#password', { timeout: 10000 });
          
          console.log('Entering credentials...');
          // Type credentials
          await page.type('#email', '${username}');
          await page.type('#password', '${password}');
          
          console.log('Submitting login form...');
          // Click login button
          await page.click('button[type="submit"]');
          
          console.log('Waiting for navigation after login...');
          // Wait for navigation
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });
          
          console.log('Getting page content...');
          // Get the page content
          return await page.content();
        } catch (error) {
          console.error('Browser script error:', error);
          throw new Error('Failed to login: ' + error.message);
        }
      }
    `;

    const response = await fetch('https://chrome.browserless.io/function', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessApiKey}`,
      },
      body: JSON.stringify({
        code: script,
        context: {
          url: 'https://my.engie.ro/',
          waitForFunction: true,
          gotoOptions: {
            waitUntil: 'networkidle0',
            timeout: 30000,
          }
        }
      }),
    });

    const responseText = await response.text();
    console.log('Browserless API raw response:', responseText);

    if (!response.ok) {
      return handleScrapingError({
        message: `Browserless API error: ${response.statusText}`,
        details: responseText,
        step: 'browserless_api_call'
      }, supabaseClient, jobId);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      return handleScrapingError({
        message: 'Failed to parse Browserless API response',
        details: { error, responseText },
        step: 'response_parsing'
      }, supabaseClient, jobId);
    }

    console.log('Successfully fetched page content');

    // For testing purposes, create a sample bill
    const bills = [{
      amount: 150,
      due_date: new Date().toISOString(),
      invoice_number: 'TEST-001',
      type: type,
      status: 'pending',
      property_id: utilityId
    }];

    // Insert the bills into the database
    if (bills.length > 0) {
      const { error: billsError } = await supabaseClient
        .from('utilities')
        .insert(bills);

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
