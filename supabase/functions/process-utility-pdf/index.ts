
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!req.body) {
      throw new Error('Request body is empty');
    }

    const { filePath } = await req.json();
    console.log('Starting to process file:', filePath);

    if (!filePath) {
      throw new Error('File path is required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Getting public URL for file:', filePath);
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('utility-invoices')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('Error getting public URL:', urlError);
      throw urlError;
    }

    if (!publicUrl) {
      throw new Error('Failed to get public URL for file');
    }

    console.log('Got public URL:', publicUrl);

    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a utility bill OCR assistant. Extract the invoice number and issue date from the image. Return ONLY a JSON object with "invoice_number" and "issued_date" fields.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the invoice number and issue date from this utility bill. Return ONLY a JSON object.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: publicUrl
                }
              }
            ]
          }
        ],
        max_tokens: 300
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI API response:', openAIData);

    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let extractedData;
    try {
      extractedData = JSON.parse(openAIData.choices[0].message.content);
      console.log('Successfully parsed extracted data:', extractedData);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      extractedData = {
        invoice_number: null,
        issued_date: null
      };
    }

    return new Response(
      JSON.stringify({ 
        data: extractedData,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in process-utility-pdf:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
