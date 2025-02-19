
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { EngieRomaniaScraper } from "./scrapers/engie-romania.ts";

interface ScrapingRequest {
  username: string;
  password: string;
  provider: string;
  utilityId: string;
  type: string;
  location: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData: ScrapingRequest = await req.json();
    console.log('Received scraping request:', {
      ...requestData,
      password: '[REDACTED]'
    });

    // Get CAPTCHA API key from environment
    const captchaApiKey = Deno.env.get("CAPTCHA_API_KEY");
    if (!captchaApiKey) {
      throw new Error("CAPTCHA API key not configured");
    }

    let scraper;
    switch (requestData.provider.toLowerCase()) {
      case 'engie_romania':
        scraper = new EngieRomaniaScraper({
          username: requestData.username,
          password: requestData.password,
          captchaApiKey
        });
        break;
      default:
        throw new Error(`Unsupported provider: ${requestData.provider}`);
    }

    const result = await scraper.scrape();
    console.log('Scraping result:', {
      success: result.success,
      billCount: result.bills.length,
      error: result.error
    });

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
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
        error: error.message,
        bills: []
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
