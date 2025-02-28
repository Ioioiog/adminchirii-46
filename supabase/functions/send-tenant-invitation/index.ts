import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    console.log("Received invitation request:", JSON.stringify(requestData));

    // Extract required fields
    const { email, firstName, lastName, token, properties } = requestData;
    
    // Validate required fields
    if (!email) {
      throw new Error("Missing required field: email");
    }
    
    // Get the site URL from environment or use a default
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";
    
    // Create the registration link with the token
    const registrationLink = `${siteUrl}/tenant-registration?token=${token}`;
    
    // Generate email content
    let propertiesList = '';
    if (properties && Array.isArray(properties)) {
      propertiesList = properties.map(p => `<li>${p.name} - ${p.address}</li>`).join('');
    } else {
      propertiesList = '<li>Property details not available</li>';
    }
    
    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Send email using Resend
    console.log("Sending email to:", email);
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Admin Chirii <onboarding@resend.dev>',
        to: email,
        subject: 'Invitation to Admin Chirii as a Tenant',
        html: `
          <h2>Welcome to Admin Chirii!</h2>
          <p>Dear ${firstName || ''} ${lastName || ''},</p>
          <p>You have been invited as a tenant for the following properties:</p>
          <ul>
            ${propertiesList}
          </ul>
          <p>Please click the link below to complete your registration:</p>
          <a href="${registrationLink}">Complete Registration</a>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>Admin Chirii Team</p>
        `,
      }),
    });

    // Check if email was sent successfully
    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", JSON.stringify(errorData));
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", JSON.stringify(emailResult));

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in send-tenant-invitation:', error.message);
    // Return a proper error response
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process invitation" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
