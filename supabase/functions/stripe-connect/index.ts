
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }

    console.log('Creating Stripe instance with secret key');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get user information for making the Stripe account
    const authHeader = req.headers.get('Authorization')?.split(' ')[1];
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    try {
      console.log('Creating Stripe Connect account');
      // Only create express accounts if you're a Stripe Connect platform
      // For testing, we'll create a standard account link that just leads to Stripe
      const accountLinkParams = new URLSearchParams({
        client_id: 'ca_123', // Replace with your actual Connect application client_id
        state: 'test_state',
        suggested_capabilities: 'transfers',
        return_url: `${req.headers.get('origin')}/settings`,
        refresh_url: `${req.headers.get('origin')}/settings`,
      });

      // Instead of creating a new connect account (which requires Stripe Connect registration),
      // we'll redirect to the Stripe dashboard where the user can set up their account
      const dashboardUrl = `https://dashboard.stripe.com/account`;
      
      return new Response(
        JSON.stringify({ url: dashboardUrl }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: stripeError.message || 'Stripe API error',
          details: 'This may be because you need to register for Stripe Connect to create accounts.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Error creating Stripe connect session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Please check your Stripe configuration in the Supabase dashboard'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
