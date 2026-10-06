import { describe, it, expect } from 'vitest';
import { orderTotals, itemsSubtotal, totalsAgree } from '@/lib/pricing.js';

const items = [
  { unitPrice: 3190, quantity: 1 },
  { unitPrice: 1180, quantity: 2 },
];

describe('orderTotals', () => {
  it('adds the fixed delivery fee to the items subtotal', () => {
    const totals = orderTotals({ items, deliveryFee: 350 });
    expect(totals.ok).toBe(true);
    expect(totals.itemsSubtotal).toBe(5550);
    expect(totals.deliveryFee).toBe(350);
    expect(totals.orderTotal).toBe(5900);
  });

  it('takes the coupon discount off the subtotal, never off the delivery fee', () => {
    const totals = orderTotals({ items, deliveryFee: 350, discount: 555 });
    expect(totals.discountAmount).toBe(555);
    expect(totals.orderTotal).toBe(5345);
  });

  it('refuses an order with no delivery fee — delivery is never free', () => {
    const totals = orderTotals({ items, deliveryFee: 0 });
    expect(totals.ok).toBe(false);
    expect(totals.reason).toBe('delivery_required');
  });

  it('never discounts more than the items are worth', () => {
    const totals = orderTotals({ items, deliveryFee: 350, discount: 99999 });
    expect(totals.discountAmount).toBe(5550);
    expect(totals.orderTotal).toBe(350);
  });

  it('keeps the identity every stored order satisfies', () => {
    const totals = orderTotals({ items, deliveryFee: 350, discount: 555 });
    expect(totalsAgree({
      items_subtotal: totals.itemsSubtotal,
      discount_amount: totals.discountAmount,
      delivery_fee: totals.deliveryFee,
      order_total: totals.orderTotal,
    })).toBe(true);
    expect(itemsSubtotal(items)).toBe(5550);
  });
});
