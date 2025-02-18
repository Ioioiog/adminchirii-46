
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfPath, jobId } = await req.json();

    console.log('Processing PDF:', pdfPath);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download PDF from storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('utility-pdfs')
      .download(pdfPath);

    if (downloadError) {
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert PDF to base64
    const pdfBase64 = await pdfData.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(pdfBase64)));

    // Process with OpenAI's Vision model
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting information from utility bills. Extract the following information in JSON format: amount, due_date, utility_type (Electricity/Water/Gas/Internet/Other), billing_period, and any additional fees."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract the billing information from this utility bill PDF."
              },
              {
                type: "image",
                image_url: {
                  url: `data:application/pdf;base64,${base64String}`
                }
              }
            ]
          }
        ]
      })
    });

    const aiResult = await response.json();
    console.log('AI Processing Result:', aiResult);

    // Parse the AI response
    const extractedData = JSON.parse(aiResult.choices[0].message.content);

    // Update the processing job with results
    const { error: updateError } = await supabase
      .from('pdf_processing_jobs')
      .update({
        status: 'completed',
        result: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to update processing job: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing PDF:', error);

    // Update job with error if we have a jobId
    if (error.jobId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('pdf_processing_jobs')
        .update({
          status: 'error',
          error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', error.jobId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
