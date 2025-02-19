
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScraperCredentials {
  username: string;
  password: string;
}

interface Bill {
  amount: number;
  due_date: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  type: 'gas' | 'electricity';
  status: 'pending' | 'paid';
}

interface ScraperResult {
  success: boolean;
  bills: Bill[];
  error?: string;
}

async function getAuthToken(credentials: ScraperCredentials): Promise<string> {
  const response = await fetch('https://my.engie.ro/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password
    })
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data = await response.json();
  return data.token;
}

async function scrapeEngie(credentials: ScraperCredentials): Promise<ScraperResult> {
  console.log('🚀 Starting ENGIE Romania API scraping process');
  
  try {
    // Get authentication token
    console.log('🔑 Authenticating...');
    const token = await getAuthToken(credentials);

    // Fetch invoices
    console.log('📄 Fetching invoices...');
    const response = await fetch('https://my.engie.ro/api/invoices/history', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }

    const invoices = await response.json();
    
    // Transform the data into our expected format
    const bills = invoices.map((invoice: any) => ({
      amount: parseFloat(invoice.amount),
      due_date: invoice.dueDate,
      invoice_number: invoice.number,
      period_start: invoice.periodStart,
      period_end: invoice.periodEnd,
      type: 'gas',
      status: invoice.isPaid ? 'paid' : 'pending'
    }));

    console.log(`✅ Successfully found ${bills.length} invoices`);
    return { success: true, bills };

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return {
      success: false,
      bills: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log('📨 Received scraping request for:', requestData.username);

    const result = await scrapeEngie({
      username: requestData.username,
      password: requestData.password
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error in scrape-engie function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        bills: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
