import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    console.error('OpenAI API key is not set');
    return new Response(
      JSON.stringify({ error: 'OpenAI API key is not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const contentType = req.headers.get("content-type");
    if (!contentType) {
      throw new Error("Content-Type header is missing");
    }

    if (contentType !== "application/json") {
      throw new Error("Invalid content type. Expected application/json");
    }

    const { filePath, jobId } = await req.json();

    if (!filePath || !jobId) {
      throw new Error('Missing required parameters: filePath or jobId');
    }

    console.log('Starting file processing for:', filePath);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('utility-pdfs')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received from storage');
    }

    const fileType = fileData.type;
    if (!fileType.startsWith('image/')) {
      throw new Error(`Invalid file type: ${fileType}. Only image files are supported.`);
    }

    console.log('Processing file of type:', fileType);

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    const base64String = btoa(
      Array.from(bytes)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
    console.log('File converted to base64');

    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting information from Romanian utility bills, especially ENGIE bills. 
            Extract exactly these fields:
            - amount (number, look for "TOTAL DE PLATA CU T.V.A" or similar)
            - due_date (YYYY-MM-DD, look for "DATA SCADENTA")
            - issued_date (YYYY-MM-DD, look for "Data facturii")
            - invoice_number (string, look for "Seria ENG")
            - utility_type (one of: Electricity/Water/Gas/Internet/Other)
            - property_id (string, look for "Cod client" or contract number)
            - currency (RON for Romanian bills)
            
            Format your response as a valid JSON object containing only these fields, nothing else.
            Example: {"amount": 218.57, "due_date": "2024-12-16", "issued_date": "2024-11-15", "invoice_number": "ENG nr.70800259921", "utility_type": "Gas", "property_id": "191194059264", "currency": "RON"}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the information from this ENGIE Romania utility bill. Pay special attention to the amount (TOTAL DE PLATA CU T.V.A), due date (DATA SCADENTA), invoice number (Seria ENG), and client code (Cod client). The currency should be RON for Romanian bills."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${fileType};base64,${base64String}`
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const responseText = await openAIResponse.text();
    console.log('OpenAI raw response:', responseText);

    let aiResult;
    try {
      aiResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response JSON:', parseError);
      throw new Error(`Invalid JSON response from OpenAI: ${responseText}`);
    }

    if (!aiResult.choices?.[0]?.message?.content) {
      console.error('Invalid AI response structure:', aiResult);
      throw new Error('Invalid response format from OpenAI API');
    }

    let extractedData;
    try {
      const content = aiResult.choices[0].message.content.trim();
      console.log('Raw content:', content);
      
      let jsonContent = content;
      if (content.includes('```')) {
        const match = content.match(/```(?:json)?\s*(\{.*?\})\s*```/s);
        if (match) {
          jsonContent = match[1];
        }
      }
      
      console.log('Cleaned JSON content:', jsonContent);
      extractedData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Error parsing content as JSON:', parseError);
      throw new Error(`Failed to parse content as JSON: ${aiResult.choices[0].message.content}`);
    }

    // Additional validation specific for Romanian bills
    if (!extractedData.currency) {
      console.log('Romanian bill detected, setting currency to RON');
      extractedData.currency = 'RON';
    }

    if (!extractedData.utility_type) {
      console.log('ENGIE bill detected, setting utility type to Gas');
      extractedData.utility_type = 'Gas';
    }

    // Validate amount format for Romanian bills (should be in RON)
    if (typeof extractedData.amount !== 'number') {
      extractedData.amount = parseFloat(extractedData.amount.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (isNaN(extractedData.amount)) {
        throw new Error('Invalid amount value');
      }
    }

    // Format dates for Romanian date format (DD.MM.YYYY to YYYY-MM-DD)
    if (extractedData.due_date && extractedData.due_date.includes('.')) {
      const [day, month, year] = extractedData.due_date.split('.');
      extractedData.due_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (extractedData.issued_date && extractedData.issued_date.includes('.')) {
      const [day, month, year] = extractedData.issued_date.split('.');
      extractedData.issued_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    console.log('Successfully extracted and validated data:', extractedData);

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
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-utility-pdf function:', error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('pdf_processing_jobs')
          .update({
            status: 'error',
            error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }
    } catch (updateError) {
      console.error('Error updating job error status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
