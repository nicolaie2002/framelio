import Stripe from 'stripe';
import { getSupabaseAdmin } from './_supabase.js';

export const config = { api: { bodyParser: false } };

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).end();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return response.status(500).json({ error: 'Stripe webhook is not configured.' });

  try {
    const stripe = new Stripe(secretKey);
    const event = stripe.webhooks.constructEvent(await readRawBody(request), request.headers['stripe-signature'], webhookSecret);
    const supabase = getSupabaseAdmin();
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id || session.subscription_details?.metadata?.user_id;

    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)
      && session.payment_status === 'paid' && userId) {
      await upsertProfile(supabase, userId, 'pro', 'lifetime', null);
    }
    return response.status(200).json({ received: true });
  } catch (error) {
    return response.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}

async function upsertProfile(supabase, userId, plan, status, periodEnd) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    plan,
    subscription_status: status,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
