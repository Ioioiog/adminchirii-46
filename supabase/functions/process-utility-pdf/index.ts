
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
    const { filePath } = await req.json();
    console.log('Processing file:', filePath);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');

    // Get file URL instead of downloading
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('utility-invoices')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('Error getting public URL:', urlError);
      throw urlError;
    }

    console.log('Got public URL:', publicUrl);

    // Call OpenAI API with the public URL
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
            content: 'You are a utility bill OCR assistant. Extract the invoice number and issue date from the image. Return ONLY a JSON object with "invoice_number" and "issued_date" fields.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image_url: {
                  url: publicUrl
                }
              },
              'Extract the invoice number and issue date. Return ONLY a JSON object.'
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to process image with OpenAI');
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    let extractedData;
    try {
      // Parse the content as JSON
      extractedData = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      extractedData = {
        invoice_number: null,
        issued_date: null
      };
    }

    console.log('Extracted data:', extractedData);

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-utility-pdf:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
