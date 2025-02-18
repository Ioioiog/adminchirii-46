
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

    console.log('Getting public URL for file:', filePath);
    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('utility-invoices')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('Error getting public URL:', urlError);
      throw urlError;
    }

    if (!publicUrl) {
      throw new Error('Failed to get public URL for file');
    }

    console.log('Got public URL:', publicUrl);

    console.log('Calling OpenAI API...');
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
            content: `You are a utility bill OCR assistant. Carefully analyze the utility bill image and extract the following information:

1. Invoice/Bill Number: Look for "Invoice No", "Bill Number", "Document Number", "Factura", "Nr.", etc.
Example formats: "INV-12345", "F-123456", "Bill#789"

2. Issue Date: Search for "Issue Date", "Bill Date", "Data facturii", "Date". Return in YYYY-MM-DD format.

3. Due Date: Look for "Due Date", "Payment Due", "Scadenta", etc. Return in YYYY-MM-DD format.

4. Amount: Find the total amount to be paid. Look for "Total", "Amount Due", "Total de plata", etc.
- Return only the numeric value without currency symbol
- If multiple amounts exist, return the final/total amount

5. Utility Type: Determine if this is for:
- Electricity (look for "Electric", "Power", "kWh", "Energie electrica")
- Water (look for "Water", "Apa", "m³")
- Gas (look for "Gas", "Gaz", "Natural Gas", "therm")
- Internet (look for "Internet", "Broadband", "Data")
Return ONLY one of: "Electricity", "Water", "Gas", "Internet", or "Other"

6. Currency: Identify the currency used (look for currency symbols or codes)
Return standard 3-letter code (e.g., "USD", "EUR", "RON", "GBP")

Return ONLY a JSON object with these fields:
{
  "invoice_number": string | null,
  "issued_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "amount": number | null,
  "utility_type": "Electricity" | "Water" | "Gas" | "Internet" | "Other",
  "currency": string | null
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all the required information from this utility bill.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: publicUrl
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
    console.log('Raw OpenAI API response:', JSON.stringify(openAIData, null, 2));

    if (!openAIData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let extractedData;
    try {
      console.log('Attempting to parse content:', openAIData.choices[0].message.content);
      extractedData = JSON.parse(openAIData.choices[0].message.content.trim());
      console.log('Successfully parsed extracted data:', extractedData);

      // Validate and normalize dates
      ['issued_date', 'due_date'].forEach(dateField => {
        if (extractedData[dateField]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(extractedData[dateField])) {
            console.log(`Invalid ${dateField} format, attempting to standardize:`, extractedData[dateField]);
            try {
              const parsedDate = new Date(extractedData[dateField]);
              if (!isNaN(parsedDate.getTime())) {
                extractedData[dateField] = parsedDate.toISOString().split('T')[0];
                console.log(`Successfully standardized ${dateField} to:`, extractedData[dateField]);
              } else {
                console.log(`Could not parse ${dateField}, setting to null`);
                extractedData[dateField] = null;
              }
            } catch (e) {
              console.log(`Error parsing ${dateField}, setting to null`);
              extractedData[dateField] = null;
            }
          }
        }
      });

      // Validate amount
      if (extractedData.amount) {
        if (typeof extractedData.amount === 'string') {
          extractedData.amount = parseFloat(extractedData.amount.replace(/[^\d.-]/g, ''));
        }
        if (isNaN(extractedData.amount)) {
          extractedData.amount = null;
        }
      }

      // Validate utility type
      const validTypes = ['Electricity', 'Water', 'Gas', 'Internet', 'Other'];
      if (!validTypes.includes(extractedData.utility_type)) {
        extractedData.utility_type = 'Other';
      }

      // Validate currency
      if (extractedData.currency) {
        extractedData.currency = extractedData.currency.trim().toUpperCase();
        if (extractedData.currency.length !== 3) {
          extractedData.currency = null;
        }
      }

    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      console.error('Response content:', openAIData.choices[0].message.content);
      extractedData = {
        invoice_number: null,
        issued_date: null,
        due_date: null,
        amount: null,
        utility_type: 'Other',
        currency: null
      };
    }

    return new Response(
      JSON.stringify({ 
        data: extractedData,
        success: true 
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
        error: error.message,
        details: error.stack,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
