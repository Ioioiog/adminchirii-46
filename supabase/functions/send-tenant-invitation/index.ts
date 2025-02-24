
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from send-tenant-invitation!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, properties, token, startDate, endDate } = await req.json();

    const propertiesList = properties.map((p: any) => `
      <li>${p.name} - ${p.address}</li>
    `).join('');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Admin Chirii <no-reply@adminchirii.ro>',
        to: email,
        subject: 'Tenant Invitation',
        html: `
          <h2>Welcome to Admin Chirii!</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>You have been invited as a tenant for the following properties:</p>
          <ul>
            ${propertiesList}
          </ul>
          <p>Start Date: ${new Date(startDate).toLocaleDateString()}</p>
          ${endDate ? `<p>End Date: ${new Date(endDate).toLocaleDateString()}</p>` : ''}
          <p>Please click the link below to complete your registration:</p>
          <a href="https://www.adminchirii.ro/tenant-registration?invitation_token=${token}">Complete Registration</a>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>Admin Chirii Team</p>
        `,
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
