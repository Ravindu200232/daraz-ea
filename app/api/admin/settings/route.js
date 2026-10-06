import { fail, ok, readJson, requireOwner } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { validateStoreSettings } from '@/lib/settings.js';

/** The store's own name, support details and who is alerted for a new order. */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireOwner();
  if (error) return error;

  const checked = validateStoreSettings({
    store_name: body.store_name,
    support_email: body.support_email,
    support_phone: body.support_phone,
    recipients: Array.isArray(body.new_order_alert_recipients)
      ? body.new_order_alert_recipients
      : String(body.new_order_alert_recipients || '').split(/[\s,]+/),
  });
  if (!checked.ok) return fail(422, checked.message, { field: checked.reason });

  const admin = supabaseAdmin();
  const { data: existing } = await admin.from('store_settings').select('id').limit(1).maybeSingle();
  const row = {
    store_name: checked.store_name,
    support_email: checked.support_email,
    support_phone: checked.support_phone,
    new_order_alert_recipients: checked.new_order_alert_recipients,
    currency: 'Sri Lankan Rupees (LKR — Rs.)',
    updated_at: new Date().toISOString(),
  };
  if (existing) await admin.from('store_settings').update(row).eq('id', existing.id);
  else await admin.from('store_settings').insert(row);

  return ok({ message: 'Store settings saved — the storefront and every order email use these details.' });
}
