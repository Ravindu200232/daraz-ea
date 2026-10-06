import { round2 } from './money.js';

/**
 * A coupon code typed at checkout, checked in the order the shopper would expect, and refused with
 * the reason the prototype shows. A refusal never changes the order total.
 */

function coversNothing(coupon, cart) {
  if (coupon.applies_to === 'all') return false;
  if (coupon.applies_to === 'products') {
    return !(cart.productIds || []).some((id) => (coupon.applies_to_products || []).includes(id));
  }
  return !(cart.categoryIds || []).some((id) => (coupon.applies_to_categories || []).includes(id));
}

export function discountFor(coupon, subtotal) {
  const value = Number(coupon.discount_value) || 0;
  const raw = coupon.discount_type === 'percentage' ? (subtotal * value) / 100 : value;
  return round2(Math.min(raw, subtotal));
}

function stamp(date) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function evaluateCoupon({ coupon, subtotal, cart = {}, now = new Date() }) {
  if (!coupon) {
    return { ok: false, reason: 'unknown', message: 'That code is not a valid code.' };
  }
  if (!coupon.is_active) {
    return { ok: false, reason: 'off', message: `${coupon.code} is switched off, so it was not applied.` };
  }
  if (coupon.expires_at) {
    const expiry = new Date(coupon.expires_at);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < new Date(now).setHours(0, 0, 0, 0)) {
      return {
        ok: false,
        reason: 'expired',
        message: `${coupon.code} expired on ${stamp(coupon.expires_at)}, so it was not applied.`,
      };
    }
  }
  if (coupon.max_uses !== null && coupon.max_uses !== undefined && coupon.used_count >= coupon.max_uses) {
    return {
      ok: false,
      reason: 'used_up',
      message: `${coupon.code} has reached its maximum number of uses, so it was not applied.`,
    };
  }
  if (round2(subtotal) < round2(coupon.minimum_order_value)) {
    return {
      ok: false,
      reason: 'minimum',
      message: `${coupon.code} needs an order of Rs ${Number(coupon.minimum_order_value).toLocaleString('en-LK')} or more, so it was not applied.`,
    };
  }
  if (coversNothing(coupon, cart)) {
    return {
      ok: false,
      reason: 'no_match',
      message: `${coupon.code} does not cover anything in your cart, so it was not applied.`,
    };
  }
  return { ok: true, code: coupon.code, discount: discountFor(coupon, subtotal) };
}

/** After an order is recorded: one use, one increment on the coupon. */
export function couponUseRows({ coupon, order, customerId, discount }) {
  if (!coupon) return null;
  return {
    coupon_id: coupon.id,
    order_id: order.id,
    customer_id: customerId || null,
    used_by_label: customerId ? order.customer_name : `Guest · ${order.customer_phone}`,
    discount_given: round2(discount),
  };
}
