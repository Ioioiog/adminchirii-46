
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
            content: `You are a specialized utility bill OCR assistant. Your task is to extract specific information from utility bills and format it exactly as requested. Return ONLY a JSON object with no additional text or formatting.

Look carefully through the entire image and find:

1. Property Details:
   - Look for service address, property location, or any building/apartment identifiers
   - Include full address if available

2. Utility Type:
   - Must be one of: ["Electricity", "Water", "Gas", "Internet", "Other"]
   - Look for company names (e.g., water company indicates water utility)
   - Look for service type descriptions

3. Amount and Currency:
   - Find the TOTAL amount due at the bottom or end of the bill
   - Look for labels like "Total Amount", "Total to Pay", "Amount Due", "Grand Total"
   - Ignore subtotals, previous balances, or individual line items
   - Make sure to get the final amount that includes all taxes and fees
   - Identify the currency (must be 3-letter code like RON, USD, EUR)
   - Extract just the numeric value for amount

4. Dates:
   - Due Date: When payment is required (format as YYYY-MM-DD)
   - Issued Date: When bill was issued (format as YYYY-MM-DD)
   - Convert any date format to YYYY-MM-DD

5. Invoice Number:
   - Look for: "Invoice #", "Bill Number", "Reference Number", etc.
   - Include full number with any prefix/suffix

Response format MUST be exactly:
{
  "property_details": "complete address or identifier",
  "utility_type": "one of the allowed types",
  "amount": number only (must be total amount),
  "currency": "3-letter code",
  "due_date": "YYYY-MM-DD",
  "issued_date": "YYYY-MM-DD",
  "invoice_number": "complete number"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract ALL the required fields from this utility bill image. For the amount, make sure to get the TOTAL amount due, not any subtotals or partial amounts.'
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
      const requiredFields = ['property_details', 'utility_type', 'amount', 'currency', 'due_date', 'issued_date', 'invoice_number'];
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

      extractedData.issued_date = validateDate(extractedData.issued_date, 'issued_date');
      extractedData.due_date = validateDate(extractedData.due_date, 'due_date');

      // Normalize currency
      extractedData.currency = extractedData.currency.toUpperCase();
      if (extractedData.currency.length !== 3) {
        throw new Error('Currency must be a 3-letter code');
      }

      // Ensure property_details is not empty
      if (!extractedData.property_details || extractedData.property_details.trim() === '') {
        throw new Error('Property details cannot be empty');
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
