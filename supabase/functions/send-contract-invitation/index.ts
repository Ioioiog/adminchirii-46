
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractInvitationRequest {
  contractId: string;
  tenantEmail: string;
  contractNumber: string;
  ownerName: string;
  propertyAddress: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, tenantEmail, contractNumber, ownerName, propertyAddress }: ContractInvitationRequest = await req.json();

    console.log("Sending contract invitation:", {
      contractId,
      tenantEmail,
      contractNumber,
      ownerName,
      propertyAddress,
    });

    // Update contract with invitation details
    const { data: contract, error: updateError } = await supabase
      .from('contracts')
      .update({
        invitation_sent_at: new Date().toISOString(),
        invitation_email: tenantEmail,
        invitation_token: crypto.randomUUID(),
        status: 'pending'
      })
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating contract:", updateError);
      throw updateError;
    }

    const signLink = `${Deno.env.get("PUBLIC_SITE_URL")}/documents/contracts/${contractId}?token=${contract.invitation_token}`;

    const { error: emailError } = await resend.emails.send({
      from: "AdminChirii.ro <onboarding@resend.dev>",
      to: [tenantEmail],
      subject: `Contract Signing Invitation - #${contractNumber}`,
      html: `
        <h1>Contract Signing Invitation</h1>
        <p>Hello,</p>
        <p>You have been invited by ${ownerName} to sign a rental contract for the property located at: ${propertyAddress}.</p>
        <p>To view and sign the contract, please click the link below:</p>
        <p><a href="${signLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View and Sign Contract</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${signLink}</p>
        <p>This link is for one-time use only and is tied to your email address.</p>
        <p>Best regards,<br>AdminChirii.ro</p>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Invitation sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-contract-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
