
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from send-tenant-invitation!");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationId, email, firstName, lastName } = await req.json();
    
    // Validate required fields
    if (!invitationId || !email || !firstName || !lastName) {
      throw new Error("Missing required fields: invitationId, email, firstName, lastName");
    }
    
    // Fetch the invitation details including the associated properties
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch the invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("tenant_invitations")
      .select("*, tenant_invitation_properties(*, properties(name, address))")
      .eq("id", invitationId)
      .single();
      
    if (invitationError) {
      throw new Error(`Error fetching invitation: ${invitationError.message}`);
    }
    
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    
    const properties = invitation.tenant_invitation_properties.map(tip => tip.properties);
    
    // Get the site URL from environment
    const siteUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://www.adminchirii.ro";
    
    // Create the registration link with the token
    const registrationLink = `${siteUrl}/tenant-registration/${invitation.token}`;
    
    // Generate email content
    const propertiesList = properties.map(p => `<li>${p.name} - ${p.address}</li>`).join('');
    
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
        subject: 'Invitation to Admin Chirii as a Tenant',
        html: `
          <h2>Welcome to Admin Chirii!</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>You have been invited as a tenant for the following properties:</p>
          <ul>
            ${propertiesList}
          </ul>
          <p>Start Date: ${new Date(invitation.start_date).toLocaleDateString()}</p>
          ${invitation.end_date ? `<p>End Date: ${new Date(invitation.end_date).toLocaleDateString()}</p>` : ''}
          <p>Please click the link below to complete your registration:</p>
          <a href="${registrationLink}">Complete Registration</a>
          <p>This invitation will expire in 7 days.</p>
          <p>Best regards,<br>Admin Chirii Team</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in send-tenant-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to create Supabase client (similar to the one in _shared folder)
function createClient(supabaseUrl, supabaseKey) {
  return {
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          single: async () => {
            const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}`;
            const response = await fetch(url, {
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                apikey: supabaseKey,
                "Content-Type": "application/json",
              },
            });
            
            if (!response.ok) {
              const error = await response.json();
              return { data: null, error };
            }
            
            const data = await response.json();
            return { data: data[0] || null, error: null };
          }
        })
      })
    })
  };
}
