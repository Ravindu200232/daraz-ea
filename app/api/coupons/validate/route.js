import { fail, ok, readJson } from '@/lib/api.js';
import { getViewer } from '@/lib/auth.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { getCartLines } from '@/lib/queries.js';
import { readGuestId } from '@/lib/guest.js';
import { evaluateCoupon } from '@/lib/coupons.js';

/** Applying a coupon at checkout: the discount, or the reason it was refused. */
export async function POST(request) {
  const body = await readJson(request);
  const viewer = await getViewer();
  const customerId = viewer.role === 'shopper' ? viewer.user.id : null;
  const lines = await getCartLines({ customerId, guestId: customerId ? null : await readGuestId() });
  if (!lines.length) return fail(422, 'Your cart is empty.');

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const admin = supabaseAdmin();
  const { data: coupon } = await admin
    .from('coupons')
    .select('*')
    .ilike('code', String(body.code || '').trim())
    .maybeSingle();

  const productIds = lines.map((line) => line.product?.id).filter(Boolean);
  const { data: products } = await admin
    .from('products')
    .select('id, category_id')
    .in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);

  const verdict = evaluateCoupon({
    coupon,
    subtotal,
    cart: { productIds, categoryIds: (products || []).map((row) => row.category_id) },
  });
  if (!verdict.ok) return fail(422, verdict.message);
  return ok({ message: `${verdict.code} applied — Rs ${verdict.discount.toLocaleString('en-LK')} off this order.`, discount: verdict.discount });
}
