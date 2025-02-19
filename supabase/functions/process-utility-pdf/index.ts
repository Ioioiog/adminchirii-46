
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    
    if (!filePath) {
      console.log('No file path provided');
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

    console.log('File downloaded successfully, converting to base64...');
    
    // Convert file to base64 using the helper function
    const base64Image = await toBase64(fileData);
    
    console.log('Image converted to base64, calling OpenAI...');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Determine MIME type based on file extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' : 
                    fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' : 
                    'application/octet-stream';

    console.log('Using MIME type:', mimeType);

    // Call OpenAI API for analysis with improved prompt
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
            content: `Extract information from Romanian utility bills. Pay special attention to the "Adresa locului de consum" field, which appears in various formats:
            1. Look for text that follows "Adresa locului de consum:" or similar variants
            2. Look for address patterns that include apartment numbers (ap., apartament)
            3. Look for addresses with building numbers (bl., bloc)
            
            Return a JSON object with these keys:
            - property_details: the full text found under "Adresa locului de consum" or the main service address
            - utility_type: type of utility (gas, water, electricity)
            - amount: numerical value
            - currency: RON, LEI, etc.
            - due_date: payment due date (YYYY-MM-DD)
            - issued_date: bill issue date (YYYY-MM-DD)
            - invoice_number: invoice or bill number
            
            Focus on capturing the complete address including apartment numbers and building details.`
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

    if (!response.ok) {
      console.error('OpenAI API error:', responseText);
      throw new Error(`OpenAI API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Parsed OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let extractedData;
    try {
      const content = data.choices[0].message.content.trim();
      console.log('Raw content:', content);
      extractedData = JSON.parse(content);
      console.log('Parsed data:', extractedData);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse extracted data');
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
