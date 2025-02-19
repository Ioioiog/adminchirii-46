
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

    if (!username || !password) {
      console.error('Missing credentials');
      throw new Error('Missing required credentials');
    }

    if (provider !== 'engie_romania') {
      console.error('Unsupported provider:', provider);
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log('Generating mock response for location:', location);

    // Generate a more realistic mock response based on the request data
    const currentDate = new Date();
    const mockBills = Array.from({ length: 3 }).map((_, index) => {
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + 14 + (index * 30)); // Spread out due dates

      const startDate = new Date(currentDate);
      startDate.setMonth(startDate.getMonth() - (index + 1));
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      return {
        amount: 150 + (Math.random() * 50), // Random amount between 150-200
        due_date: dueDate.toISOString().split('T')[0],
        invoice_number: `ENGIE-${utilityId.slice(0, 8)}-${index + 1}`,
        period_start: startDate.toISOString().split('T')[0],
        period_end: endDate.toISOString().split('T')[0],
        type: type || 'gas',
        status: 'pending'
      };
    });

    console.log('Generated mock bills:', {
      count: mockBills.length,
      location,
      firstBill: mockBills[0]
    });

    return new Response(JSON.stringify({
      success: true,
      bills: mockBills
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
