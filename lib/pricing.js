import { lineTotal, round2 } from './money.js';

/**
 * The one place an order total is worked out.
 *
 * Items subtotal minus the coupon discount plus the fixed delivery fee of the chosen area — and
 * delivery is never free, so a missing or zero fee refuses the order instead of quietly posting it.
 */

export function itemsSubtotal(items) {
  return round2(
    (items || []).reduce((sum, item) => sum + lineTotal(item.unitPrice, item.quantity), 0),
  );
}

export function orderTotals({ items, deliveryFee, discount = 0 }) {
  const subtotal = itemsSubtotal(items);
  const fee = round2(deliveryFee);
  if (!(fee > 0)) {
    return { ok: false, reason: 'delivery_required', message: 'Choose your area or city so the delivery fee can be added.' };
  }
  const appliedDiscount = Math.min(round2(discount), subtotal);
  return {
    ok: true,
    itemsSubtotal: subtotal,
    discountAmount: appliedDiscount,
    deliveryFee: fee,
    orderTotal: round2(subtotal - appliedDiscount + fee),
  };
}

/** Every order the store keeps satisfies this; a mismatch is a real defect, not a display quirk. */
export function totalsAgree(order) {
  return round2(
    round2(order.items_subtotal) - round2(order.discount_amount) + round2(order.delivery_fee),
  ) === round2(order.order_total);
}
