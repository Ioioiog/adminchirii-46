
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { termination_id } = await req.json();

    // Fetch termination details with contract and tenant information
    const { data: termination, error: terminationError } = await supabase
      .from("contract_terminations")
      .select(`
        *,
        contract:contracts (
          *,
          tenant:profiles!contracts_tenant_id_fkey (
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq("id", termination_id)
      .single();

    if (terminationError) throw terminationError;
    if (!termination) throw new Error("Termination not found");

    const { contract } = termination;
    if (!contract?.tenant?.email) throw new Error("Tenant email not found");

    // Send email to tenant
    const emailResponse = await resend.emails.send({
      from: "RentSync <notifications@rentsync.com>",
      to: contract.tenant.email,
      subject: "Contract Termination Notice",
      html: `
        <h1>Contract Termination Notice</h1>
        <p>Dear ${contract.tenant.first_name} ${contract.tenant.last_name},</p>
        <p>This email is to inform you about the termination of your rental contract.</p>
        
        <h2>Termination Details</h2>
        <ul>
          <li>Notice Date: ${termination.notice_date}</li>
          <li>Move-out Date: ${termination.move_out_date}</li>
          <li>Required Notice Period: ${termination.notice_period} days</li>
        </ul>
        
        <h2>Financial Information</h2>
        <ul>
          <li>Outstanding Rent: ${termination.outstanding_rent}</li>
          <li>Security Deposit: ${termination.security_deposit_amount}</li>
          <li>Deductions: ${termination.deposit_deductions}</li>
          <li>Refund Amount: ${termination.refund_amount}</li>
          <li>Payment Method: ${termination.payment_method}</li>
        </ul>
        
        <h2>Move-Out Instructions</h2>
        <h3>Property Inspection</h3>
        <p>Inspection scheduled for: ${termination.inspection_date}</p>
        
        <h3>Key Return Process</h3>
        <p>${termination.key_return_process}</p>
        
        <h3>Cleaning & Repair Requirements</h3>
        <p>${termination.cleaning_requirements}</p>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
