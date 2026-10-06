import { fail, ok, readJson, requireManagement } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { parseMoney } from '@/lib/money.js';

/** Discount codes: a percentage or a fixed amount, with limits, expiry and what they cover. */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireManagement();
  if (error) return error;
  const admin = supabaseAdmin();
  const action = String(body.action || 'save');

  if (action === 'toggle') {
    const active = Boolean(body.is_active);
    await admin.from('coupons').update({ is_active: active }).eq('id', body.id);
    return ok({ message: active ? 'The code is live again.' : 'The code is switched off — shoppers cannot use it at checkout.' });
  }

  const code = String(body.code || '').trim().toUpperCase();
  if (!code) return fail(422, 'Enter the coupon code.', { field: 'code' });
  const type = body.discount_type === 'fixed' ? 'fixed' : 'percentage';
  const value = parseMoney(body.discount_value);
  if (!(value > 0)) return fail(422, 'Enter a discount value above zero.', { field: 'discount_value' });
  if (type === 'percentage' && value > 100) return fail(422, 'A percentage is above 0 and no higher than 100.', { field: 'discount_value' });

  const appliesTo = ['all', 'products', 'categories'].includes(body.applies_to) ? body.applies_to : 'all';
  const row = {
    code,
    discount_type: type,
    discount_value: value,
    minimum_order_value: parseMoney(body.minimum_order_value),
    expires_at: String(body.expires_at || '').trim() || null,
    max_uses: String(body.max_uses || '').trim() ? Number(body.max_uses) : null,
    applies_to: appliesTo,
    applies_to_products: appliesTo === 'products' ? (body.applies_to_products || []) : [],
    applies_to_categories: appliesTo === 'categories' ? (body.applies_to_categories || []) : [],
    is_active: body.is_active === undefined ? true : Boolean(body.is_active),
  };

  if (body.id) {
    await admin.from('coupons').update(row).eq('id', body.id);
    return ok({ message: `${code} is saved — the changes are live on the store now.` });
  }

  const { data: clash } = await admin.from('coupons').select('id').ilike('code', code).maybeSingle();
  if (clash) {
    return fail(409, `That code is already in use. Codes have to be unique — type a different one.`, { field: 'code' });
  }
  const { error: insertError } = await admin.from('coupons').insert(row);
  if (insertError) return fail(500, insertError.message);
  return ok({ message: `${code} is saved. Shoppers can type it at checkout now.`, redirect: '/admin/coupons' });
}
