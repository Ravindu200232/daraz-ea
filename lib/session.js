import { supabaseAdmin, supabaseServer } from './supabase.js';

/** An anon client for checking credentials without touching the visitor's own session. */
export async function checkCredentials(email, password) {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.user) return { ok: false };
  return { ok: true, userId: data.user.id };
}

/**
 * Start a session for a signed-in identity without ever handling its password again:
 * a single-use magic-link token is generated server-side and immediately verified, which is the
 * documented way to establish a session from the server.
 */
export async function startSessionFor(email) {
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) return { ok: false, message: error?.message || 'could not start the session' };
  const supabase = await supabaseServer();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: data.properties.hashed_token,
  });
  if (verifyError) return { ok: false, message: verifyError.message };
  return { ok: true };
}
