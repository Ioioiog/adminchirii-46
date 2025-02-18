import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse and validate request body
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

    console.log('Successfully created scraping job:', { jobId: job.id })

    // Start scraping process here
    // ... Implement actual scraping logic

    // Update job status to completed
    const { error: updateError } = await supabaseClient
      .from('scraping_jobs')
      .update({ status: 'completed' })
      .eq('id', job.id)

    if (updateError) {
      throw updateError
    }

    console.log('Successfully updated scraping job status to completed')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Scraping job created successfully',
        jobId: job.id
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
