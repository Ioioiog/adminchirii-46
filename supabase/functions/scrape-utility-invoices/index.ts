
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { createScraper } from './scrapers/index.ts'
import type { UtilityBill } from './scrapers/base.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log("Received scraping request:", {
      provider: requestBody.provider,
      utilityId: requestBody.utilityId,
      type: requestBody.type,
      username: requestBody.username,
      hasPassword: !!requestBody.password,
      location: requestBody.location
    })

    // Validate request body
    if (!requestBody.username || !requestBody.password || !requestBody.utilityId || !requestBody.provider) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: username, password, utilityId, and provider are required'
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get provider details
    const { data: provider, error: providerError } = await supabaseClient
      .from('utility_provider_credentials')
      .select('property_id, provider_name')
      .eq('id', requestBody.utilityId)
      .single()

    if (providerError || !provider) {
      console.error('Failed to fetch provider details:', providerError)
      throw new Error('Failed to fetch provider details')
    }

    // Create scraping job record
    const { data: job, error: jobError } = await supabaseClient
      .from('scraping_jobs')
      .insert({
        utility_provider_id: requestBody.utilityId,
        status: 'in_progress'
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create scraping job:', jobError)
      throw new Error('Failed to initialize scraping job')
    }

    console.log('Created scraping job:', job.id)

    try {
      // Initialize and run the appropriate scraper
      console.log(`Initializing scraper for provider: ${requestBody.provider}`)
      const scraper = createScraper(requestBody.provider, {
        username: requestBody.username,
        password: requestBody.password
      })

      const scrapingResult = await scraper.scrape()
      
      if (!scrapingResult.success) {
        throw new Error(scrapingResult.error || 'Scraping failed')
      }

      console.log(`Successfully scraped ${scrapingResult.bills.length} bills for ${requestBody.provider}`)

      // Store the bills in the database
      for (const bill of scrapingResult.bills) {
        const { error: billError } = await supabaseClient
          .from('utilities')
          .insert({
            property_id: provider.property_id,
            type: requestBody.type || bill.type,
            amount: bill.amount,
            due_date: bill.due_date,
            status: 'pending',
            meter_reading: bill.meter_reading,
            consumption: bill.consumption,
            period_start: bill.period_start,
            period_end: bill.period_end,
            invoice_number: bill.invoice_number,
            location_name: requestBody.location
          })

        if (billError) {
          console.error('Error storing bill:', { billError, bill })
          throw new Error(`Failed to store utility bill: ${billError.message}`)
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
        console.error('Failed to update job status:', updateError)
        throw updateError
      }

      console.log('Successfully completed scraping job:', {
        jobId: job.id,
        providerId: requestBody.utilityId,
        billsCount: scrapingResult.bills.length
      })

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Successfully fetched and stored utility bills',
          jobId: job.id,
          billsCount: scrapingResult.bills.length
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      )
    } catch (error) {
      // Update job status to failed
      const { error: updateError } = await supabaseClient
        .from('scraping_jobs')
        .update({ 
          status: 'failed',
          error_message: error.message,
          last_run_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateError) {
        console.error('Failed to update job status after error:', updateError)
      }

      throw error
    }
  } catch (error) {
    console.error('Error in scraping function:', error)
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
