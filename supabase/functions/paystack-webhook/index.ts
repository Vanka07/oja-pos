// Supabase Edge Function: Handle Paystack webhooks
// Deploy: supabase functions deploy paystack-webhook
// Set webhook URL in Paystack dashboard: https://bjpqdfcpclmcxyydtcmm.supabase.co/functions/v1/paystack-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || 'sk_test_c7de1a9a276978080c9c4757a223f33fa7a6faf0';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://bjpqdfcpclmcxyydtcmm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hash === signature;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    const isValid = await verifySignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    if (event.event === 'charge.success') {
      const data = event.data;

      if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return new Response('OK', { status: 200 });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const { error } = await supabase.from('subscriptions').upsert(
        {
          email: data.customer?.email || '',
          shop_id: data.metadata?.shop_id || '',
          paystack_reference: data.reference,
          paystack_customer_code: data.customer?.customer_code || '',
          plan: data.metadata?.plan || 'business',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          amount: data.amount || 500000,
          currency: data.currency || 'NGN',
        },
        { onConflict: 'paystack_reference' }
      );

      if (error) {
        console.error('Supabase upsert error:', error);
      } else {
        console.log('Subscription activated for:', data.customer?.email);
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});
