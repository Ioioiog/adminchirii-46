
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
    const { username, password, utilityId, provider, type, location } = await req.json() as ScrapingRequest;
    
    console.log('Starting scraping for provider:', provider);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let bills;
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');

    if (!browserlessApiKey) {
      throw new Error('Browserless API key not configured');
    }

    if (provider === 'engie_romania') {
      bills = await scrapeEngieRomania({
        username,
        password,
        utilityId,
        type,
        location,
        browserlessApiKey
      });
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (bills && bills.length > 0) {
      const { error: billsError } = await supabaseClient
        .from('utilities')
        .insert(bills.map(bill => ({
          ...bill,
          property_id: utilityId
        })));

      if (billsError) {
        throw billsError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, bills }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in scrape-utility-invoices:', error);
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
