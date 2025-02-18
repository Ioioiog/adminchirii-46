
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
            content: `You are a utility bill OCR assistant. Carefully analyze the utility bill image and extract:

1. Invoice/Bill Number: Look for numbers labeled as "Invoice No", "Bill Number", "Document Number", "Factura", "Nr.", etc.
Example formats: "INV-12345", "F-123456", "Bill#789"

2. Issue Date: Search for dates labeled as "Issue Date", "Bill Date", "Data facturii", "Date", etc.
Return the date in YYYY-MM-DD format.

IMPORTANT: 
- Be thorough in your search - check headers, footers, and corners
- If you find multiple dates, prefer the issue date over due date
- Look for standard invoice number patterns
- If you can't find a field with high confidence, return null
- Return ONLY a JSON object with these fields, nothing else:
{
  "invoice_number": string | null,
  "issued_date": "YYYY-MM-DD" | null
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this utility bill image and extract the invoice number and issue date.'
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
        temperature: 0.1 // Lower temperature for more focused extraction
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

      // Validate and normalize the date format if present
      if (extractedData.issued_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(extractedData.issued_date)) {
          console.log('Invalid date format, attempting to standardize:', extractedData.issued_date);
          // Try multiple date formats
          const possibleFormats = [
            'DD-MM-YYYY',
            'MM-DD-YYYY',
            'YYYY-MM-DD',
            'DD.MM.YYYY',
            'MM.DD.YYYY',
            'DD/MM/YYYY',
            'MM/DD/YYYY'
          ];
          
          let parsedDate = null;
          for (const format of possibleFormats) {
            const attemptedDate = new Date(extractedData.issued_date);
            if (!isNaN(attemptedDate.getTime())) {
              parsedDate = attemptedDate;
              break;
            }
          }
          
          if (parsedDate) {
            extractedData.issued_date = parsedDate.toISOString().split('T')[0];
            console.log('Successfully standardized date to:', extractedData.issued_date);
          } else {
            console.log('Could not parse date, setting to null');
            extractedData.issued_date = null;
          }
        }
      }

      // Validate invoice number
      if (extractedData.invoice_number) {
        extractedData.invoice_number = extractedData.invoice_number.trim();
        if (extractedData.invoice_number === '') {
          extractedData.invoice_number = null;
        }
      }

    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      console.error('Response content:', openAIData.choices[0].message.content);
      extractedData = {
        invoice_number: null,
        issued_date: null
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
