
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractInvitationRequest {
  contractId: string;
  email: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body
    const { contractId, email, name }: ContractInvitationRequest = await req.json();
    
    console.log("Processing contract invitation for:", { contractId, email, name });

    // Check if contract exists
    const { data: contract, error: contractError } = await supabaseClient
      .from("contracts")
      .select("*, properties(*)")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found");
    }

    // Generate invitation token
    const token = crypto.randomUUID();

    // Update contract with invitation token
    const { error: updateError } = await supabaseClient
      .from("contracts")
      .update({ 
        invitation_token: token,
        status: 'pending_signature'
      })
      .eq("id", contractId);

    if (updateError) {
      throw updateError;
    }

    // Check if user exists
    const { data: existingUser } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    const isExistingUser = !!existingUser;
    console.log("User status:", isExistingUser ? "Existing user" : "New user");

    // Send appropriate email based on user status
    const { error: emailError } = await resend.emails.send({
      from: "Property Manager <onboarding@resend.dev>",
      to: [email],
      subject: isExistingUser 
        ? "Contract Ready for Review and Signature" 
        : "Welcome - Contract Ready for Review",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${isExistingUser ? 'Your Contract is Ready' : 'Welcome to Property Manager'}</h1>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #666; margin-top: 0;">Property Details</h2>
            <p style="margin: 5px 0;">Property: ${contract.properties?.name || 'N/A'}</p>
            <p style="margin: 5px 0;">Address: ${contract.properties?.address || 'N/A'}</p>
            <p style="margin: 5px 0;">Landlord: ${contract.properties?.landlord_name || 'N/A'}</p>
          </div>

          ${!isExistingUser ? `
            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">🎉 Welcome to Property Manager!</h3>
              <p>To get started, you'll need to create an account. Don't worry, it's quick and easy!</p>
              <ul style="color: #1b5e20;">
                <li>Secure contract signing</li>
                <li>Access your rental documents</li>
                <li>Easy communication with your landlord</li>
                <li>Track rent payments</li>
              </ul>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.adminchirii.ro/tenant-registration?token=${token}&contractId=${contractId}"
               style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ${isExistingUser ? 'View and Sign Contract' : 'Create Account & View Contract'}
            </a>
          </div>

          <div style="color: #666; font-size: 14px; margin-top: 30px;">
            <p>If you need any assistance, please contact our support team at support@propertymanager.com</p>
            <p>For security reasons, this link will expire in 24 hours.</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in send-contract-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
