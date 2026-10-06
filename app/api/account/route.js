import { fail, ok, readJson, requireShopper } from '@/lib/api.js';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase.js';
import { checkCredentials } from '@/lib/session.js';
import { isValidPassword, isValidPhone } from '@/lib/validation.js';

/** A shopper's own details and password. */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireShopper();
  if (error) return error;
  const action = String(body.action || 'profile');

  if (action === 'profile') {
    const name = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    if (!name) return fail(422, 'Enter your full name.', { field: 'full_name' });
    if (!isValidPhone(phone)) return fail(422, 'Enter the complete phone number, including the country code.', { field: 'phone' });

    const supabase = await supabaseServer();
    const { error: updateError } = await supabase
      .from('customers')
      .update({ full_name: name, phone })
      .eq('id', viewer.user.id);
    if (updateError) return fail(500, updateError.message);
    return ok({ message: 'Your details were saved. Orders placed from now on use this name and phone number.' });
  }

  if (action === 'password') {
    const current = String(body.current_password || '');
    const next = String(body.new_password || '');
    const confirm = String(body.confirm_password || '');
    if (next !== confirm) {
      return fail(422, 'These two passwords do not match. Type the new password again in both boxes.', { field: 'confirm_password' });
    }
    if (!isValidPassword(next, 'reset')) {
      return fail(422, 'At least 8 characters, with one letter and one number.', { field: 'new_password' });
    }
    const credentials = await checkCredentials(viewer.customer?.email || viewer.user.email, current);
    if (!credentials.ok) return fail(401, 'The current password is not correct.', { field: 'current_password' });

    const admin = supabaseAdmin();
    const { error: passwordError } = await admin.auth.admin.updateUserById(viewer.user.id, { password: next });
    if (passwordError) return fail(500, passwordError.message);
    return ok({ message: 'Your password is updated.' });
  }

  return fail(400, 'Unknown account action.');
}
