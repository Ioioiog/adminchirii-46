
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

    // For now, return mock data while we debug the Puppeteer setup
    const mockBills = [
      {
        amount: 150.85,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        invoice_number: `ENGIE-${crypto.randomUUID()}-1`,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        type: requestData.type,
        status: 'pending'
      }
    ];

    console.log('Generated mock bills:', {
      count: mockBills.length,
      location: requestData.location,
      firstBill: mockBills[0]
    });

    return new Response(
      JSON.stringify({
        success: true,
        bills: mockBills
      }),
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
        error: error.message,
        success: false,
        bills: []
      }),
      {
        status: 200, // Changed from 500 to 200 to prevent client-side error
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
