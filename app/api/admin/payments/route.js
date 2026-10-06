import { fail, ok, readJson, requireOwner } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';

/** Which online payment methods shoppers are offered, and the store's own account details. */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireOwner();
  if (error) return error;
  const admin = supabaseAdmin();
  const method = String(body.method || '');
  if (!['card', 'wallet', 'bank_transfer', 'paypal', 'cod'].includes(method)) {
    return fail(422, 'Unknown payment method.');
  }

  const patch = {};
  // The form always sends `enable`: the hidden field sends 0 and the switch overrides it with 1,
  // so an unchecked switch reaches the server as a real "off" rather than a missing field.
  if (body.enable !== undefined) {
    patch.is_enabled = String(body.enable) === '1' || body.enable === true || body.enable === 1;
  } else if (body.is_enabled !== undefined) {
    patch.is_enabled = Boolean(body.is_enabled);
  }
  if (body.shopper_instructions !== undefined) patch.shopper_instructions = String(body.shopper_instructions || '').trim() || null;
  if (body.store_account_details !== undefined) patch.store_account_details = body.store_account_details || null;
  patch.updated_at = new Date().toISOString();

  const { error: updateError } = await admin.from('payment_method_settings').update(patch).eq('method', method);
  if (updateError) return fail(500, updateError.message);

  if (method === 'cod') return ok({ message: 'Cash on delivery is always offered.' });
  return ok({
    message: patch.is_enabled === false
      ? 'Switched off — shoppers are not shown it at checkout.'
      : 'Payment settings saved. The change reaches checkout straight away.',
  });
}
