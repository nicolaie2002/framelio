import { requireUser } from './_supabase.js';
import { applyRateLimit, checkRateLimit, getClientIp } from './_rate-limit.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed.' });
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit({
      key: `verify-license:ip:${clientIp}`,
      limit: 240,
      windowMs: 60 * 1000,
    });
    applyRateLimit(response, ipLimit);
    if (!ipLimit.allowed) {
      return response.status(429).json({ error: 'Too many license checks. Please retry in a moment.' });
    }

    const { supabase, user } = await requireUser(request);
    const userLimit = checkRateLimit({
      key: `verify-license:user:${user.id}`,
      limit: 120,
      windowMs: 60 * 1000,
    });
    applyRateLimit(response, userLimit);
    if (!userLimit.allowed) {
      return response.status(429).json({ error: 'Too many license checks for this account. Please retry in a moment.' });
    }

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
