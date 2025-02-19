
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { decode } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { PDFDocument, rgb } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

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

// Convert PDF to PNG image
async function convertPDFToImage(pdfBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    console.log('Loading PDF document...');
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    if (pages.length === 0) {
      throw new Error('PDF document has no pages');
    }
    
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Create a new PDF with white background
    const newPdfDoc = await PDFDocument.create();
    const newPage = newPdfDoc.addPage([width, height]);
    
    // Fill with white background
    newPage.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });
    
    // Copy content from original page
    const [existingPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPage.drawPage(existingPage);
    
    // Convert to PNG format
    const pngBytes = await newPage.doc.saveAsBase64({ format: 'png' });
    const pngData = atob(pngBytes);
    
    // Convert base64 to Uint8Array
    const pngArray = new Uint8Array(pngData.length);
    for (let i = 0; i < pngData.length; i++) {
      pngArray[i] = pngData.charCodeAt(i);
    }
    
    console.log('PDF converted to PNG successfully');
    return pngArray;
  } catch (error) {
    console.error('Error converting PDF to image:', error);
    throw new Error('Failed to convert PDF to image: ' + error.message);
  }
}

// Processes an image and converts it to Base64
async function processImage(imageData: Uint8Array): Promise<string> {
  try {
    console.log('Processing image...');
    console.log('Image data length:', imageData.length);
    
    console.log('Attempting to decode image...');
    const image = await decode(imageData);
    console.log('Successfully decoded image');

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

// Calls OpenAI API for image analysis
async function analyzeImageWithOpenAI(imageBase64: string, openAIApiKey: string): Promise<any> {
  console.log('Calling OpenAI API...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: `Extract structured data from Romanian utility bills:
          - Full address from "Adresa locului de consum"
          - Utility type (gas, water, electricity)
          - Invoice amount
          - Currency (LEI)
          - Due date
          - Invoice date
          - Invoice number

          Return ONLY a JSON object with these fields.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content?.trim());
}

// Main API Handler
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { filePath } = await req.json();
    if (!filePath) return buildResponse({ error: "No file path provided" }, 400);

    console.log("Processing file:", filePath);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: fileData, error } = await supabase.storage.from("utility-invoices").download(filePath);

    if (error) throw new Error("Failed to download file: " + error.message);

    const pdfArrayBuffer = await fileData.arrayBuffer();
    
    // Convert PDF to PNG image first
    const pngImage = await convertPDFToImage(pdfArrayBuffer);
    console.log('PDF converted to PNG, size:', pngImage.length);
    
    // Process the PNG image
    const processedImage = await processImage(pngImage);
    const extractedData = await analyzeImageWithOpenAI(processedImage, Deno.env.get("OPENAI_API_KEY")!);

    return buildResponse({ status: "success", data: extractedData });

  } catch (error) {
    console.error("Error:", error);
    return buildResponse({ status: "error", message: error.message }, 500);
  }
});
