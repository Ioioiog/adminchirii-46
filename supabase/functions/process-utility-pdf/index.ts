
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let reqBody;
  try {
    reqBody = await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { pdfPath, jobId } = reqBody;
  if (!pdfPath || !jobId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: pdfPath or jobId' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Starting PDF processing for:', pdfPath);

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
    console.log('PDF converted to base64');

    // Process with OpenAI's Vision model
    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: "You are an expert at extracting information from utility bills. Return ONLY a JSON object with these fields: amount (number), due_date (YYYY-MM-DD), utility_type (one of: Electricity/Water/Gas/Internet/Other)."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the billing information from this utility bill and return it as JSON."
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

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiResult = await openAIResponse.json();
    console.log('OpenAI API response received');

    if (!aiResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }

    // Parse the AI response
    const extractedData = JSON.parse(aiResult.choices[0].message.content);
    console.log('Extracted data:', extractedData);

    // Validate extracted data
    if (!extractedData.amount || !extractedData.due_date || !extractedData.utility_type) {
      throw new Error('Missing required fields in extracted data');
    }

    // Update job status
    await supabase
      .from('pdf_processing_jobs')
      .update({
        status: 'completed',
        result: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-utility-pdf function:', error);

    // Update job status with error
    await supabase
      .from('pdf_processing_jobs')
      .update({
        status: 'error',
        error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
