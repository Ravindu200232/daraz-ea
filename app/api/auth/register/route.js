import { fail, ok, readJson } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { validateCustomer } from '@/lib/staff.js';
import { isValidPassword } from '@/lib/validation.js';
import { startSessionFor } from '@/lib/session.js';

/**
 * Public sign-up. It can only ever create a Shopper: the staff and owner roles are created by the
 * Store Owner at Staff Members, never by this route.
 */
export async function POST(request) {
  const body = await readJson(request);
  const checked = validateCustomer(body);
  if (!checked.ok) return fail(422, checked.message, { field: checked.reason });

  if (!isValidPassword(body.password, 'register')) {
    return fail(422, 'Your password does not meet the password rule yet.', { field: 'password' });
  }

  const admin = supabaseAdmin();
  const { data: existing } = await admin.from('customers').select('id').ilike('email', checked.email).maybeSingle();
  if (existing) {
    return fail(409, `${checked.email} already has an account — sign in instead, or use a different email address.`, { field: 'email' });
  }

  const created = await admin.auth.admin.createUser({
    email: checked.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: checked.full_name },
  });
  if (created.error) {
    return fail(409, created.error.message.includes('already') ? `${checked.email} already has an account — sign in instead.` : created.error.message, { field: 'email' });
  }

  const { error: insertError } = await admin.from('customers').insert({
    id: created.data.user.id,
    full_name: checked.full_name,
    email: checked.email,
    phone: checked.phone,
    sign_in_method: 'email',
    account_status: 'active',
  });
  if (insertError) return fail(500, insertError.message);

  const session = await startSessionFor(checked.email);
  if (!session.ok) return fail(500, session.message);

  return ok({ message: 'Your account is ready — welcome to DarazEA.', redirect: '/account' });
}
