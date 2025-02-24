
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from send-contract-invitation!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractId, email, name } = await req.json();

    if (!contractId || !email) {
      throw new Error('Missing required fields');
    }

    // Generate invitation token
    const token = crypto.randomUUID();

    // Update contract with invitation token and email
    const { error: updateError } = await supabaseClient
      .from('contracts')
      .update({
        invitation_token: token,
        invitation_email: email,
        status: 'pending_signature',
        invitation_sent_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) throw updateError;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Admin Chirii <no-reply@adminchirii.ro>',
        to: email,
        subject: 'Contract Signing Invitation',
        html: `
          <p>Dear ${name || 'Tenant'},</p>
          <p>You have been invited to sign a contract. Please click the link below to view and sign the contract:</p>
          <a href="https://www.adminchirii.ro/tenant-registration/${contractId}?invitation_token=${token}">View and Sign Contract</a>
          <p>This link will expire in 7 days.</p>
          <p>Best regards,<br>Admin Chirii Team</p>
        `
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ message: "Invitation sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
