
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";
import { Canvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

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

async function convertPdfToImage(pdfData: ArrayBuffer): Promise<string> {
  try {
    console.log('Loading PDF data...');
    const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
    console.log('PDF loaded successfully');

    const page = await pdf.getPage(1); // Get first page
    const viewport = page.getViewport({ scale: 2.0 }); // Increase scale for better quality

    // Create canvas with the right dimensions
    const canvas = new Canvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Prepare canvas for PDF rendering
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    console.log('Rendering PDF page to canvas...');
    await page.render(renderContext).promise;
    console.log('PDF rendered to canvas');

    // Convert canvas to PNG
    const pngData = canvas.toBuffer('image/png');
    console.log('Canvas converted to PNG');

    // Convert to base64
    return `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(pngData)))}`;
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    throw new Error('Failed to convert PDF to image: ' + error.message);
  }
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

    // Process based on file type
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let imageBase64: string;

    if (fileExtension === 'pdf') {
      console.log('Converting PDF to image...');
      const pdfArrayBuffer = await fileData.arrayBuffer();
      imageBase64 = await convertPdfToImage(pdfArrayBuffer);
      console.log('PDF converted to image successfully');
    } else {
      // Handle image files directly
      const mimeType = fileExtension === 'png' ? 'image/png' :
                      fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
                      'application/octet-stream';

      if (!['image/png', 'image/jpeg'].includes(mimeType)) {
        throw new Error('Unsupported file type. Please upload a PNG, JPEG, or PDF file.');
      }

      imageBase64 = `data:${mimeType};base64,${await toBase64(fileData)}`;
    }

    console.log('Calling OpenAI API...');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key not found');

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

    let extractedData;
    try {
      const data = JSON.parse(responseText);
      const content = data.choices?.[0]?.message?.content?.trim();
      console.log('Content before cleaning:', content);
      
      const cleanedContent = cleanJsonString(content);
      console.log('Content after cleaning:', cleanedContent);
      
      extractedData = JSON.parse(cleanedContent);
      console.log('Successfully parsed data:', extractedData);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse extracted data');
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
