import { fail, ok, readJson } from '@/lib/api.js';
import { getViewer } from '@/lib/auth.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { ensureGuestId, readGuestId } from '@/lib/guest.js';
import { canAddToCart, capQuantity } from '@/lib/cart.js';

/**
 * The cart, for a guest or a signed-in shopper. The identity comes from the session or the guest
 * cookie — never from the request body — so nobody can change another shopper's cart.
 */
async function ownerFilter() {
  const viewer = await getViewer();
  if (viewer.role === 'shopper') return { column: 'customer_id', value: viewer.user.id, viewer };
  const existing = await readGuestId();
  const guestId = existing || (await ensureGuestId());
  return { column: 'guest_session_id', value: guestId, viewer };
}

export async function POST(request) {
  const body = await readJson(request);
  const action = String(body.action || 'add');
  const { column, value, viewer } = await ownerFilter();
  const admin = supabaseAdmin();

  if (action === 'clear') {
    await admin.from('cart_items').delete().eq(column, value);
    return ok({ message: 'Your cart is empty.', cartCount: 0 });
  }

  if (action === 'add' || action === 'set') {
    const variantId = body.variantId;
    if (!variantId) return fail(422, 'Choose a size and colour first.');
    const { data: variant } = await admin
      .from('product_variants')
      .select('*, products (name, status)')
      .eq('id', variantId)
      .maybeSingle();
    if (!variant || variant.products?.status !== 'shown') return fail(404, 'That product is no longer on the store.');

    const wanted = action === 'add' ? Number(body.quantity || 1) : Number(body.quantity || 0);
    const { data: existing } = await admin
      .from('cart_items')
      .select('*')
      .eq(column, value)
      .eq('product_variant_id', variantId)
      .maybeSingle();
    const nextQuantity = capQuantity(variant.stock_count, (existing?.quantity || 0) + wanted);

    if (action === 'set') {
      const capped = capQuantity(variant.stock_count, wanted);
      if (capped === 0) {
        if (existing) await admin.from('cart_items').delete().eq('id', existing.id);
        return ok({ message: 'That item came out of your cart.' });
      }
      const addCheck = canAddToCart(variant, capped);
      if (!addCheck.ok) return fail(422, addCheck.message);
      await admin.from('cart_items').update({ quantity: capped }).eq('id', existing.id);
      return ok({ message: 'Quantity updated.' });
    }

    const check = canAddToCart(variant, nextQuantity);
    if (!check.ok) {
      return fail(422, check.reason === 'out_of_stock'
        ? `${variant.size} / ${variant.colour} is out of stock and cannot be added to a cart.`
        : `Only ${variant.stock_count} left in ${variant.size} / ${variant.colour}.`);
    }
    if (existing) await admin.from('cart_items').update({ quantity: nextQuantity }).eq('id', existing.id);
    else await admin.from('cart_items').insert({ [column]: value, product_variant_id: variantId, quantity: nextQuantity });

    return ok({
      message: `${variant.products?.name || 'The item'} added to your cart.`,
      redirect: viewer.role === 'shopper' || viewer.role === 'guest' ? undefined : undefined,
    });
  }

  if (action === 'remove') {
    if (!body.variantId) return fail(422, 'Nothing to remove.');
    await admin.from('cart_items').delete().eq(column, value).eq('product_variant_id', body.variantId);
    return ok({ message: 'That item came out of your cart.' });
  }

  return fail(400, 'Unknown cart action.');
}
