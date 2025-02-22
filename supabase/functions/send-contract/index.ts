
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
    const { recipientEmail, contractData } = await req.json() as EmailRequest;

    console.log('Received email request:', { recipientEmail });
    console.log('Contract data:', contractData);

    if (!recipientEmail || !contractData) {
      throw new Error('Missing required data');
    }

    if (!Deno.env.get("RESEND_API_KEY")) {
      throw new Error("Missing RESEND_API_KEY environment variable");
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
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { margin-bottom: 30px; }
              .details { margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 5px; }
              .contract-content { margin-top: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
              .footer { margin-top: 30px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Contract for Review</h1>
                <p>Dear recipient,</p>
                <p>Please find below the contract for your review.</p>
              </div>

              <div class="details">
                <h2>Contract Details</h2>
                <ul>
                  <li><strong>Contract Number:</strong> ${contractData.contractNumber}</li>
                  <li><strong>Owner:</strong> ${contractData.ownerName}</li>
                  <li><strong>Tenant:</strong> ${contractData.tenantName}</li>
                  <li><strong>Property Address:</strong> ${contractData.propertyAddress}</li>
                </ul>
              </div>

              <div class="contract-content">
                ${contractData.contractContent}
              </div>

              <div class="footer">
                <p>Best regards,<br/>Your Property Management Team</p>
              </div>
            </div>
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
