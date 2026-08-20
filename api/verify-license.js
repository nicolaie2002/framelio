import { requireUser } from './_supabase.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const { supabase, user } = await requireUser(request);
    const { data, error } = await supabase
      .from('profiles')
      .select('plan, subscription_status, current_period_end')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    const active = data?.plan === 'pro' && data.subscription_status === 'lifetime';
    return response.status(200).json({ isPro: active, profile: data || null });
  } catch (error) {
    return response.status(error.statusCode || 500).json({ error: error.message || 'Unable to verify license.' });
  }
}
