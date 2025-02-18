
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
  location?: string
}

interface ErrorResponse {
  error: string
  details?: unknown
  stage?: string
}

console.log('Loading scrape-utility-invoices function...')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse and validate request body
    let requestData: RequestBody
    try {
      requestData = await req.json()
      console.log('Received request for utility scraping:', {
        utilityId: requestData.utilityId,
        provider: requestData.provider,
        type: requestData.type,
        hasUsername: !!requestData.username,
        hasPassword: !!requestData.password,
        location: requestData.location
      })
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return createErrorResponse({
        error: 'Invalid request format',
        details: error,
        stage: 'request_parsing'
      })
    }

    // Validate required fields
    if (!requestData.username || !requestData.password || !requestData.utilityId) {
      const missingFields = []
      if (!requestData.username) missingFields.push('username')
      if (!requestData.password) missingFields.push('password')
      if (!requestData.utilityId) missingFields.push('utilityId')
      
      console.error('Missing required fields:', missingFields)
      return createErrorResponse({
        error: 'Missing required credentials',
        details: { missingFields },
        stage: 'field_validation'
      })
    }

    // Initialize cookie jar for maintaining session
    const cookieJar: string[] = []
    console.log('Initialized session with empty cookie jar')

    // Initialize Supabase client
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      console.log('Successfully initialized Supabase client')

      // Create a scraping job record
      let scrapingJob
      try {
        const { data, error } = await supabaseClient
          .from('scraping_jobs')
          .insert([
            {
              utility_provider_id: requestData.utilityId,
              status: 'in_progress'
            }
          ])
          .select()
          .single()

        if (error) throw error
        scrapingJob = data
        console.log('Successfully created scraping job:', { jobId: scrapingJob.id })
      } catch (error) {
        console.error('Failed to create scraping job:', error)
        return createErrorResponse({
          error: 'Failed to create scraping job',
          details: error,
          stage: 'job_creation'
        })
      }

      // Store any cookies received from the response
      const updateCookies = (response: Response) => {
        const newCookies = response.headers.get('set-cookie')
        if (newCookies) {
          cookieJar.push(...newCookies.split(',').map(cookie => cookie.split(';')[0]))
          console.log('Updated cookie jar:', { cookieCount: cookieJar.length })
        }
      }

      // Log session management
      console.log('Session management:', {
        cookieCount: cookieJar.length,
        hasAuthCookie: cookieJar.some(cookie => cookie.toLowerCase().includes('auth'))
      })

      // Update the scraping job status
      try {
        const { error: updateError } = await supabaseClient
          .from('scraping_jobs')
          .update({ 
            status: 'completed',
            last_run_at: new Date().toISOString()
          })
          .eq('id', scrapingJob.id)

        if (updateError) throw updateError
        console.log('Successfully updated scraping job status to completed')
      } catch (error) {
        console.error('Failed to update scraping job status:', error)
        return createErrorResponse({
          error: 'Failed to update scraping job status',
          details: error,
          stage: 'job_update'
        })
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
      console.error('Supabase client error:', error)
      return createErrorResponse({
        error: 'Supabase client error',
        details: error,
        stage: 'supabase_client'
      })
    }
  } catch (error) {
    console.error('Unexpected error in scrape-utility-invoices:', error)
    return createErrorResponse({
      error: 'An unexpected error occurred',
      details: error,
      stage: 'unknown'
    })
  }
})

function createErrorResponse(errorData: ErrorResponse): Response {
  console.error('Creating error response:', errorData)
  return new Response(
    JSON.stringify(errorData),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    }
  )
}
