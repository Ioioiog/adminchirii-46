
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

const generateContractContent = (contract: any) => {
  const metadata = contract.metadata || {};
  const assets = metadata.assets || [];

  return `
    <!DOCTYPE html>
    <html>
      <head>
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
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          .signature-block {
            width: 45%;
          }
          .section {
            margin-bottom: 20px;
          }
          h1 { text-align: center; }
          h2 { margin-top: 30px; }
          img.signature {
            max-width: 200px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
        
        <div class="section">
          <p>Nr. ${metadata.contractNumber || '_____'}</p>
          <p>Data: ${metadata.contractDate || '_____'}</p>
        </div>

        <div class="section">
          <p><strong>Părțile,</strong></p>
          
          <p><strong>1. Proprietarul:</strong><br>
          ${metadata.ownerName || ''}, Nr. ordine Reg. com./an: ${metadata.ownerReg || ''}, 
          Cod fiscal (C.U.I.): ${metadata.ownerFiscal || ''}, cu sediul in ${metadata.ownerAddress || ''}, 
          cont bancar ${metadata.ownerBank || ''}, deschis la ${metadata.ownerBankName || ''}, 
          reprezentat: ${metadata.ownerRepresentative || ''}, e-mail: ${metadata.ownerEmail || ''}, 
          telefon: ${metadata.ownerPhone || ''} în calitate de Proprietar</p>

          <p><strong>2. Chiriașul:</strong><br>
          ${metadata.tenantName || ''}, Nr. ordine Reg. com./an: ${metadata.tenantReg || ''}, 
          Cod fiscal (C.U.I.): ${metadata.tenantFiscal || ''}, cu domiciliul în ${metadata.tenantAddress || ''}, 
          cont bancar ${metadata.tenantBank || ''}, deschis la ${metadata.tenantBankName || ''}, 
          reprezentat: ${metadata.tenantRepresentative || ''}, e-mail: ${metadata.tenantEmail || ''}, 
          telefon: ${metadata.tenantPhone || ''} în calitate de Chiriaș</p>
        </div>

        <div class="section">
          <h2>1. OBIECTUL CONTRACTULUI</h2>
          <p>1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${metadata.propertyAddress || ''}, 
          compus din ${metadata.roomCount || ''} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
          incepand cu data de ${metadata.startDate || ''} ca locuință pentru familia sa.</p>
        </div>

        <div class="section">
          <h2>2. PREȚUL CONTRACTULUI</h2>
          <p>2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de ${metadata.rentAmount || ''} EUR 
          ${metadata.vatIncluded === "nu" ? "+ TVA" : "(TVA inclus)"}. Plata chiriei se realizează în ziua de ${metadata.paymentDay || ''} 
          a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului.
          Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.</p>
          
          <p>2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează 
          zilei de ${metadata.paymentDay || ''}.</p>
          
          <p>2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de ${metadata.lateFee || ''}% pentru fiecare 
          zi de întârziere.</p>
        </div>

        <div class="section">
          <h2>3. DURATA CONTRACTULUI</h2>
          <p>3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de ${metadata.contractDuration || ''} luni. 
          Părțile convin că perioada inițială minimă este de esența contractului.</p>
        </div>

        <div class="section">
          <h2>7. GARANȚIA</h2>
          <p>7.1. Chiriașul este de acord să ofere, cu titlu de garanție, suma de ${metadata.securityDeposit || ''} EUR.
          Această sumă de bani va fi utilizată de Proprietar doar în situația în care Chiriașul nu își îndeplinește 
          în mod corespunzător obligațiile asumate contractual.</p>
          
          <p>7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, 
          după expirarea unui termen de ${metadata.depositReturnPeriod || ''} care să permită Proprietarului să verifice acuratețea 
          consumurilor declarate.</p>
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
            <p><strong>PROPRIETAR,</strong></p>
            <p>Data: ${metadata.ownerSignatureDate || '_____'}</p>
            <p>Nume și semnătură:</p>
            <p>${metadata.ownerSignatureName || ''}</p>
            ${metadata.ownerSignatureImage ? 
              `<img class="signature" src="${metadata.ownerSignatureImage}" alt="Owner Signature" />` : ''}
          </div>
          
          <div class="signature-block">
            <p><strong>CHIRIAȘ,</strong></p>
            <p>Data: ${metadata.tenantSignatureDate || '_____'}</p>
            <p>Nume și semnătură:</p>
            <p>${metadata.tenantSignatureName || ''}</p>
            ${metadata.tenantSignatureImage ? 
              `<img class="signature" src="${metadata.tenantSignatureImage}" alt="Tenant Signature" />` : ''}
          </div>
        </div>
      </body>
    </html>
  `;
};

const generatePDF = async (contract: any) => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const htmlContent = generateContractContent(contract);
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
    
    if (!contractId || !recipientEmail) {
      throw new Error('Contract ID and recipient email are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Database configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch contract with all necessary data
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

    console.log('Contract data:', contract);
    
    // Generate PDF
    console.log('Generating PDF for contract:', contractId);
    const pdfBuffer = await generatePDF(contract);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Send email
    const emailContent = `
      <h1>Contract for ${contract.properties?.name || 'Property'}</h1>
      <p>Please find attached the rental contract document. You can also view and sign it online using the link below:</p>
      <p><a href="${Deno.env.get('PUBLIC_SITE_URL') || ''}/documents/contracts/${contract.id}">View Contract Online</a></p>
    `;

    const emailResponse = await resend.emails.send({
      from: 'Contract System <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `Rental Contract - ${contract.properties?.name || 'Property'}`,
      html: emailContent,
      attachments: [{
        filename: `rental-contract-${contract.metadata?.contractNumber || contractId}.pdf`,
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
