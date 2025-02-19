
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

    console.log('Processing file:', filePath);

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
      console.error('Download error:', downloadError);
      throw downloadError;
    }

    // Convert ArrayBuffer to Base64 in chunks to prevent stack overflow
    const chunks: Uint8Array[] = [];
    const chunkSize = 1024 * 512; // 512KB chunks
    const array = new Uint8Array(await fileData.arrayBuffer());
    
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    const base64Image = btoa(
      chunks.reduce((acc, chunk) => acc + String.fromCharCode(...chunk), '')
    );

    console.log('Image converted to base64');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    console.log('Calling OpenAI API...');

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
            content: `Extract the following information from utility bills, paying special attention to the 'Adresa locului de consum' field which contains the service address:

1. The complete service address from 'Adresa locului de consum' field
2. Utility type (gas, electricity, water)
3. Total amount to be paid
4. Currency
5. Due date
6. Issue date
7. Invoice/document number

Return only a JSON object with these exact keys, no other text:
{
  "property_details": "complete service address",
  "utility_type": "type",
  "amount": number,
  "currency": "code",
  "due_date": "YYYY-MM-DD",
  "issued_date": "YYYY-MM-DD",
  "invoice_number": "number"
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
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let extractedData;
    try {
      const content = data.choices[0].message.content;
      console.log('Raw content:', content);
      extractedData = JSON.parse(content.trim());
      console.log('Successfully extracted and validated data:', extractedData);
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
    console.error('Error in process-utility-pdf function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
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
