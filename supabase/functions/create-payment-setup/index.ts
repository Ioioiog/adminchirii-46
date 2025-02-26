
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
    // Check required environment variables
    const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!publicSiteUrl) {
      throw new Error('PUBLIC_SITE_URL environment variable is not set');
    }

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const { userId } = await req.json();
    console.log('Processing request for user:', userId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Required Supabase environment variables are not set');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user's profile to check if they have a Stripe customer ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    let customerId = profile?.stripe_customer_id;
    console.log('Existing customer ID:', customerId);

    // If no Stripe customer ID exists, create one
    if (!customerId) {
      console.log('Creating new Stripe customer');
      const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;
      console.log('Created new customer:', customerId);

      // Save the Stripe customer ID to the user's profile
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update user profile with Stripe customer ID');
      }
    }

    // Create a SetupIntent for adding a payment method
    console.log('Creating Stripe Checkout session');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'setup',
      success_url: `${publicSiteUrl}/settings?setup_success=true`,
      cancel_url: `${publicSiteUrl}/settings?setup_canceled=true`,
    });

    console.log('Checkout session created:', session.id);

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
    console.error('Error in create-payment-setup:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the Edge Function logs for more details'
      }),
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
