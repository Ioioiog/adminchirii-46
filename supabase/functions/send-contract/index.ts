
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailRequest {
  recipientEmail: string;
  contractData: {
    contractNumber: string;
    tenantName: string;
    ownerName: string;
    propertyAddress: string;
    contractContent: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientEmail, contractData } = await req.json() as EmailRequest

    console.log('Received request to send contract to:', recipientEmail);
    console.log('Contract data:', JSON.stringify(contractData, null, 2));

    if (!recipientEmail || !contractData) {
      throw new Error('Missing required data');
    }

    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Contracts <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `Contract #${contractData.contractNumber} for Review`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Contract for Review</title>
          </head>
          <body>
            <h1>Contract for Review</h1>
            <p>Dear recipient,</p>
            <p>Please find below the contract for your review.</p>
            <p><strong>Contract Details:</strong></p>
            <ul>
              <li>Contract Number: ${contractData.contractNumber}</li>
              <li>Owner: ${contractData.ownerName}</li>
              <li>Tenant: ${contractData.tenantName}</li>
              <li>Property Address: ${contractData.propertyAddress}</li>
            </ul>
            <div style="margin-top: 20px; padding: 20px; border: 1px solid #ccc;">
              ${contractData.contractContent}
            </div>
            <p style="margin-top: 20px;">Best regards,<br/>Your Property Management Team</p>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in send-contract function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
