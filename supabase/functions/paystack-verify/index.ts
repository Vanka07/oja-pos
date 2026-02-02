// Supabase Edge Function: Verify Paystack payment and activate subscription
// Deploy: supabase functions deploy paystack-verify

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || 'sk_test_c7de1a9a276978080c9c4757a223f33fa7a6faf0';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://bjpqdfcpclmcxyydtcmm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ success: false, message: 'Reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return new Response(
        JSON.stringify({
          success: false,
          message: paystackData.message || 'Payment not successful',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const txData = paystackData.data;

    // Save to Supabase if service role key is available
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      await supabase.from('subscriptions').upsert(
        {
          email: txData.customer?.email || '',
          shop_id: txData.metadata?.shop_id || '',
          paystack_reference: reference,
          paystack_customer_code: txData.customer?.customer_code || '',
          plan: txData.metadata?.plan || 'business',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          amount: txData.amount || 500000,
          currency: txData.currency || 'NGN',
        },
        { onConflict: 'paystack_reference' }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        data: {
          status: txData.status,
          amount: txData.amount,
          currency: txData.currency,
          customer_email: txData.customer?.email,
          paid_at: txData.paid_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
