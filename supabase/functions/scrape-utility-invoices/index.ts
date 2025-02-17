
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface RequestBody {
  username: string;
  password: string;
  utilityId: string;
}

async function handler(req: Request) {
  console.log("Function invoked with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'POST') {
      console.log(`Invalid method ${req.method} received`);
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Log headers for debugging
    console.log("Request headers:", {
      contentType: req.headers.get('content-type'),
      authorization: req.headers.has('authorization') ? 'present' : 'missing',
      origin: req.headers.get('origin')
    });

    // Parse and validate request body
    const body = await req.json() as RequestBody;
    console.log("Received request body:", {
      username: body.username ? '[PRESENT]' : '[MISSING]',
      password: body.password ? '[PRESENT]' : '[MISSING]',
      utilityId: body.utilityId ? '[PRESENT]' : '[MISSING]'
    });

    // Validate required fields
    if (!body.username || !body.password || !body.utilityId) {
      const missingFields = [];
      if (!body.username) missingFields.push('username');
      if (!body.password) missingFields.push('password');
      if (!body.utilityId) missingFields.push('utilityId');

      console.log("Validation failed. Missing fields:", missingFields);

      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          missingFields,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log("Request validation successful");

    // For testing/development, return a mock response
    const mockResponse = {
      success: true,
      message: 'Test response - scraping will be implemented soon',
      mockBills: [
        {
          invoice_number: 'TEST-001',
          due_date: new Date().toISOString(),
          amount: 150.00,
          status: 'pending',
          currency: 'RON'
        }
      ]
    };

    console.log("Sending mock response:", mockResponse);

    return new Response(
      JSON.stringify(mockResponse),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error("Error in edge function:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

serve(handler);
