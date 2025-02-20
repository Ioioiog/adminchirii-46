
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

async function scrapeUtilityBills(request: ScrapingRequest) {
  try {
    // Call the utility provider's API to fetch real bills
    const response = await fetch('https://wecmvyohaxizmnhuvjly.supabase.co/functions/v1/fetch-utility-bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        username: request.username,
        password: request.password,
        provider: request.provider,
        type: request.type
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bills: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched utility bills:', data);
    return data.bills;
  } catch (error) {
    console.error('Error scraping bills:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Scraping function called with method:', req.method);
    
    if (!req.body) {
      console.error('No request body provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Request body is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const request: ScrapingRequest = await req.json();
    console.log('Processing request for provider:', request.provider);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Server configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the utility provider details
    const { data: providerData, error: providerError } = await supabase
      .from('utility_provider_credentials')
      .select(`
        id,
        property_id,
        properties!inner (
          id
        )
      `)
      .eq('id', request.utilityId)
      .single();

    if (providerError || !providerData) {
      throw new Error('Failed to fetch provider details');
    }

    if (!providerData.property_id) {
      throw new Error('No property associated with provider');
    }

    // Create scraping job record
    const { data: jobData, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: request.utilityId,
        status: 'pending' as ScrapingStatus,
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

    // Update status to in_progress
    await supabase
      .from('scraping_jobs')
      .update({ 
        status: 'in_progress' as ScrapingStatus,
      })
      .eq('id', jobData.id);

    // Fetch real bills from the utility provider
    const bills = await scrapeUtilityBills(request);
    
    if (!bills || !Array.isArray(bills)) {
      throw new Error('No valid bills returned from scraping');
    }

    // Store the real bills
    const { error: billError } = await supabase
      .from('utilities')
      .insert(
        bills.map(bill => ({
          property_id: providerData.property_id,
          utility_provider_id: request.utilityId,
          type: request.type,
          amount: bill.amount,
          due_date: bill.due_date,
          invoice_number: bill.invoice_number,
          status: bill.status,
          currency: 'USD'
        }))
      );

    if (billError) {
      console.error('Failed to store utility bills:', billError);
      
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed' as ScrapingStatus,
          error_message: billError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id);
        
      throw new Error(`Failed to store utility bills: ${billError.message}`);
    }

    // Update job as completed
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed' as ScrapingStatus,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobData.id);

    console.log('Successfully completed scraping job with real data');
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        bills
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
