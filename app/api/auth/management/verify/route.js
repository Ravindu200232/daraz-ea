import { cookies } from 'next/headers';
import { fail, ok, readJson } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { verifyCode } from '@/lib/otp.js';
import { startSessionFor } from '@/lib/session.js';

const COOKIE = 'darazea_mgmt_email';

/**
 * Management sign-in, step 2: the one-time code. Wrong, expired and already-used codes are all
 * refused, and nothing opens a management page until the code is verified.
 */
export async function POST(request) {
  const body = await readJson(request);
  const store = await cookies();
  const email = store.get(COOKIE)?.value;
  if (!email) return fail(401, 'Start again — send yourself a one-time code first.');

  const admin = supabaseAdmin();
  const { data: staff } = await admin
    .from('staff_members')
    .select('id, email, status')
    .ilike('email', email)
    .maybeSingle();
  if (!staff) return fail(403, 'That account is not a management account.');
  if (staff.status !== 'active') {
    return fail(403, 'This management account is switched off. Ask the store owner to switch it back on.');
  }

  const now = new Date().toISOString();
  const { data: open } = await admin
    .from('management_codes')
    .select('*')
    .eq('staff_id', staff.id)
    .eq('used', false)
    .gte('expires_at', now)
    .order('created_at', { ascending: false });
  if (!open?.length) return fail(401, 'Send yourself a one-time code first.');

  // Any code still open for this account works: asking for a second code does not cancel the
  // first one, and a code is spent the moment it is used.
  const entered = String(body.code || '').replace(/[^0-9]/g, '');
  const row = open.find((candidate) => candidate.code === entered);
  if (!row) {
    const verdict = verifyCode({ entered, expected: open[0].code, expiresAt: open[0].expires_at, now: new Date() });
    return fail(401, verdict.message);
  }

  await admin.from('management_codes').update({ used: true }).eq('id', row.id);
  const session = await startSessionFor(staff.email);
  if (!session.ok) return fail(500, session.message);
  store.delete(COOKIE);

  return ok({ message: 'Code verified. Opening the management side…', redirect: '/admin' });
}
