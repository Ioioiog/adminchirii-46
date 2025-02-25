import { serve } from "std/server";
import { createClient } from '@supabase/supabase-js';
import { Resend } from "npm:resend@2.0.0";
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface SendContractRequest {
  contractId: string;
  recipientEmail: string;
}

const generateContractContent = (contract: any) => {
  const metadata = contract.metadata || {};
  const assets = metadata.assets || [];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Contract ${metadata.contractNumber || ''}</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            line-height: 1.5;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          table { 
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .section {
            margin-bottom: 20px;
          }
          h1 { text-align: center; }
          h2 { margin-top: 30px; }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
          }
          .signature-block {
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .signature-img {
            max-width: 200px;
            height: auto;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
        
        <div class="section">
          <p><strong>Nr.</strong> ${metadata.contractNumber || '_____'}</p>
          <p><strong>Data:</strong> ${metadata.contractDate || '_____'}</p>
        </div>

        <div class="section">
          <h2>Părțile,</h2>
          
          <div class="section">
            <h3>1. Proprietarul:</h3>
            <p>${metadata.ownerName || ''}</p>
            <p>Nr. ordine Reg. com./an: ${metadata.ownerReg || ''}</p>
            <p>Cod fiscal (C.U.I.): ${metadata.ownerFiscal || ''}</p>
            <p>Cu sediul in: ${metadata.ownerAddress || ''}</p>
            <p>Cont bancar: ${metadata.ownerBank || ''}</p>
            <p>Deschis la: ${metadata.ownerBankName || ''}</p>
            <p>Reprezentat: ${metadata.ownerRepresentative || ''}</p>
            <p>Email: ${metadata.ownerEmail || ''}</p>
            <p>Telefon: ${metadata.ownerPhone || ''}</p>
            <p><strong>în calitate de Proprietar</strong></p>
          </div>

          <div class="section">
            <h3>2. Chiriașul:</h3>
            <p>${metadata.tenantName || ''}</p>
            <p>Nr. ordine Reg. com./an: ${metadata.tenantReg || ''}</p>
            <p>Cod fiscal (C.U.I.): ${metadata.tenantFiscal || ''}</p>
            <p>Cu domiciliul în: ${metadata.tenantAddress || ''}</p>
            <p>Cont bancar: ${metadata.tenantBank || ''}</p>
            <p>Deschis la: ${metadata.tenantBankName || ''}</p>
            <p>Reprezentat: ${metadata.tenantRepresentative || ''}</p>
            <p>Email: ${metadata.tenantEmail || ''}</p>
            <p>Telefon: ${metadata.tenantPhone || ''}</p>
            <p><strong>în calitate de Chiriaș</strong></p>
          </div>
        </div>

        <div class="section">
          <h2>1. OBIECTUL CONTRACTULUI</h2>
          <p>1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${metadata.propertyAddress || ''}, 
          compus din ${metadata.roomCount || ''} camere, cu destinația de locuință.</p>
          <p>1.2. Chiriașul va utiliza apartamentul incepand cu data de ${metadata.startDate || ''} ca locuință pentru familia sa.</p>
        </div>

        <div class="section">
          <h2>2. PREȚUL CONTRACTULUI</h2>
          <p>2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de ${metadata.rentAmount || ''} EUR 
          ${metadata.vatIncluded === "nu" ? "+ TVA" : "(TVA inclus)"}.</p>
          <p>2.2. Plata chiriei se realizează în ziua de ${metadata.paymentDay || ''} a fiecărei luni calendaristice pentru luna calendaristică următoare, 
          în contul bancar al Proprietarului. Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.</p>
          <p>2.3. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează.</p>
          <p>2.4. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de ${metadata.lateFee || ''}% pentru fiecare zi de întârziere.</p>
        </div>

        <div class="section">
          <h2>3. DURATA CONTRACTULUI</h2>
          <p>3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de ${metadata.contractDuration || ''} luni.</p>
          <p>3.2. Părțile convin că perioada inițială minimă este de esența contractului.</p>
          <p>3.3. La expirarea perioadei inițiale, operează tacita relocațiune, cu perioade succesive de câte ${metadata.renewalPeriod || '12'} luni.</p>
        </div>

        <div class="section">
          <h2>4. GARANȚIA</h2>
          <p>4.1. Chiriașul este de acord să ofere, cu titlu de garanție, suma de ${metadata.securityDeposit || ''} EUR.</p>
          <p>4.2. Această sumă de bani va fi utilizată de Proprietar doar în situația în care Chiriașul nu își îndeplinește 
          în mod corespunzător obligațiile asumate contractual.</p>
          <p>4.3. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, 
          după expirarea unui termen de ${metadata.depositReturnPeriod || ''} zile.</p>
        </div>

        <div class="section">
          <h2>ANEXA 1 - LISTA BUNURI MOBILE/ELECTROCASNICE</h2>
          <table>
            <thead>
              <tr>
                <th>Denumire bun</th>
                <th>Valoare (lei)</th>
                <th>Stare</th>
              </tr>
            </thead>
            <tbody>
              ${assets.map((asset: any) => `
                <tr>
                  <td>${asset.name || ''}</td>
                  <td>${asset.value || ''}</td>
                  <td>${asset.condition || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>ANEXA 2 - DETALII CONTORIZARE UTILITĂȚI</h2>
          <table>
            <thead>
              <tr>
                <th>Tip serviciu/utilitate</th>
                <th>Nivel contor la data încheierii contractului</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Apă rece</td>
                <td>${metadata.waterColdMeter || ''}</td>
              </tr>
              <tr>
                <td>Apă caldă</td>
                <td>${metadata.waterHotMeter || ''}</td>
              </tr>
              <tr>
                <td>Curent electric</td>
                <td>${metadata.electricityMeter || ''}</td>
              </tr>
              <tr>
                <td>Gaze naturale</td>
                <td>${metadata.gasMeter || ''}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="signatures">
          <div class="signature-block">
            <p><strong>PROPRIETAR</strong></p>
            <p>Data: ${metadata.ownerSignatureDate || '_____'}</p>
            <p>Nume și semnătură:</p>
            <p>${metadata.ownerSignatureName || ''}</p>
            ${metadata.ownerSignatureImage ? 
              `<img class="signature-img" src="${metadata.ownerSignatureImage}" alt="Owner Signature" />` : ''}
          </div>
          
          <div class="signature-block">
            <p><strong>CHIRIAȘ</strong></p>
            <p>Data: ${metadata.tenantSignatureDate || '_____'}</p>
            <p>Nume și semnătură:</p>
            <p>${metadata.tenantSignatureName || ''}</p>
            ${metadata.tenantSignatureImage ? 
              `<img class="signature-img" src="${metadata.tenantSignatureImage}" alt="Tenant Signature" />` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
};

const generatePDF = async (contract: any) => {
  try {
    console.log('Starting PDF generation...');
    
    const executablePath = await chromium.executablePath;
    
    if (!executablePath) {
      throw new Error('Chrome executable path not found');
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    console.log('Browser launched');
    const page = await browser.newPage();
    console.log('New page created');

    const content = generateContractContent(contract);
    await page.setContent(content, { waitUntil: 'networkidle0' });
    console.log('Content set to page');

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
    console.log('PDF generated');

    await browser.close();
    console.log('Browser closed');
    
    return pdf;
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Starting contract send process...');
    const { contractId, recipientEmail } = await req.json();
    
    if (!contractId || !recipientEmail) {
      throw new Error('Contract ID and recipient email are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Database configuration is missing');
    }

    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching contract data...');
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        properties(name)
      `)
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Error fetching contract:', contractError);
      throw new Error('Failed to fetch contract details');
    }

    console.log('Contract data fetched successfully:', {
      id: contract.id,
      propertyName: contract.properties?.name,
      hasMetadata: !!contract.metadata
    });

    // Generate PDF
    console.log('Starting PDF generation process...');
    const pdfBuffer = await generatePDF(contract);
    console.log('PDF generated successfully');

    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Send email
    console.log('Preparing to send email...');
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error('Email service configuration is missing');
    }

    const resend = new Resend(resendApiKey);
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://www.adminchirii.ro';
    
    console.log('Sending email...');
    const emailResponse = await resend.emails.send({
      from: 'Contract System <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `Contract de închiriere - ${contract.properties?.name || 'Proprietate'}`,
      html: `
        <h1>Contract pentru ${contract.properties?.name || 'Proprietate'}</h1>
        <p>Găsiți atașat documentul contractului de închiriere.</p>
        <p>Puteți vizualiza și semna contractul online accesând următorul link:</p>
        <p><a href="${siteUrl}/documents/contracts/${contract.id}">Vizualizare Contract Online</a></p>
      `,
      attachments: [{
        filename: `contract-${contract.metadata?.contractNumber || contractId}.pdf`,
        content: pdfBase64
      }]
    });

    console.log('Email sent successfully:', {
      emailId: emailResponse.id,
      recipient: recipientEmail
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error in send-contract function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
