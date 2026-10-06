import { fail, ok, readJson } from '@/lib/api.js';
import { supabaseServer } from '@/lib/supabase.js';
import { isValidEmail } from '@/lib/validation.js';
import { isValidPassword } from '@/lib/validation.js';

/**
 * A single-use reset link, sent by the project's own Supabase Auth. The same confirmation is
 * returned for every address, so nothing here reveals whether an email is registered.
 */
export async function POST(request) {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return fail(422, 'Enter a full email address, for example nimali.perera@example.com.', { field: 'email' });
  }

  if (body.token_hash && body.new_password) {
    if (!isValidPassword(body.new_password, 'reset')) {
      return fail(422, 'At least 8 characters, with one letter and one number.', { field: 'new_password' });
    }
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: body.token_hash });
    if (error) return fail(401, 'This link no longer works. It has already been used, or its hour has passed.', { field: 'token' });
    const { error: updateError } = await supabase.auth.updateUser({ password: body.new_password });
    if (updateError) return fail(500, updateError.message);
    return ok({ message: 'Password changed. The link has now been used and will not work a second time.', redirect: '/login' });
  }

  const supabase = await supabaseServer();
  const origin = new URL(request.url).origin;
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/forgot-password?step=3`,
  });

  return ok({
    message: `If ${email} belongs to a ${'DarazEA'} account, a single-use link to set a new password is on its way.`,
  });
}
