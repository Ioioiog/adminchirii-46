
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

type ScrapingStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface ScrapingRequest {
  username: string;
  password: string;
  utilityId: string;
  provider: string;
  type: string;
  location: string;
}

interface ScrapingResponse {
  success: boolean;
  jobId?: string;
  bills?: Array<{
    amount: number;
    due_date: string;
    invoice_number: string;
    type: string;
    status: string;
  }>;
  error?: string;
}

// For initial testing, we'll use mock data
async function mockScrapeEngie() {
  console.log('Using mock data for testing edge function connectivity');
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    success: true,
    bills: [
      {
        amount: 150.50,
        due_date: '2024-03-15',
        invoice_number: 'TEST-001',
        type: 'gas',
        status: 'pending'
      },
      {
        amount: 180.75,
        due_date: '2024-02-15',
        invoice_number: 'TEST-002',
        type: 'gas',
        status: 'paid'
      }
    ]
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting scraping process...');
    
    // Validate request
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const request: ScrapingRequest = await req.json();
    console.log('Received request for provider:', request.provider);

    // Validate env variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get provider details
    const { data: providerData, error: providerError } = await supabase
      .from('utility_provider_credentials')
      .select('id, property_id')
      .eq('id', request.utilityId)
      .single();

    if (providerError || !providerData) {
      throw new Error('Failed to fetch provider details');
    }

    if (!providerData.property_id) {
      throw new Error('No property associated with provider');
    }

    // Create scraping job
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: request.utilityId,
        status: 'pending',
        provider: request.provider,
        type: request.type,
        location: request.location,
        last_run_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError || !jobData) {
      throw new Error('Failed to create scraping job');
    }

    // Update job to in_progress
    await supabase
      .from('scraping_jobs')
      .update({ status: 'in_progress' })
      .eq('id', jobData.id);

    // Use mock data for now
    const scrapingResult = await mockScrapeEngie();

    if (scrapingResult.bills?.length) {
      // Insert mock bills
      const { error: billError } = await supabase
        .from('utilities')
        .insert(
          scrapingResult.bills.map(bill => ({
            property_id: providerData.property_id,
            utility_provider_id: request.utilityId,
            type: request.type,
            amount: bill.amount,
            due_date: bill.due_date,
            invoice_number: bill.invoice_number,
            status: bill.status,
            currency: 'RON'
          }))
        );

      if (billError) {
        throw new Error(`Failed to store utility bills: ${billError.message}`);
      }
    }

    // Mark job as completed
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        bills: scrapingResult.bills
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
