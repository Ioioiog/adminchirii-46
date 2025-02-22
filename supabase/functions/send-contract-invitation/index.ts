
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, tenantEmail, contractNumber, ownerName, propertyAddress }: ContractInvitationRequest = await req.json();

    // Update contract with invitation details
    const { data: contract, error: updateError } = await supabase
      .from('contracts')
      .update({
        invitation_sent_at: new Date().toISOString(),
        invitation_email: tenantEmail,
        invitation_token: crypto.randomUUID()
      })
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) throw updateError;

    const signLink = `${Deno.env.get("PUBLIC_SITE_URL")}/documents/contracts/${contractId}?token=${contract.invitation_token}`;

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [tenantEmail],
      subject: `Contract de închiriere #${contractNumber} - Invitație de semnare`,
      html: `
        <h1>Invitație de semnare contract</h1>
        <p>Bună ziua,</p>
        <p>Ați fost invitat(ă) de către ${ownerName} să semnați contractul de închiriere pentru proprietatea situată la adresa: ${propertyAddress}.</p>
        <p>Pentru a vizualiza și semna contractul, vă rugăm să accesați următorul link:</p>
        <p><a href="${signLink}">${signLink}</a></p>
        <p>Link-ul este valabil pentru o singură utilizare.</p>
        <p>Cu stimă,<br>Echipa Lovable</p>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending contract invitation:", error);
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
