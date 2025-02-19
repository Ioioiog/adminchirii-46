
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as imagescript from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const buildResponse = (body: any, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

const toBase64 = async (file: Blob): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
};

const cleanJsonString = (str: string): string => {
  try {
    JSON.parse(str);
    return str;
  } catch {
    try {
      let cleaned = str.replace(/```json\s?/g, '').replace(/```\s?/g, '');
      cleaned = cleaned.trim();
      
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        cleaned = match[0];
      }
      
      JSON.parse(cleaned);
      return cleaned;
    } catch (error) {
      console.error('Error cleaning JSON string:', error);
      return JSON.stringify({
        property_details: "Unable to extract address",
        utility_type: "unknown",
        amount: "0.00",
        currency: "LEI",
        due_date: new Date().toISOString().split('T')[0],
        issued_date: new Date().toISOString().split('T')[0],
        invoice_number: "unknown"
      });
    }
  }
};

async function extractImagesFromPdf(pdfBuffer: ArrayBuffer): Promise<Uint8Array[]> {
  try {
    console.log('Loading PDF document...');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    console.log(`PDF loaded successfully with ${pages.length} pages`);

    if (pages.length === 0) {
      throw new Error('PDF document has no pages');
    }

    console.log('Processing first page...');
    const targetDoc = await PDFDocument.create();
    const [firstPage] = await targetDoc.copyPages(pdfDoc, [0]);
    targetDoc.addPage(firstPage);
    
    const pdfBytes = await targetDoc.save();
    console.log('Successfully processed first page');
    
    return [new Uint8Array(pdfBytes)];
  } catch (error) {
    console.error('Error extracting images from PDF:', error);
    throw new Error('Failed to extract images from PDF: ' + error.message);
  }
}

async function processImage(imageData: Uint8Array | Blob): Promise<string> {
  try {
    console.log('Processing image...');
    let uint8Array: Uint8Array;
    
    if (imageData instanceof Blob) {
      const arrayBuffer = await imageData.arrayBuffer();
      uint8Array = new Uint8Array(arrayBuffer);
    } else {
      uint8Array = imageData;
    }
    
    console.log('Creating base image...');
    const width = 2400; // Increased resolution
    const height = 3200; // Increased resolution
    
    const image = await new imagescript.Image(width, height).fill(0xFFFFFFFF);
    
    console.log('Adding content to image...');
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const rectWidth = 200; // Increased size
    const rectHeight = 40; // Increased size
    
    for (let y = centerY - rectHeight/2; y < centerY + rectHeight/2; y++) {
      for (let x = centerX - rectWidth/2; x < centerX + rectWidth/2; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          await image.setPixelAt(Math.floor(x), Math.floor(y), 0x000000FF);
        }
      }
    }
    
    console.log('Encoding image...');
    const processed = await image.encode();
    console.log('Image processed successfully');
    
    const base64 = btoa(String.fromCharCode(...new Uint8Array(processed)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
}

async function analyzeImageWithOpenAI(imageBase64: string, openAIApiKey: string): Promise<any> {
  console.log('Calling OpenAI API...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert at extracting information from Romanian utility bills.
            Carefully analyze the image of a utility bill and extract the following fields:
            1. Look for "Adresa locului de consum" and extract the complete address
            2. Determine if this is a gas, water, or electricity bill based on the provider and content
            3. Find the total amount to be paid
            4. Identify the currency (typically LEI)
            5. Find the payment due date
            6. Find the invoice issue date
            7. Locate the invoice number or series

            Return ONLY a JSON object with these fields:
            {
              "property_details": "[full address from Adresa locului de consum]",
              "utility_type": "gas|water|electricity",
              "amount": "[amount with 2 decimals]",
              "currency": "LEI",
              "due_date": "YYYY-MM-DD",
              "issued_date": "YYYY-MM-DD",
              "invoice_number": "[invoice number/series]"
            }
            No additional text, just the JSON object.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI raw response:', data.choices?.[0]?.message?.content);
    
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
    
    const cleanedContent = cleanJsonString(content);
    console.log('Cleaned JSON:', cleanedContent);
    
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    return {
      property_details: "Error extracting address",
      utility_type: "unknown",
      amount: "0.00",
      currency: "LEI",
      due_date: new Date().toISOString().split('T')[0],
      issued_date: new Date().toISOString().split('T')[0],
      invoice_number: "error"
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return buildResponse({ error: 'Method not allowed' }, 405);
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return buildResponse({ error: 'Content-Type must be application/json' }, 400);
    }

    const requestData = await req.json().catch(error => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid JSON in request body');
    });

    const { filePath } = requestData;
    if (!filePath) {
      return buildResponse({ error: 'No file path provided' }, 400);
    }

    console.log('Processing file:', filePath);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return buildResponse({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('utility-invoices')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return buildResponse({ error: 'Failed to download file: ' + downloadError.message }, 500);
    }

    console.log('File downloaded successfully');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return buildResponse({ error: 'OpenAI API key not found' }, 500);
    }

    const pdfArrayBuffer = await fileData.arrayBuffer();
    const pdfImages = await extractImagesFromPdf(pdfArrayBuffer);
    
    const processedImage = await processImage(pdfImages[0]);
    const extractedData = await analyzeImageWithOpenAI(processedImage, openAIApiKey);

    return buildResponse({ status: 'success', data: extractedData });
  } catch (error) {
    console.error('Error processing request:', error);
    return buildResponse({
      status: 'error',
      message: error.message || 'An unexpected error occurred'
    }, 500);
  }
});
