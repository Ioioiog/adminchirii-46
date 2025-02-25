
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";
import puppeteer from "npm:puppeteer@21.5.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendContractRequest {
  contractId: string;
  recipientEmail: string;
}

const generatePDF = async (contract: any) => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Construct the HTML content similar to ContractPrintPreview
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Contract ${contract.metadata?.contractNumber || ''}</title>
        <style>
          @media print {
            @page { 
              size: A4;
              margin: 20mm;
            }
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.5;
            }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-16 { margin-top: 4rem; }
            .p-8 { padding: 2rem; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-3xl { font-size: 1.875rem; }
            .text-xl { font-size: 1.25rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-8 { gap: 2rem; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 0.5rem; text-align: left; }
            .max-w-[200px] { max-width: 200px; }
            .list-disc { list-style-type: disc; padding-left: 2rem; }
          }
        </style>
      </head>
      <body>
        <div style="padding: 2rem">
          <h1 class="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
          <p class="mb-4">Nr. ${contract.metadata?.contractNumber || '_____'}</p>
          <p class="mb-8">Data: ${contract.metadata?.contractDate || '_____'}</p>

          <p class="mb-8">Părțile,</p>

          <div class="mb-8">
            ${contract.metadata?.ownerName}, Nr. ordine Reg. com./an: ${contract.metadata?.ownerReg}, 
            Cod fiscal (C.U.I.): ${contract.metadata?.ownerFiscal}, cu sediul in ${contract.metadata?.ownerAddress}, 
            cont bancar ${contract.metadata?.ownerBank}, deschis la ${contract.metadata?.ownerBankName},
            reprezentat: ${contract.metadata?.ownerRepresentative}, e-mail: ${contract.metadata?.ownerEmail}, 
            telefon: ${contract.metadata?.ownerPhone} în calitate de Proprietar,
          </div>

          <div class="mb-8">
            ${contract.metadata?.tenantName}, Nr. ordine Reg. com./an: ${contract.metadata?.tenantReg}, 
            Cod fiscal (C.U.I.): ${contract.metadata?.tenantFiscal}, cu domiciliul în ${contract.metadata?.tenantAddress}, 
            cont bancar ${contract.metadata?.tenantBank}, deschis la ${contract.metadata?.tenantBankName},
            reprezentat: ${contract.metadata?.tenantRepresentative}, e-mail: ${contract.metadata?.tenantEmail}, 
            telefon: ${contract.metadata?.tenantPhone} în calitate de Chiriaș,
          </div>

          <h2 class="text-xl font-bold mb-4">1. OBIECTUL CONTRACTULUI</h2>
          <p class="mb-8">
            1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${contract.metadata?.propertyAddress}, 
            compus din ${contract.metadata?.roomCount} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
            incepand cu data de ${contract.metadata?.startDate} ca locuință pentru familia sa.
          </p>

          <h2 class="text-xl font-bold mb-4">2. PREȚUL CONTRACTULUI</h2>
          <p class="mb-4">
            2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de ${contract.metadata?.rentAmount} EUR 
            ${contract.metadata?.vatIncluded === "nu" ? "+ TVA" : "(TVA inclus)"}. Plata chiriei se realizează în ziua de ${contract.metadata?.paymentDay} 
            a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului.
          </p>

          <!-- ... Add other contract sections ... -->

          <h2 class="text-xl font-bold mb-4">ANEXA 1 - LISTA BUNURI MOBILE/ELECTROCASNICE</h2>
          <table class="mb-8">
            <thead>
              <tr>
                <th>Denumire bun</th>
                <th>Valoare (lei)</th>
                <th>Stare</th>
              </tr>
            </thead>
            <tbody>
              ${(contract.metadata?.assets || []).map((asset: any) => `
                <tr>
                  <td>${asset.name}</td>
                  <td>${asset.value}</td>
                  <td>${asset.condition}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2 class="text-xl font-bold mb-4">ANEXA 2 - DETALII CONTORIZARE UTILITĂȚI</h2>
          <table class="mb-8">
            <thead>
              <tr>
                <th>Tip serviciu/utilitate</th>
                <th>Nivel contor la data încheierii contractului</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Apă rece</td>
                <td>${contract.metadata?.waterColdMeter}</td>
              </tr>
              <tr>
                <td>Apă caldă</td>
                <td>${contract.metadata?.waterHotMeter}</td>
              </tr>
              <tr>
                <td>Curent electric</td>
                <td>${contract.metadata?.electricityMeter}</td>
              </tr>
              <tr>
                <td>Gaze naturale</td>
                <td>${contract.metadata?.gasMeter}</td>
              </tr>
            </tbody>
          </table>

          <div class="grid grid-cols-2 gap-8 mt-16">
            <div>
              <p class="font-bold mb-2">PROPRIETAR,</p>
              <p>Data: ${contract.metadata?.ownerSignatureDate || '_____'}</p>
              <p>Nume și semnătură:</p>
              <p>${contract.metadata?.ownerSignatureName || '___________________________'}</p>
              ${contract.metadata?.ownerSignatureImage ? `
                <img src="${contract.metadata.ownerSignatureImage}" alt="Owner Signature" style="max-width: 200px; margin-top: 0.5rem;" />
              ` : ''}
            </div>
            <div>
              <p class="font-bold mb-2">CHIRIAȘ,</p>
              <p>Data: ${contract.metadata?.tenantSignatureDate || '_____'}</p>
              <p>Nume și semnătură:</p>
              <p>${contract.metadata?.tenantSignatureName || '___________________________'}</p>
              ${contract.metadata?.tenantSignatureImage ? `
                <img src="${contract.metadata.tenantSignatureImage}" alt="Tenant Signature" style="max-width: 200px; margin-top: 0.5rem;" />
              ` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const pdf = await page.pdf({ 
    format: 'A4',
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm',
    },
    printBackground: true
  });

  await browser.close();
  return pdf;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      throw new Error('Email service configuration is missing');
    }

    const resend = new Resend(resendApiKey);

    const { contractId, recipientEmail }: SendContractRequest = await req.json();
    console.log('Received request to send contract:', { contractId, recipientEmail });

    if (!contractId || !recipientEmail) {
      throw new Error('Contract ID and recipient email are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Database configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First fetch the contract with property details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        properties(name)
      `)
      .eq('id', contractId)
      .single();

    if (contractError) {
      console.error('Error fetching contract:', contractError);
      throw new Error('Failed to fetch contract details');
    }

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Generate PDF
    console.log('Generating PDF for contract:', contractId);
    const pdfBuffer = await generatePDF(contract);
    
    // Convert Buffer to Base64
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    console.log('Sending contract email to:', recipientEmail);
    
    // Prepare email content
    const emailContent = `
      <h1>Contract Details</h1>
      <p>Property: ${contract.properties.name}</p>
      <p>Status: ${contract.status}</p>
      <p>Please find the contract document attached to this email.</p>
      <p>You can also view and sign the contract by logging into your account:</p>
      <p><a href="${Deno.env.get('PUBLIC_SITE_URL') || ''}/documents/contracts/${contract.id}">View Contract Online</a></p>
    `;

    // Send email using Resend with PDF attachment
    const emailResponse = await resend.emails.send({
      from: 'Contract System <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `Contract for ${contract.properties.name}`,
      html: emailContent,
      attachments: [{
        filename: `contract-${contractId}.pdf`,
        content: pdfBase64,
      }],
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in send-contract function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );
  }
};

serve(handler);
