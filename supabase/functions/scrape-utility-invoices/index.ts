
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from '@supabase/supabase-js'

interface BrowserlessResponse {
  data: string;
  status: number;
  statusText: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { username, password, utilityId, provider, type, location } = await req.json()
    console.log(`Starting scraping for ${provider} at location ${location}`);

    if (!username || !password || !utilityId || !provider) {
      throw new Error('Missing required parameters');
    }

    // Create a scraping job record
    const { data: jobData, error: jobError } = await supabaseClient
      .from('scraping_jobs')
      .insert({
        utility_provider_id: utilityId,
        status: 'in_progress',
        provider: provider, // Changed from provider_name to provider
        location: location
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create scraping job: ${jobError.message}`);
    }

    console.log(`Created scraping job: ${jobData.id}`);

    // Make request to Browserless API
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('Browserless API key not configured');
    }

    console.log('Making request to Browserless API...');
    const response = await fetch('https://chrome.browserless.io/content', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessApiKey}`,
      },
      body: JSON.stringify({
        url: 'https://my.engie.ro/',
        gotoOptions: {
          waitUntil: 'networkidle0',
          timeout: 30000,
        },
        authenticate: {
          username,
          password,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Browserless API error: ${response.statusText}`);
    }

    const html = await response.text();
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
        throw new Error(`Failed to insert bills: ${billsError.message}`);
      }
    }

    // Update job status to completed
    const { error: updateError } = await supabaseClient
      .from('scraping_jobs')
      .update({ status: 'completed' })
      .eq('id', jobData.id);

    if (updateError) {
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        billsCount: bills.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
