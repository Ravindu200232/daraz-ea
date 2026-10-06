import { fail, ok, readJson } from '@/lib/api.js';
import { requireShopper } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { canAddToCart } from '@/lib/cart.js';

/** Saving a product for later, moving it into the cart, and taking it off again. */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireShopper();
  if (error) return error;

  const admin = supabaseAdmin();
  const customerId = viewer.user.id;
  const action = String(body.action || 'add');

  if (action === 'add') {
    if (!body.productId) return fail(422, 'Choose a product first.');
    const { data: existing } = await admin
      .from('wishlist_items')
      .select('id')
      .eq('customer_id', customerId)
      .eq('product_id', body.productId)
      .maybeSingle();
    if (existing) return fail(409, 'That product is already on your wishlist — it was not saved a second time.');
    await admin.from('wishlist_items').insert({ customer_id: customerId, product_id: body.productId });
    return ok({ message: 'Saved to your wishlist.' });
  }

  if (action === 'remove') {
    await admin.from('wishlist_items').delete().eq('customer_id', customerId).eq('product_id', body.productId);
    return ok({ message: 'That product came off your wishlist.' });
  }

  if (action === 'move') {
    // The picker sends the chosen combination; a product with one combination, or a picker that
    // sent nothing, falls back to the first combination that still has stock.
    let variant = null;
    if (body.variantId) {
      const { data } = await admin.from('product_variants').select('*').eq('id', body.variantId).maybeSingle();
      variant = data;
    }
    if (!variant && body.productId) {
      const { data } = await admin
        .from('product_variants')
        .select('*')
        .eq('product_id', body.productId)
        .gt('stock_count', 0)
        .limit(1)
        .maybeSingle();
      variant = data;
    }
    if (!variant) return fail(404, 'That size and colour is no longer sold.');
    const check = canAddToCart(variant, 1);
    if (!check.ok) return fail(422, check.message);
    const { data: line } = await admin
      .from('cart_items')
      .select('*')
      .eq('customer_id', customerId)
      .eq('product_variant_id', variant.id)
      .maybeSingle();
    if (line) await admin.from('cart_items').update({ quantity: line.quantity + 1 }).eq('id', line.id);
    else await admin.from('cart_items').insert({ customer_id: customerId, product_variant_id: variant.id, quantity: 1 });
    await admin.from('wishlist_items').delete().eq('customer_id', customerId).eq('product_id', variant.product_id);
    return ok({ message: 'Moved into your cart.', redirect: '/cart' });
  }

  return fail(400, 'Unknown wishlist action.');
}
