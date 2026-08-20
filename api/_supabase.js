import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase server configuration is missing.');
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function getBearerToken(request) {
  const header = request.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function requireUser(request) {
  const token = getBearerToken(request);
  if (!token) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error('Invalid authentication token.');
    authError.statusCode = 401;
    throw authError;
  }
  return { supabase, user: data.user };
}
