
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user's profile to check if they have a Stripe customer ID
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    // If no Stripe customer ID exists, create one
    if (!customerId) {
      // Get user email from auth.users
      const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      if (userError) throw userError;

      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      // Save the Stripe customer ID to the user's profile
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create a SetupIntent for adding a payment method
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: `${Deno.env.get('PUBLIC_SITE_URL')}/settings?setup_success=true`,
      cancel_url: `${Deno.env.get('PUBLIC_SITE_URL')}/settings?setup_canceled=true`,
    });

    // Return the session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error creating payment setup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
