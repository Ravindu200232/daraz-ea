import { fail, ok, readJson } from '@/lib/api.js';
import { getViewer } from '@/lib/auth.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { getCartLines } from '@/lib/queries.js';
import { canCheckout } from '@/lib/cart.js';
import { evaluateCoupon } from '@/lib/coupons.js';
import { orderTotals } from '@/lib/pricing.js';
import { validateCustomer } from '@/lib/staff.js';
import { messagePlan } from '@/lib/orders.js';
import { initialPaymentState, isOnline, onlineAuthorisation } from '@/lib/payments.js';

/** The next order number: DA-10001, DA-10002, … */
async function nextOrderNumber(admin) {
  const { data } = await admin
    .from('orders')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = Number(String(data?.order_number || 'DA-10000').replace(/[^0-9]/g, '')) || 10000;
  return `DA-${last + 1}`;
}

/**
 * Place the order. Every rule the specification names is enforced here on the server: stock,
 * the area's fixed fee, the coupon, and the payment outcome.
 */
export async function POST(request) {
  const body = await readJson(request);
  const viewer = await getViewer();
  const customerId = viewer.role === 'shopper' ? viewer.user.id : null;
  const admin = supabaseAdmin();

  const lines = await getCartLines({
    customerId,
    guestId: customerId ? null : (await (await import('@/lib/guest.js')).readGuestId()),
  });
  const cartCheck = canCheckout(lines);
  if (!cartCheck.ok) return fail(422, cartCheck.message, { field: 'cart' });

  const customer = validateCustomer({
    full_name: body.full_name,
    email: body.email,
    phone: body.phone,
  });
  if (!customer.ok) return fail(422, customer.message, { field: customer.reason });

  const addressLines = [body.address_line_1, body.address_line_2].filter((line) => String(line || '').trim());
  if (!addressLines.length) return fail(422, 'Enter the delivery address.', { field: 'address' });

  const { data: area } = await admin
    .from('delivery_areas')
    .select('*')
    .eq('id', body.delivery_area_id)
    .eq('is_active', true)
    .maybeSingle();
  if (!area) return fail(422, 'Choose the area or city the order goes to — delivery is charged for it.', { field: 'area' });

  const items = lines.map((line) => ({ unitPrice: line.unitPrice, quantity: line.quantity }));
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let coupon = null;
  if (String(body.coupon_code || '').trim()) {
    const { data: found } = await admin
      .from('coupons')
      .select('*')
      .ilike('code', String(body.coupon_code).trim())
      .maybeSingle();
    const productIds = lines.map((line) => line.product?.id).filter(Boolean);
    const { data: products } = await admin
      .from('products')
      .select('id, category_id')
      .in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);
    const verdict = evaluateCoupon({
      coupon: found,
      subtotal,
      cart: {
        productIds,
        categoryIds: (products || []).map((row) => row.category_id),
      },
    });
    if (!verdict.ok) return fail(422, verdict.message, { field: 'coupon' });
    coupon = { row: found, discount: verdict.discount };
  }

  const totals = orderTotals({ items, deliveryFee: area.delivery_fee, discount: coupon?.discount || 0 });
  if (!totals.ok) return fail(422, totals.message, { field: 'area' });

  const method = String(body.payment_method || 'cod');
  const { data: setting } = await admin
    .from('payment_method_settings')
    .select('*')
    .eq('method', method)
    .maybeSingle();
  if (method !== 'cod' && !setting?.is_enabled) {
    return fail(422, 'That way of paying is not switched on at this store.', { field: 'payment' });
  }

  let reference = null;
  if (isOnline(method) && method !== 'bank_transfer') {
    const authorisation = onlineAuthorisation(method, setting);
    if (!authorisation.ok) {
      // Nothing is recorded: no order, no coupon use, no stock movement.
      return fail(402, authorisation.message, { field: 'payment' });
    }
    reference = authorisation.reference;
  }

  const orderNumber = await nextOrderNumber(admin);
  const state = initialPaymentState(method);
  const placedAt = new Date().toISOString();

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber,
      placed_at: placedAt,
      customer_id: customerId,
      is_guest_order: !customerId,
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      delivery_address: addressLines.join(', '),
      delivery_area_id: area.id,
      delivery_area_name: area.name,
      delivery_fee: area.delivery_fee,
      items_subtotal: totals.itemsSubtotal,
      coupon_id: coupon?.row.id || null,
      coupon_code: coupon?.row.code || null,
      discount_amount: totals.discountAmount,
      order_total: totals.orderTotal,
      payment_method: method,
      payment_status: state.payment_status,
      order_status: 'placed',
      delivery_instructions: String(body.delivery_instructions || '').trim() || null,
    })
    .select()
    .single();
  if (orderError) return fail(500, orderError.message);

  await admin.from('order_items').insert(lines.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    product_variant_id: line.variantId,
    variant_label: line.variantLabel,
    product_name: line.product.name,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    line_total: line.unitPrice * line.quantity,
  })));

  await admin.from('payments').insert({
    order_id: order.id,
    method,
    amount: totals.orderTotal,
    status: state.payment_status,
    reference_number: reference || (method === 'bank_transfer' ? `BT-${orderNumber.replace(/\D/g, '')}` : null),
    paid_at: state.paid ? placedAt : null,
  });

  await admin.from('order_status_changes').insert({
    order_id: order.id,
    status: 'placed',
    changed_at: placedAt,
    changed_by_name: 'Recorded when the order was placed',
  });

  await admin.from('order_messages').insert(
    messagePlan('placed', { email: customer.email, phone: customer.phone }).map((row) => ({ ...row, order_id: order.id })),
  );

  if (coupon) {
    await admin.from('coupon_uses').insert({
      coupon_id: coupon.row.id,
      order_id: order.id,
      customer_id: customerId,
      used_by_label: customerId ? customer.full_name : `Guest · ${customer.phone}`,
      discount_given: totals.discountAmount,
      used_at: placedAt,
    });
    await admin
      .from('coupons')
      .update({ used_count: Number(coupon.row.used_count || 0) + 1 })
      .eq('id', coupon.row.id);
  }

  // Stock comes off the moment the order is recorded.
  for (const line of lines) {
    await admin
      .from('product_variants')
      .update({ stock_count: Math.max(0, Number(line.stockCount) - Number(line.quantity)) })
      .eq('id', line.variantId);
  }

  if (customerId) await admin.from('cart_items').delete().eq('customer_id', customerId);
  else {
    const guestId = await (await import('@/lib/guest.js')).readGuestId();
    if (guestId) await admin.from('cart_items').delete().eq('guest_session_id', guestId);
  }

  return ok({
    message: method === 'bank_transfer'
      ? 'Your order is recorded. Transfer the total to the store account and reply with the reference — it is sent on as soon as the money arrives.'
      : 'Your order is placed.',
    orderNumber,
    redirect: `/order/${orderNumber}/placed`,
  });
}
