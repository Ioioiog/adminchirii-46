
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeEngieRomania } from "./scrapers/engie-romania.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapingRequest {
  provider: string;
  credentials: {
    username: string;
    password: string;
  };
  property_id?: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      throw new Error('BROWSERLESS_API_KEY must be set');
    }
    
    const captchaApiKey = Deno.env.get('CAPTCHA_API_KEY');
    if (!captchaApiKey) {
      throw new Error('CAPTCHA_API_KEY must be set');
    }

    // Parse request body
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', message: 'Only POST requests are allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }

    const requestData: ScrapingRequest = await req.json();
    console.log("Received scraping request for provider:", requestData.provider);

    // Validate request data
    if (!requestData.provider || !requestData.credentials) {
      return new Response(
        JSON.stringify({ error: 'Bad request', message: 'Provider and credentials are required' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Implement scraping based on provider
    let scrapingResult;
    
    switch (requestData.provider.toLowerCase()) {
      case 'engie_romania':
        console.log("Starting ENGIE Romania scraping...");
        scrapingResult = await scrapeEngieRomania(
          requestData.credentials,
          browserlessApiKey,
          captchaApiKey
        );
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Not implemented', message: `Scraper for ${requestData.provider} not yet implemented` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 501 }
        );
    }
    
    console.log(`Scraping completed, ${scrapingResult.length} bills found`);
    
    // Store results in database if property_id is provided
    if (requestData.property_id && scrapingResult.length > 0) {
      console.log(`Storing ${scrapingResult.length} bills for property ${requestData.property_id}`);
      
      const insertPromises = scrapingResult.map(async (bill) => {
        // Check if this bill already exists to avoid duplicates
        const { data: existingBill } = await supabase
          .from('utilities')
          .select('id')
          .eq('invoice_number', bill.invoice_number)
          .eq('property_id', requestData.property_id)
          .maybeSingle();
        
        if (existingBill) {
          console.log(`Bill ${bill.invoice_number} already exists, skipping`);
          return;
        }
        
        // Insert new bill
        return supabase.from('utilities').insert({
          property_id: requestData.property_id,
          amount: bill.amount,
          due_date: bill.due_date,
          type: bill.type,
          status: 'pending',
          invoice_number: bill.invoice_number
        });
      });
      
      await Promise.all(insertPromises);
      console.log("Bills stored successfully");
    }

    // Return the scraping results
    return new Response(
      JSON.stringify({ success: true, data: scrapingResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in scrape-utility-invoices:", error);
    
    const errorResponse: ErrorResponse = {
      error: 'Scraping failed',
      message: error.message || 'Unknown error occurred during scraping'
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
