import { fail, ok, readJson } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { checkCredentials, startSessionFor } from '@/lib/session.js';
import { getViewer } from '@/lib/auth.js';

/**
 * Shopper sign-in. A management account is told to use the management sign-in; a switched-off
 * account is refused with the store's own wording, and nothing is signed in either way.
 */
export async function POST(request) {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return fail(422, 'Enter your email address and password.');

  const credentials = await checkCredentials(email, password);
  if (!credentials.ok) {
    return fail(401, 'The email address or password is not correct. Check them and try again.');
  }

  const admin = supabaseAdmin();
  const { data: staff } = await admin.from('staff_members').select('status').eq('id', credentials.userId).maybeSingle();
  if (staff) {
    return fail(403, 'This is a management account. Sign in at the Management Sign In with your one-time code.', {
      redirect: '/admin/login',
    });
  }

  const { data: customer } = await admin.from('customers').select('account_status').eq('id', credentials.userId).maybeSingle();
  if (!customer) return fail(403, 'This account is not a shopper account.');
  if (customer.account_status !== 'active') {
    return fail(403, 'This account has been switched off. Email support@darazea.example if you think that is wrong.');
  }

  const session = await startSessionFor(email);
  if (!session.ok) return fail(500, session.message);

  const viewer = await getViewer();
  return ok({ message: `Welcome back, ${viewer.customer?.full_name || 'shopper'}.`, redirect: '/account' });
}
