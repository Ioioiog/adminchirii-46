
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('No file path provided');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('utility-invoices')
      .download(filePath);

    if (downloadError) {
      throw downloadError;
    }

    // Convert the file to base64
    const base64Image = await fileData.arrayBuffer().then(buffer => 
      btoa(String.fromCharCode(...new Uint8Array(buffer)))
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Call OpenAI API for analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a utility bill analyzer. Extract the following information from utility bills:
            1. Look specifically for "Adresa locului de consum:" and extract that complete address
            2. If not found, extract the delivery/service address
            3. The utility type (gas, electricity, water, etc.)
            4. The total amount to be paid
            5. The currency
            6. The due date
            7. The issue date
            8. The invoice number or document number

            Format your response as a JSON object with these exact keys:
            {
              "property_details": "the complete address",
              "utility_type": "the type",
              "amount": numeric amount,
              "currency": "the currency code",
              "due_date": "YYYY-MM-DD",
              "issued_date": "YYYY-MM-DD",
              "invoice_number": "the number"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: 'Please analyze this utility bill and extract the required information. Make sure to find and extract the "Adresa locului de consum" field if present.'
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    let extractedData;
    try {
      const content = data.choices[0].message.content;
      extractedData = JSON.parse(content);
      console.log('Extracted data:', extractedData);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse extracted data from OpenAI response');
    }

    return new Response(
      JSON.stringify({ data: extractedData }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error processing utility bill:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
