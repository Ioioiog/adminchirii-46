
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

    console.log('Starting mock scraping process:', {
      provider,
      type,
      location,
      utilityId,
      hasUsername: !!username,
      hasPassword: !!password
    });

    if (!username || !password) {
      throw new Error('Missing required credentials');
    }

    if (provider !== 'engie_romania') {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Generate mock bills for testing
    const currentDate = new Date();
    const bills = Array.from({ length: 3 }).map((_, index) => {
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + 14 + index);
      
      const periodStart = new Date(currentDate);
      periodStart.setMonth(periodStart.getMonth() - 1);
      
      return {
        amount: 150 + Math.random() * 100,
        due_date: dueDate.toISOString().split('T')[0],
        invoice_number: `ENGIE-${utilityId}-${index + 1}`,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: currentDate.toISOString().split('T')[0],
        type: 'gas',
        status: 'pending'
      };
    });

    console.log('Generated mock bills:', {
      count: bills.length,
      location,
      firstBill: bills[0]
    });

    return new Response(
      JSON.stringify({
        success: true,
        bills
      }),
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
        error: error.message,
        success: false,
        bills: []
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
});
