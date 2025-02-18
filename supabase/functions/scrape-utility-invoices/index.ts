
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UtilityBill {
  amount: number;
  due_date: string;
  type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log("Received request body:", {
      ...requestBody,
      password: requestBody.password ? '[REDACTED]' : undefined
    })

    if (!requestBody.username || !requestBody.password || !requestBody.utilityId) {
      throw new Error('Missing required fields: username, password, or utilityId')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create scraping job
    const { data: job, error: jobError } = await supabaseClient
      .from('scraping_jobs')
      .insert({
        utility_provider_id: requestBody.utilityId,
        status: 'in_progress'
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    console.log('Created scraping job:', { jobId: job.id })

    // Get provider details
    const { data: provider, error: providerError } = await supabaseClient
      .from('utility_provider_credentials')
      .select('property_id, provider_name')
      .eq('id', requestBody.utilityId)
      .single()

    if (providerError || !provider) {
      throw new Error('Failed to fetch provider details')
    }

    // Simulate fetching bills from provider's website
    // In a real implementation, this would make actual HTTP requests to the provider's website
    const mockBills: UtilityBill[] = [
      {
        amount: Math.floor(Math.random() * 200) + 50,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: requestBody.type || 'electricity'
      },
      {
        amount: Math.floor(Math.random() * 200) + 50,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: requestBody.type || 'electricity'
      }
    ]

    console.log('Fetched bills:', mockBills)

    // Insert bills into utilities table
    for (const bill of mockBills) {
      const { error: billError } = await supabaseClient
        .from('utilities')
        .insert({
          property_id: provider.property_id,
          type: bill.type,
          amount: bill.amount,
          due_date: bill.due_date,
          status: 'pending'
        })

      if (billError) {
        console.error('Error inserting bill:', billError)
        throw new Error('Failed to store utility bill')
      }
    }

    // Update job status to completed
    const { error: updateError } = await supabaseClient
      .from('scraping_jobs')
      .update({ 
        status: 'completed',
        last_run_at: new Date().toISOString()
      })
      .eq('id', job.id)

    if (updateError) {
      throw updateError
    }

    console.log('Successfully completed scraping job')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully fetched and stored utility bills',
        jobId: job.id,
        billsCount: mockBills.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
