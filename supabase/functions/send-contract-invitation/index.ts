
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailData {
  contractId: string;
  email: string;
  name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contractId, email, name }: EmailData = await req.json();
    const token = crypto.randomUUID();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update contract with invitation token and email
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({
        invitation_token: token,
        invitation_email: email,
        invitation_sent_at: new Date().toISOString(),
        status: 'pending_signature'
      })
      .eq('id', contractId);

    if (updateError) throw updateError;

    // Send email using Resend
    const inviteUrl = `${req.headers.get('origin')}/tenant-registration/${contractId}?invitation_token=${token}`;
    
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Contract Management <contracts@adminchirii.ro>',
        to: email,
        subject: 'Contract Signature Required',
        html: `
          <h1>Hello ${name},</h1>
          <p>You have been invited to sign a contract.</p>
          <p>Please click the link below to view and sign the contract:</p>
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background-color:#0F172A;color:white;text-decoration:none;border-radius:5px;">
            View Contract
          </a>
          <p>If you cannot click the button, copy and paste this link in your browser:</p>
          <p>${inviteUrl}</p>
          <p>This link will expire in 7 days.</p>
        `
      })
    });

    if (!emailResponse.ok) throw new Error('Failed to send email');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
