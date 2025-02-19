
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as imagescript from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { Document } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const pdfDoc = await Document.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    console.log(`PDF loaded successfully with ${pages.length} pages`);

    const images: Uint8Array[] = [];
    for (const [index, page] of pages.entries()) {
      console.log(`Processing page ${index + 1}...`);
      const { width, height } = page.getSize();
      
      // Extract images from the page
      const pageImages = await page.getImages();
      if (pageImages.length > 0) {
        for (const image of pageImages) {
          const imageBytes = await pdfDoc.getImage(image);
          if (imageBytes) {
            images.push(imageBytes);
          }
        }
      }
    }

    return images;
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

  const responseText = await response.text();
  console.log('OpenAI raw response:', responseText);

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status} - ${responseText}`);

  const data = JSON.parse(responseText);
  const content = data.choices?.[0]?.message?.content?.trim();
  const cleanedContent = cleanJsonString(content);
  return JSON.parse(cleanedContent);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    if (!filePath) throw new Error('No file path provided');

    console.log('Processing file:', filePath);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('utility-invoices')
      .download(filePath);

    if (downloadError) throw new Error('Error downloading file: ' + downloadError.message);

    console.log('File downloaded successfully');

    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let extractedData;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key not found');

    if (fileExtension === 'pdf') {
      console.log('Processing PDF file...');
      const pdfArrayBuffer = await fileData.arrayBuffer();
      
      // Extract images from PDF
      const pdfImages = await extractImagesFromPdf(pdfArrayBuffer);
      
      if (pdfImages.length === 0) {
        throw new Error('No images found in PDF. Please upload a PDF that contains images of the utility bill.');
      }
      
      // Process each image until we get valid data
      for (const pdfImage of pdfImages) {
        try {
          const processedImage = await processImage(pdfImage);
          extractedData = await analyzeImageWithOpenAI(processedImage, openAIApiKey);
          
          // If we successfully extract data, break the loop
          if (extractedData && extractedData.property_details) {
            break;
          }
        } catch (error) {
          console.log('Failed to process image, trying next one:', error);
          continue;
        }
      }
      
      if (!extractedData) {
        throw new Error('Could not extract valid data from any images in the PDF');
      }
    } else {
      // Handle image files
      const mimeType = fileExtension === 'png' ? 'image/png' :
                      fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                      'application/octet-stream';

      if (!['image/png', 'image/jpeg'].includes(mimeType)) {
        throw new Error('Unsupported file type. Please upload a PNG, JPEG, or PDF file.');
      }

      const processedImage = await processImage(fileData);
      extractedData = await analyzeImageWithOpenAI(processedImage, openAIApiKey);
    }

    return new Response(
      JSON.stringify({ status: 'success', data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
