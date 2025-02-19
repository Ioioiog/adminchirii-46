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
  let cleaned = str.replace(/```json\s?/g, '').replace(/```\s?/g, '');
  cleaned = cleaned.trim();
  console.log('Cleaned JSON string:', cleaned);
  return cleaned;
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
    
    // For PDF data, we'll convert it to PNG using canvas
    if (uint8Array.length > 0 && uint8Array[0] === 37) { // Check if it's PDF data (starts with '%')
      console.log('Converting PDF page to image...');
      // Create a simple image representation of the data
      const canvas = new imagescript.Image(1200, 1600); // Increased size for better quality
      await canvas.encode();
      uint8Array = canvas.bitmap;
    }
    
    // Load the image using imagescript
    const image = await imagescript.decode(uint8Array);
    
    // Ensure the image is in a format OpenAI can process
    const maxDimension = 2048;
    if (image.width > maxDimension || image.height > maxDimension) {
      const scale = Math.min(maxDimension / image.width, maxDimension / image.height);
      image.resize(
        Math.round(image.width * scale),
        Math.round(image.height * scale)
      );
    }
    
    // Optimize image quality
    const processed = await image.encode();
    console.log('Image processed successfully');
    
    return `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(processed)))}`;
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
            content: `Extract structured information from Romanian utility bills, with a focus on the "Adresa locului de consum" field.
            Return ONLY a valid JSON object with these exact fields, no markdown formatting:
            {
              "property_details": "Full address as found on the bill",
              "utility_type": "gas, water, electricity",
              "amount": "456.73",
              "currency": "LEI",
              "due_date": "YYYY-MM-DD",
              "issued_date": "YYYY-MM-DD",
              "invoice_number": "Invoice number"
            }
            Do not include any additional text, markdown formatting, or code block markers.`,
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const cleanedContent = cleanJsonString(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    throw error;
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

    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let extractedData;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return buildResponse({ error: 'OpenAI API key not found' }, 500);
    }

    if (fileExtension === 'pdf') {
      console.log('Processing PDF file...');
      const pdfArrayBuffer = await fileData.arrayBuffer();
      
      const pdfImages = await extractImagesFromPdf(pdfArrayBuffer);
      
      if (pdfImages.length === 0) {
        return buildResponse({
          error: 'No images found in PDF. Please upload a PDF that contains images of the utility bill.'
        }, 400);
      }
      
      let lastError = null;
      for (const pdfImage of pdfImages) {
        try {
          const processedImage = await processImage(pdfImage);
          extractedData = await analyzeImageWithOpenAI(processedImage, openAIApiKey);
          
          if (extractedData && extractedData.property_details) {
            break;
          }
        } catch (error) {
          console.log('Failed to process image, trying next one:', error);
          lastError = error;
          continue;
        }
      }
      
      if (!extractedData) {
        return buildResponse({
          error: lastError?.message || 'Could not extract valid data from any images in the PDF'
        }, 400);
      }
    } else {
      const mimeType = fileExtension === 'png' ? 'image/png' :
                      fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                      'application/octet-stream';

      if (!['image/png', 'image/jpeg'].includes(mimeType)) {
        return buildResponse({
          error: 'Unsupported file type. Please upload a PNG, JPEG, or PDF file.'
        }, 400);
      }

      const processedImage = await processImage(fileData);
      extractedData = await analyzeImageWithOpenAI(processedImage, openAIApiKey);
    }

    return buildResponse({ status: 'success', data: extractedData });

  } catch (error) {
    console.error('Error processing request:', error);
    return buildResponse({
      status: 'error',
      message: error.message || 'An unexpected error occurred'
    }, 500);
  }
});
