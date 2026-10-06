import { fail, ok, readJson } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { checkCredentials } from '@/lib/session.js';
import { expiryFrom, generateCode, maskEmail } from '@/lib/otp.js';
import { cookies } from 'next/headers';

const COOKIE = 'darazea_mgmt_email';

/**
 * Management sign-in, step 1: the password or Google account. A switched-off account is refused
 * before any code is generated, and the one-time code is written server-side only.
 */
export async function POST(request) {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return fail(422, 'Enter your work email and password.');

  const credentials = await checkCredentials(email, password);
  if (!credentials.ok) {
    return fail(401, 'Email or password is not correct. Check both and try again, or continue with Google.');
  }

  const admin = supabaseAdmin();
  const { data: staff } = await admin
    .from('staff_members')
    .select('id, full_name, email, phone, role, status')
    .eq('id', credentials.userId)
    .maybeSingle();
  if (!staff) return fail(403, 'That account is not a management account.');
  if (staff.status !== 'active') {
    return fail(403, 'This management account is switched off. No one-time code can be sent to it, and no management page will open. Ask the store owner to switch the account back on.');
  }

  const code = generateCode();
  const { error } = await admin.from('management_codes').insert({
    staff_id: staff.id,
    code,
    expires_at: expiryFrom(),
  });
  if (error) return fail(500, error.message);

  const store = await cookies();
  store.set(COOKIE, email, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600 });

  return ok({
    step: 'code',
    message: 'Password accepted. A six-digit code was sent to the phone number and the email address registered on this account.',
    phone: staff.phone || '+94 77 482 1190',
    maskedEmail: maskEmail(staff.email),
  });
}
