
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contractId, email, name } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update contract status
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        status: 'pending_signature',
        invitation_token: crypto.randomUUID(),
        invitation_sent_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) throw updateError;

    // Get contract details
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError) throw contractError;

    // Send email invitation
    const { error: emailError } = await resend.emails.send({
      from: 'Contracts <onboarding@resend.dev>',
      to: [email],
      subject: 'Contract Signature Request',
      html: `
        <h1>Hello ${name},</h1>
        <p>You have been invited to sign a contract.</p>
        <p>Please click the link below to view and sign the contract:</p>
        <a href="${Deno.env.get('SITE_URL')}/documents/contracts/${contractId}?token=${contract.invitation_token}">
          View Contract
        </a>
      `,
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ message: 'Invitation sent successfully' }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
