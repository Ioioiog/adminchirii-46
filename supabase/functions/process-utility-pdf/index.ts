
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openAIKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseKey || !openAIKey) {
    return new Response(
      JSON.stringify({ error: 'Missing required environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Starting PDF processing for:', pdfPath);

    // Download PDF from storage
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('utility-pdfs')
      .download(pdfPath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    if (!pdfData) {
      throw new Error('No PDF data received from storage');
    }

    // Convert PDF to base64
    const pdfBase64 = await pdfData.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(pdfBase64)));
    console.log('PDF converted to base64, length:', base64String.length);

    // Process with OpenAI's Vision model
    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Extract only the following information from the utility bill and return it as a JSON object: amount (number), due_date (YYYY-MM-DD), utility_type (one of: Electricity/Water/Gas/Internet/Other). Return ONLY the JSON object, nothing else."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the billing information from this utility bill."
              },
              {
                type: "image",
                image_url: {
                  url: `data:application/pdf;base64,${base64String}`
                }
              }
            ]
          }
        ],
        temperature: 0,
      })
    });

    const responseText = await openAIResponse.text();
    console.log('OpenAI raw response:', responseText);

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${responseText}`);
    }

    const aiResult = JSON.parse(responseText);
    console.log('OpenAI parsed response:', aiResult);

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
    const { error: updateError } = await supabase
      .from('pdf_processing_jobs')
      .update({
        status: 'completed',
        result: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Error updating job status:', updateError);
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-utility-pdf function:', error);

    // Update job status with error
    try {
      const { error: updateError } = await supabase
        .from('pdf_processing_jobs')
        .update({
          status: 'error',
          error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) {
        console.error('Error updating job error status:', updateError);
      }
    } catch (updateError) {
      console.error('Error updating job status:', updateError);
    }

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
