
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Parse and validate request body
    const body = await req.json() as RequestBody;
    console.log("Received request with body:", {
      ...body,
      password: body.password ? '[REDACTED]' : undefined
    });

    // Validate required fields
    if (!body.username || !body.password || !body.utilityId) {
      const missingFields = [];
      if (!body.username) missingFields.push('username');
      if (!body.password) missingFields.push('password');
      if (!body.utilityId) missingFields.push('utilityId');

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

    // For testing/development, return a mock response
    console.log("Returning mock response for testing");
    return new Response(
      JSON.stringify({
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
    console.error("Error in edge function:", error);
    
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
