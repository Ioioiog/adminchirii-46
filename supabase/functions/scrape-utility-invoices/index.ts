
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    console.log('Received scraping request:', {
      provider,
      type,
      location,
      utilityId,
      hasUsername: !!username,
      hasPassword: !!password
    });

    // For now, return a mock response to test the connection
    return new Response(JSON.stringify({
      success: true,
      bills: [{
        amount: 100,
        due_date: new Date().toISOString().split('T')[0],
        invoice_number: "TEST-001",
        period_start: "2024-01-01",
        period_end: "2024-01-31",
        type: "gas",
        status: "pending"
      }]
    }), {
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
