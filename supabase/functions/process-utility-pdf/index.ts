
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, jobId } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('utility-invoices')
      .download(filePath);

    if (downloadError) throw downloadError;

    // Convert file to base64
    const bytes = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));

    // Call OpenAI API
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
            content: 'You are a utility bill OCR assistant. Extract the invoice number and issue date from the image.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              },
              'Please extract the invoice number and issue date from this utility bill. Return the result as JSON with "invoice_number" and "issued_date" fields. Format the date as YYYY-MM-DD.'
            ]
          }
        ]
      }),
    });

    const data = await response.json();
    let extractedData;
    
    try {
      extractedData = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      extractedData = {
        invoice_number: null,
        issued_date: null
      };
    }

    // Update the utility record with extracted data
    const { error: updateError } = await supabase
      .from('utilities')
      .update({
        invoice_number: extractedData.invoice_number,
        issued_date: extractedData.issued_date
      })
      .eq('id', jobId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing utility bill:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
