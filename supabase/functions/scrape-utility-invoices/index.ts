
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from '@supabase/supabase-js'

const getScraperForProvider = async (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'engie_romania':
      const { scrapeEngieRomania } = await import('./scrapers/engie-romania.ts');
      return scrapeEngieRomania;
    default:
      throw new Error(`No scraper found for provider: ${provider}`);
  }
};

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
        provider_name: provider,
        location: location
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create scraping job: ${jobError.message}`);
    }

    console.log(`Created scraping job: ${jobData.id}`);

    // Start the scraping process
    const scraper = await getScraperForProvider(provider);
    
    console.log('Starting scraping process...');
    const bills = await scraper({
      username,
      password,
      utilityId,
      type,
      location,
      browserlessApiKey: Deno.env.get('BROWSERLESS_API_KEY')
    });

    console.log(`Scraping completed. Found ${bills.length} bills`);

    // Insert the bills into the database
    if (bills.length > 0) {
      const { error: billsError } = await supabaseClient
        .from('utilities')
        .insert(bills.map(bill => ({
          ...bill,
          property_id: utilityId,
          status: 'pending'
        })));

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
