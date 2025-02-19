
import { serve } from "https://deno.fresh.dev/server/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { EngieRomaniaScraper } from "./scrapers/engie-romania.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { username, password, provider, utilityId, type, location } = await req.json();

    if (!username || !password || !provider) {
      throw new Error('Missing required credentials');
    }

    console.log('Starting scraping process for:', {
      provider,
      type,
      location,
      utilityId,
      hasUsername: !!username,
      hasPassword: !!password
    });

    let scraper;
    switch (provider) {
      case 'engie_romania':
        scraper = new EngieRomaniaScraper({ username, password });
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const result = await scraper.scrape();
    console.log('Scraping completed:', { success: result.success, billsCount: result.bills.length });

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in scrape-utility-invoices function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      bills: []
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
