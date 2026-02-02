/**
 * Paystack payment integration for Oja POS
 * 
 * Client-side: Uses Paystack public key to generate inline checkout URLs
 * Server-side: Verification happens via Supabase Edge Function + webhooks
 */

export const PAYSTACK_PUBLIC_KEY = 'pk_test_25d612955358dd9ac5ee6f429181c83d054514d2';

export const PAYSTACK_CONFIG = {
  publicKey: PAYSTACK_PUBLIC_KEY,
  amount: 500000, // ₦5,000 in kobo
  currency: 'NGN',
  plan: 'business',
  callbackUrl: 'https://ojapos.app/payment-callback',
  channels: ['card', 'bank', 'ussd', 'bank_transfer'] as const,
};

/**
 * Generate a unique payment reference
 */
export function generateReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `oja_${timestamp}_${random}`;
}

/**
 * Build the Paystack inline checkout URL
 * This approach uses only the public key (no secret key on client)
 */
export function buildCheckoutUrl(params: {
  email: string;
  amount?: number;
  reference?: string;
  shopId?: string;
  shopName?: string;
}): string {
  const {
    email,
    amount = PAYSTACK_CONFIG.amount,
    reference = generateReference(),
    shopId,
    shopName,
  } = params;

  const metadata = JSON.stringify({
    plan: PAYSTACK_CONFIG.plan,
    duration: 30,
    shop_id: shopId || '',
    shop_name: shopName || '',
    custom_fields: [
      {
        display_name: 'Plan',
        variable_name: 'plan',
        value: 'Business - ₦5,000/mo',
      },
    ],
  });

  const queryParams = new URLSearchParams({
    key: PAYSTACK_CONFIG.publicKey,
    email,
    amount: amount.toString(),
    ref: reference,
    currency: PAYSTACK_CONFIG.currency,
    callback_url: PAYSTACK_CONFIG.callbackUrl,
    metadata,
    channels: JSON.stringify(PAYSTACK_CONFIG.channels),
  });

  return `https://checkout.paystack.com/redirect?${queryParams.toString()}`;
}

/**
 * Verify a payment via Supabase Edge Function
 * The edge function calls Paystack's verify API with the secret key
 */
export async function verifyPayment(reference: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    status: string;
    amount: number;
    currency: string;
    customer_email: string;
    paid_at: string;
  };
}> {
  try {
    const response = await fetch(
      `https://bjpqdfcpclmcxyydtcmm.supabase.co/functions/v1/paystack-verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqcHFkZmNwY2xtY3h5eWR0Y21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDU5MjksImV4cCI6MjA4NTUyMTkyOX0.uDaWROwrMuCFt4kU-n3IaX5Fy3jGVwtbWGJQLPzcbsY`,
        },
        body: JSON.stringify({ reference }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.message || 'Verification failed' };
    }

    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

/**
 * Extract reference from callback URL params
 */
export function extractReference(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('reference') || urlObj.searchParams.get('trxref');
  } catch {
    return null;
  }
}
