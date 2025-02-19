
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toBase64 = async (file: Blob): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    if (!filePath) throw new Error('No file path provided');

    console.log('Processing file:', filePath);

    // Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download File
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('utility-invoices')
      .download(filePath);

    if (downloadError) throw new Error('Error downloading file: ' + downloadError.message);

    console.log('File downloaded successfully');

    // Convert to Base64
    const base64Image = await toBase64(fileData);

    // OpenAI API Key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key not found');

    // Determine MIME Type
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' :
                     fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                     'application/octet-stream';

    console.log('Using MIME type:', mimeType);

    // OpenAI Request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using the correct model name as per guidelines
        messages: [
          {
            role: 'system',
            content: `Extract structured information from Romanian utility bills, with a focus on the "Adresa locului de consum" field.

            - Look for text near "Adresa locului de consum:"
            - Extract the **entire address**, including:
              - **Street name** (e.g., "Soseaua FABRICA DE GLUCOZA")
              - **Building number** (e.g., "Nr. 6-8 Bl. B1.7")
              - **Apartment details** (e.g., "SCA Et. 10 Ap. 60")
              - **City and Postal Code** (e.g., "BUCURESTI 020332")

            **Output Format (JSON):**
            {
              "property_details": "Full address as found on the bill",
              "utility_type": "gas, water, electricity",
              "amount": "456.73",
              "currency": "LEI",
              "due_date": "YYYY-MM-DD",
              "issued_date": "YYYY-MM-DD",
              "invoice_number": "Invoice number"
            }

            Ensure the response is valid JSON with no additional text.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    const responseText = await response.text();
    console.log('OpenAI raw response:', responseText);

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${responseText}`);

    let extractedData;
    try {
      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content?.trim();
      extractedData = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse extracted data');
    }

    return new Response(
      JSON.stringify({ status: 'success', data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
