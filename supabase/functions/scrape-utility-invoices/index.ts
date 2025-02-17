
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
    // Verify request method
    if (req.method !== 'POST') {
      console.log(`Invalid method ${req.method} received`);
      return new Response(
        JSON.stringify({ error: `Method ${req.method} not allowed` }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log("Invalid Content-Type:", contentType);
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Log request details
    console.log("Request headers:", {
      contentType,
      authorization: req.headers.has('authorization') ? 'present' : 'missing',
      origin: req.headers.get('origin')
    });

    // Get the raw body text first
    const bodyText = await req.text();
    console.log("Raw request body:", bodyText);

    // Try to parse the JSON
    let body: RequestBody;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message
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

    // Log parsed body (safely)
    console.log("Parsed request body:", {
      username: body.username ? '[PRESENT]' : '[MISSING]',
      password: body.password ? '[PRESENT]' : '[MISSING]',
      utilityId: body.utilityId ? '[PRESENT]' : '[MISSING]'
    });

    // Validate required fields
    const missingFields = [];
    if (!body.username) missingFields.push('username');
    if (!body.password) missingFields.push('password');
    if (!body.utilityId) missingFields.push('utilityId');

    if (missingFields.length > 0) {
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
    // Log the full error details
    console.error("Error in edge function:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
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
