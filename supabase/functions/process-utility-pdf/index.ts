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

    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('utility-invoices')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw downloadError;
    }

    if (!fileData) {
      throw new Error('No file data received');
    }

    const fileBase64 = await fileData.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(fileBase64)));
    const mimeType = fileData.type;

    console.log('File downloaded and converted to base64');

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
            
            1. Invoice/Bill Number: Look for "Invoice No", "Bill Number", "Document Number", etc.
            2. Issue Date: Return in YYYY-MM-DD format.
            3. Due Date: Return in YYYY-MM-DD format.
            4. Amount: Extract the total amount due (numeric only).
            5. Utility Type: Return one of "Electricity", "Water", "Gas", "Internet", or "Other".
            6. Currency: Return as a standard 3-letter code (e.g., "USD", "EUR", "RON", "GBP").`
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
                  url: `data:${mimeType};base64,${base64String}`
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

      // Standardize date formats
      ['issued_date', 'due_date'].forEach(dateField => {
        if (extractedData[dateField]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(extractedData[dateField])) {
            extractedData[dateField] = new Date(extractedData[dateField]).toISOString().split('T')[0] || null;
          }
        }
      });

      // Convert amount to numeric
      if (extractedData.amount) {
        extractedData.amount = parseFloat(extractedData.amount.replace(/[^\d.-]/g, '')) || null;
      }

      // Validate utility type
      const validTypes = ['Electricity', 'Water', 'Gas', 'Internet', 'Other'];
      if (!validTypes.includes(extractedData.utility_type)) {
        extractedData.utility_type = 'Other';
      }

      // Standardize currency format
      if (extractedData.currency) {
        extractedData.currency = extractedData.currency.trim().toUpperCase();
        if (extractedData.currency.length !== 3) {
          extractedData.currency = null;
        }
      }

    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      extractedData = {
        invoice_number: null,
        issued_date: null,
        due_date: null,
        amount: null,
        utility_type: 'Other',
        currency: null
      };
    }

    console.log('Saving extracted data into Supabase...');
    const { data: insertData, error: insertError } = await supabase
      .from('utility_invoices')
      .insert([{
        file_path: filePath,
        invoice_number: extractedData.invoice_number,
        issued_date: extractedData.issued_date,
        due_date: extractedData.due_date,
        amount: extractedData.amount,
        utility_type: extractedData.utility_type,
        currency: extractedData.currency,
        created_at: new Date().toISOString()
      }])
      .select();

    if (insertError) {
      console.error('Error inserting data into Supabase:', insertError);
      throw new Error('Failed to save extracted data into database');
    }

    console.log('Data successfully saved into Supabase:', insertData);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        insert_id: insertData[0]?.id || null,
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
