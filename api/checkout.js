import Stripe from 'stripe';
import { requireUser } from './_supabase.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });

  try {
    const { user } = await requireUser(request);
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!secretKey || !priceId) return response.status(500).json({ error: 'Stripe is not configured.' });

    const stripe = new Stripe(secretKey);
    const appUrl = process.env.APP_URL || `https://${request.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      payment_intent_data: { metadata: { user_id: user.id } },
      success_url: `${appUrl}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout-cancel.html`,
    });
    return response.status(200).json({ url: session.url });
  } catch (error) {
    const status = error.statusCode || 500;
    return response.status(status).json({ error: error.message || 'Unable to create checkout.' });
  }
}
