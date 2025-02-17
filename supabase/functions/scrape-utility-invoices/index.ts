
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  username: string
  password: string
  utilityId: string
  provider: string
  type: 'electricity' | 'water' | 'gas'
}

console.log('Loading scrape-utility-invoices function...')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const requestData: RequestBody = await req.json()
    console.log('Received request for utility scraping:', {
      utilityId: requestData.utilityId,
      provider: requestData.provider,
      type: requestData.type,
      hasUsername: !!requestData.username,
      hasPassword: !!requestData.password
    })

    // Validate request data
    if (!requestData.username || !requestData.password || !requestData.utilityId) {
      throw new Error('Missing required credentials')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create a scraping job record
    const { data: scrapingJob, error: jobError } = await supabaseClient
      .from('scraping_jobs')
      .insert([
        {
          utility_provider_id: requestData.utilityId,
          status: 'in_progress'
        }
      ])
      .select()
      .single()

    if (jobError) {
      console.error('Error creating scraping job:', jobError)
      throw new Error('Failed to create scraping job')
    }

    // For now, simulate successful scraping
    // In a real implementation, you would use the credentials to scrape the utility provider's website
    console.log('Successfully initialized scraping job:', scrapingJob.id)

    // Update the scraping job status
    const { error: updateError } = await supabaseClient
      .from('scraping_jobs')
      .update({ 
        status: 'completed',
        last_run_at: new Date().toISOString()
      })
      .eq('id', scrapingJob.id)

    if (updateError) {
      console.error('Error updating scraping job:', updateError)
      throw new Error('Failed to update scraping job status')
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Utility bill scraping initiated successfully',
        jobId: scrapingJob.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in scrape-utility-invoices:', error.message)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while scraping utility bills'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
