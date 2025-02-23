
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  contractId: string;
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting contract invitation email process");

    const { email, firstName, lastName, contractId, token }: EmailRequest = await req.json();
    console.log("Received request data:", { email, firstName, lastName, contractId, token });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not set");
    }

    const contractUrl = `${supabaseUrl.replace('.supabase.co', '')}/documents/contracts/${contractId}?token=${token}`;
    console.log("Generated contract URL:", contractUrl);

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "AdminChirii <onboarding@resend.dev>",
      to: [email],
      subject: "Contract Invitation",
      html: `
        <h1>Hello ${firstName} ${lastName},</h1>
        <p>You have been invited to sign a contract.</p>
        <p>Please click the link below to view and sign the contract:</p>
        <a href="${contractUrl}">View Contract</a>
        <p>If you don't have an account yet, you'll be able to create one before signing the contract.</p>
        <p>This invitation link will expire in 7 days.</p>
        <br>
        <p>Best regards,</p>
        <p>AdminChirii Team</p>
      `
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-contract-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
