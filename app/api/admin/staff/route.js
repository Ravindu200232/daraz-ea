import { fail, ok, readJson, requireOwner } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { validateStaff } from '@/lib/staff.js';
import { randomUUID } from 'node:crypto';

/**
 * Staff accounts, added by the Store Owner and always the Staff role — never a second Store Owner.
 * A new account is created on the project's own Supabase Auth; the member sets their own password
 * through Forgot Password and then signs in with a one-time code.
 */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireOwner();
  if (error) return error;
  const admin = supabaseAdmin();
  const action = String(body.action || 'add');

  const { data: members } = await admin.from('staff_members').select('*');

  if (action === 'toggle') {
    const member = (members || []).find((row) => row.id === body.id);
    if (!member) return fail(404, 'That staff account is not on the list.');
    if (member.role === 'store_owner') return fail(409, 'The Store Owner account cannot be switched off here.');
    const status = member.status === 'active' ? 'off' : 'active';
    await admin.from('staff_members').update({ status }).eq('id', member.id);
    return ok({
      message: status === 'active'
        ? `${member.full_name} can sign in at the Management Sign In again.`
        : `${member.full_name} can no longer sign in at the Management Sign In.`,
    });
  }

  const checked = validateStaff({
    full_name: body.full_name,
    email: body.email,
    existing: members || [],
  });
  if (!checked.ok) return fail(checked.reason === 'duplicate' ? 409 : 422, checked.message, { field: checked.reason });

  const created = await admin.auth.admin.createUser({
    email: checked.email,
    password: randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: checked.full_name },
  });
  if (created.error) {
    return fail(409, created.error.message.includes('already')
      ? 'That email address already has an account. Use a different email address.'
      : created.error.message, { field: 'email' });
  }

  const { error: insertError } = await admin.from('staff_members').insert({
    id: created.data.user.id,
    full_name: checked.full_name,
    email: checked.email,
    role: 'staff',
    status: 'active',
  });
  if (insertError) return fail(500, insertError.message);

  return ok({
    message: `${checked.full_name} was added as Staff. The account signs in at the Management Sign In with a one-time code.`,
  });
}
