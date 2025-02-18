
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

  const contentType = req.headers.get("content-type");
  if (!contentType) {
    return new Response(
      JSON.stringify({ error: "Content-Type header is missing" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  if (contentType !== "application/json") {
    return new Response(
      JSON.stringify({ error: "Invalid content type. Expected application/json" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const { filePath, jobId } = await req.json();

  if (!filePath || !jobId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters: filePath or jobId' }),
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
    console.log('Starting file processing for:', filePath);

    // Download file from storage
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

    // Check file type and validate
    const fileType = fileData.type;
    if (!fileType.startsWith('image/')) {
      throw new Error(`Invalid file type: ${fileType}. Only image files are supported.`);
    }

    console.log('Processing file of type:', fileType);

    // Convert file to base64 safely
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    const base64String = btoa(
      Array.from(bytes)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
    console.log('File converted to base64');

    // Process with OpenAI's Vision model
    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting information from utility bills. Extract exactly these fields: amount (number), due_date (YYYY-MM-DD), utility_type (one of: Electricity/Water/Gas/Internet/Other). Format your response as a valid JSON object containing only these fields, nothing else. For example: {\"amount\": 123.45, \"due_date\": \"2024-02-15\", \"utility_type\": \"Electricity\"}"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the amount, due date, and utility type from this utility bill image. Return ONLY a JSON object with amount, due_date, and utility_type fields."
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
        temperature: 0 // Set to 0 for more deterministic responses
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
      // Try to parse the content as JSON
      const content = aiResult.choices[0].message.content.trim();
      console.log('Raw content:', content);
      
      // Extract JSON from possible markdown code blocks
      let jsonContent = content;
      if (content.includes('```')) {
        // Extract content between code blocks
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

    // Validate the extracted data
    if (!extractedData.amount || !extractedData.due_date || !extractedData.utility_type) {
      console.error('Missing required fields in extracted data:', extractedData);
      throw new Error('Missing required fields in extracted data');
    }

    // Validate data types
    if (typeof extractedData.amount !== 'number') {
      extractedData.amount = parseFloat(extractedData.amount);
      if (isNaN(extractedData.amount)) {
        throw new Error('Invalid amount value');
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(extractedData.due_date)) {
      throw new Error('Invalid date format');
    }

    const validTypes = ['Electricity', 'Water', 'Gas', 'Internet', 'Other'];
    if (!validTypes.includes(extractedData.utility_type)) {
      throw new Error('Invalid utility type');
    }

    console.log('Successfully extracted and validated data:', extractedData);

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
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
