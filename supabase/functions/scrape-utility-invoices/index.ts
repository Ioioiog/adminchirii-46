
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapingRequest {
  username: string;
  password: string;
  provider: string;
  type: string;
  utilityId: string;
  location: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ScrapingRequest = await req.json();
    console.log('Received scraping request for:', {
      provider: requestData.provider,
      type: requestData.type,
      location: requestData.location
    });

    // Check provider type
    if (requestData.provider !== 'engie_romania') {
      throw new Error(`Unsupported provider: ${requestData.provider}`);
    }

    // Call specific provider endpoint
    const { data: scrapeData, error: scrapeError } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-engie`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          username: requestData.username,
          password: requestData.password
        })
      }
    ).then(res => res.json());

    if (scrapeError) {
      throw new Error(scrapeError);
    }

    return new Response(
      JSON.stringify(scrapeData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-utility-invoices function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        bills: []
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
