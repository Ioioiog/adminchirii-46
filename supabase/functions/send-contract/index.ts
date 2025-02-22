
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientEmail, contractData } = await req.json() as EmailRequest

    console.log(`Sending contract email to: ${recipientEmail}`)

    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Contracts <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `Contract #${contractData.contractNumber} for Review`,
      html: `
        <h1>Contract for Review</h1>
        <p>Dear recipient,</p>
        <p>Please find attached the contract for your review.</p>
        <p><strong>Contract Details:</strong></p>
        <ul>
          <li>Contract Number: ${contractData.contractNumber}</li>
          <li>Owner: ${contractData.ownerName}</li>
          <li>Tenant: ${contractData.tenantName}</li>
          <li>Property Address: ${contractData.propertyAddress}</li>
        </ul>
        <div>
          ${contractData.contractContent}
        </div>
        <p>Best regards,<br/>Your Property Management Team</p>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    console.log('Email sent successfully:', emailResponse)

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
