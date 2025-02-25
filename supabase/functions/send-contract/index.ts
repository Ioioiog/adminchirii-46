
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendContractRequest {
  contractId: string;
  recipientEmail: string;
}

const generatePDF = async (contract: any, landlord: any, tenant: any) => {
  const doc = new jsPDF();
  let yOffset = 20;
  const lineHeight = 10;

  // Title
  doc.setFontSize(20);
  doc.text('CONTRACT DE ÎNCHIRIERE A LOCUINȚEI', 105, yOffset, { align: 'center' });
  yOffset += lineHeight * 2;

  // Contract number and date
  doc.setFontSize(12);
  doc.text(`Nr. ${contract.metadata?.contractNumber || '_____'}`, 20, yOffset);
  yOffset += lineHeight;
  doc.text(`Data: ${contract.metadata?.contractDate || '_____'}`, 20, yOffset);
  yOffset += lineHeight * 2;

  // Parties section
  doc.text('Părțile,', 20, yOffset);
  yOffset += lineHeight * 2;

  // Owner details
  const ownerText = `${contract.metadata?.ownerName || ''}, Nr. ordine Reg. com./an: ${contract.metadata?.ownerReg || ''}, ` +
    `Cod fiscal (C.U.I.): ${contract.metadata?.ownerFiscal || ''}, cu sediul in ${contract.metadata?.ownerAddress || ''}, ` +
    `cont bancar ${contract.metadata?.ownerBank || ''}, deschis la ${contract.metadata?.ownerBankName || ''}, ` +
    `reprezentat: ${contract.metadata?.ownerRepresentative || ''}, e-mail: ${contract.metadata?.ownerEmail || ''}, ` +
    `telefon: ${contract.metadata?.ownerPhone || ''} în calitate de Proprietar,`;

  const splitOwner = doc.splitTextToSize(ownerText, 170);
  doc.text(splitOwner, 20, yOffset);
  yOffset += splitOwner.length * 7 + lineHeight;

  // Tenant details
  const tenantText = `${contract.metadata?.tenantName || ''}, Nr. ordine Reg. com./an: ${contract.metadata?.tenantReg || ''}, ` +
    `Cod fiscal (C.U.I.): ${contract.metadata?.tenantFiscal || ''}, cu domiciliul în ${contract.metadata?.tenantAddress || ''}, ` +
    `cont bancar ${contract.metadata?.tenantBank || ''}, deschis la ${contract.metadata?.tenantBankName || ''}, ` +
    `reprezentat: ${contract.metadata?.tenantRepresentative || ''}, e-mail: ${contract.metadata?.tenantEmail || ''}, ` +
    `telefon: ${contract.metadata?.tenantPhone || ''} în calitate de Chiriaș,`;

  const splitTenant = doc.splitTextToSize(tenantText, 170);
  doc.text(splitTenant, 20, yOffset);
  yOffset += splitTenant.length * 7 + lineHeight;

  // Property details
  doc.text('1. OBIECTUL CONTRACTULUI', 20, yOffset);
  yOffset += lineHeight;
  const propertyText = `1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${contract.metadata?.propertyAddress || ''}, ` +
    `compus din ${contract.metadata?.roomCount || ''} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul ` +
    `incepand cu data de ${contract.metadata?.startDate || ''} ca locuință pentru familia sa.`;
  const splitProperty = doc.splitTextToSize(propertyText, 170);
  doc.text(splitProperty, 20, yOffset);

  // Add more sections as needed...

  // Signatures
  yOffset = 250;
  doc.text('PROPRIETAR,', 40, yOffset);
  doc.text('CHIRIAȘ,', 130, yOffset);
  yOffset += lineHeight;
  
  if (contract.metadata?.ownerSignatureName) {
    doc.text(contract.metadata.ownerSignatureName, 40, yOffset);
  }
  if (contract.metadata?.tenantSignatureName) {
    doc.text(contract.metadata.tenantSignatureName, 130, yOffset);
  }

  return doc.output('arraybuffer');
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

    // Fetch landlord details separately
    const { data: landlord } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', contract.landlord_id)
      .single();

    // Fetch tenant details separately if tenant_id exists
    let tenant = null;
    if (contract.tenant_id) {
      const { data: tenantData } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', contract.tenant_id)
        .single();
      tenant = tenantData;
    }

    // Generate PDF
    console.log('Generating PDF for contract:', contractId);
    const pdfBuffer = await generatePDF(contract, landlord, tenant);
    
    // Convert ArrayBuffer to Base64
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    console.log('Sending contract email to:', recipientEmail);
    
    // Prepare email content
    const emailContent = `
      <h1>Contract Details</h1>
      <p>Property: ${contract.properties.name}</p>
      <p>Status: ${contract.status}</p>
      ${landlord ? `<p>Landlord: ${landlord.first_name} ${landlord.last_name}</p>` : ''}
      ${tenant ? `<p>Tenant: ${tenant.first_name} ${tenant.last_name}</p>` : ''}
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
