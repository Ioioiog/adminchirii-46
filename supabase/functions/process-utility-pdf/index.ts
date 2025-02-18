
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

const cleanJSONString = (str: string): string => {
  // Remove markdown code blocks
  str = str.replace(/```json\s*|\s*```/g, '');
  // Remove any leading/trailing whitespace
  str = str.trim();
  // Handle any potential line breaks within the JSON
  str = str.replace(/\n/g, '');
  return str;
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

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Getting signed URL for file:', filePath);
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('utility-invoices')
      .createSignedUrl(filePath, 300);

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
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a utility bill OCR assistant. Your response must be a single valid JSON object with no additional text or formatting. The JSON object must have these exact fields: invoice_number (string), issue_date (YYYY-MM-DD), due_date (YYYY-MM-DD), amount (number), utility_type (string, one of: electricity, water, gas, internet, other), currency (3-letter code). Example: {"invoice_number":"INV-123","issue_date":"2024-02-18","due_date":"2024-03-18","amount":150.50,"utility_type":"electricity","currency":"RON"}'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the required information from this utility bill as a JSON object.'
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
        max_tokens: 1000,
        temperature: 0
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

    const rawContent = openAIData.choices[0].message.content;
    console.log('Original content:', rawContent);

    const cleanedContent = cleanJSONString(rawContent);
    console.log('Cleaned content:', cleanedContent);

    let extractedData;
    try {
      extractedData = JSON.parse(cleanedContent);
      
      // Validate required fields
      const requiredFields = ['invoice_number', 'issue_date', 'due_date', 'amount', 'utility_type', 'currency'];
      const missingFields = requiredFields.filter(field => !(field in extractedData));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Convert amount to number if it's a string
      if (typeof extractedData.amount !== 'number') {
        const parsedAmount = parseFloat(extractedData.amount);
        if (isNaN(parsedAmount)) {
          throw new Error('Amount must be a valid number');
        }
        extractedData.amount = parsedAmount;
      }

      // Normalize utility type
      extractedData.utility_type = extractedData.utility_type.toLowerCase();
      const validUtilityTypes = ['electricity', 'water', 'gas', 'internet', 'other'];
      if (!validUtilityTypes.includes(extractedData.utility_type)) {
        throw new Error(`Invalid utility type. Must be one of: ${validUtilityTypes.join(', ')}`);
      }

      // Validate dates
      const validateDate = (dateStr: string, fieldName: string) => {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid ${fieldName} format. Must be YYYY-MM-DD`);
        }
        return date.toISOString().split('T')[0];
      };

      extractedData.issue_date = validateDate(extractedData.issue_date, 'issue_date');
      extractedData.due_date = validateDate(extractedData.due_date, 'due_date');

      // Normalize currency
      extractedData.currency = extractedData.currency.toUpperCase();
      if (extractedData.currency.length !== 3) {
        throw new Error('Currency must be a 3-letter code');
      }

    } catch (error) {
      console.error('Error parsing or validating data:', error);
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
