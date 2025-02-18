
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

    console.log('Getting signed URL for file:', filePath);
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('utility-invoices')
      .createSignedUrl(filePath, 60); // URL valid for 60 seconds

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Error getting signed URL:', signedUrlError);
      throw new Error('Failed to get signed URL for file');
    }

    console.log('Calling OpenAI API with signed image URL');
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
            content: `You are a utility bill OCR assistant. Extract these fields from the utility bill image:
              - Invoice number (string)
              - Issue date (YYYY-MM-DD)
              - Due date (YYYY-MM-DD)
              - Amount (number)
              - Utility type (one of: "electricity", "water", "gas", "internet", "other")
              - Currency (3-letter code, e.g. "RON", "USD", "EUR")
              
              Return a JSON object with ONLY these fields, using exactly these field names. Example:
              {
                "invoice_number": "INV-123",
                "issue_date": "2024-02-18",
                "due_date": "2024-03-18",
                "amount": 150.50,
                "utility_type": "electricity",
                "currency": "RON"
              }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the required information from this utility bill.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: signedUrlData.signedUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('Raw OpenAI response:', JSON.stringify(openAIData, null, 2));

    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', openAIData);
      throw new Error('OpenAI response missing required content');
    }

    const rawContent = openAIData.choices[0].message.content.trim();
    console.log('Attempting to parse content:', rawContent);

    let extractedData;
    try {
      extractedData = JSON.parse(rawContent);
      
      // Validate required fields
      const requiredFields = ['invoice_number', 'issue_date', 'due_date', 'amount', 'utility_type', 'currency'];
      const missingFields = requiredFields.filter(field => !(field in extractedData));
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate field types
      if (typeof extractedData.amount !== 'number') {
        console.error('Invalid amount type:', typeof extractedData.amount);
        throw new Error('Amount must be a number');
      }

      const validUtilityTypes = ['electricity', 'water', 'gas', 'internet', 'other'];
      if (!validUtilityTypes.includes(extractedData.utility_type)) {
        console.error('Invalid utility type:', extractedData.utility_type);
        throw new Error(`Utility type must be one of: ${validUtilityTypes.join(', ')}`);
      }

      // Validate date formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(extractedData.issue_date) || !dateRegex.test(extractedData.due_date)) {
        console.error('Invalid date format:', { issue_date: extractedData.issue_date, due_date: extractedData.due_date });
        throw new Error('Dates must be in YYYY-MM-DD format');
      }

    } catch (error) {
      console.error('Error parsing or validating OpenAI response:', error);
      throw new Error(`Failed to parse OpenAI response: ${error.message}`);
    }

    console.log('Successfully extracted and validated data:', extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData
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
        success: false,
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
