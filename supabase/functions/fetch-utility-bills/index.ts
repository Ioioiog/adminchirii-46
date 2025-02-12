
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { propertyId } = await req.json()

    // Validate propertyId
    if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
      throw new Error('Invalid property ID')
    }

    console.log('Fetching bills for property:', propertyId)

    // Get property details and utility provider credentials
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', propertyId)
      .single()

    if (propertyError) throw propertyError

    const { data: credentials, error: credentialsError } = await supabase
      .from('utility_provider_credentials')
      .select('id, provider_name')
      .eq('landlord_id', property.landlord_id)

    if (credentialsError) throw credentialsError
    console.log('Found credentials:', credentials)

    // Create scraping jobs for each provider
    for (const cred of credentials) {
      const { error: jobError } = await supabase
        .from('scraping_jobs')
        .insert({
          utility_provider_id: cred.id,
          status: 'pending'
        })

      if (jobError) {
        console.error(`Error creating job for provider ${cred.provider_name}:`, jobError)
      } else {
        console.log(`Created scraping job for provider ${cred.provider_name}`)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Scraping jobs created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
