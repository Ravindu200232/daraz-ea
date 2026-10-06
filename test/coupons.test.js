import { describe, it, expect } from 'vitest';
import { evaluateCoupon } from '@/lib/coupons.js';

const base = {
  code: 'DAZ10',
  discount_type: 'percentage',
  discount_value: 10,
  minimum_order_value: 0,
  max_uses: null,
  used_count: 0,
  expires_at: null,
  applies_to: 'all',
  applies_to_products: [],
  applies_to_categories: [],
  is_active: true,
};

const now = new Date('2026-05-20T10:00:00Z');

describe('evaluateCoupon', () => {
  it('takes a percentage off the items subtotal', () => {
    const verdict = evaluateCoupon({ coupon: base, subtotal: 5200, now });
    expect(verdict.ok).toBe(true);
    expect(verdict.discount).toBe(520);
  });

  it('takes a fixed amount off, never more than the cart holds', () => {
    const verdict = evaluateCoupon({ coupon: { ...base, discount_type: 'fixed', discount_value: 750 }, subtotal: 600, now });
    expect(verdict.discount).toBe(600);
  });

  it('refuses a code it does not know', () => {
    const verdict = evaluateCoupon({ coupon: null, subtotal: 5200, now });
    expect(verdict).toMatchObject({ ok: false, reason: 'unknown' });
  });

  it('refuses a switched-off code', () => {
    const verdict = evaluateCoupon({ coupon: { ...base, is_active: false }, subtotal: 5200, now });
    expect(verdict).toMatchObject({ ok: false, reason: 'off' });
    expect(verdict.message).toContain('switched off');
  });

  it('refuses an expired code and says when it ran out', () => {
    const verdict = evaluateCoupon({ coupon: { ...base, expires_at: '2025-04-30' }, subtotal: 5200, now });
    expect(verdict).toMatchObject({ ok: false, reason: 'expired' });
    expect(verdict.message).toContain('30 April 2025');
  });

  it('refuses a code past its use limit', () => {
    const verdict = evaluateCoupon({ coupon: { ...base, max_uses: 100, used_count: 100 }, subtotal: 5200, now });
    expect(verdict).toMatchObject({ ok: false, reason: 'used_up' });
  });

  it('refuses a cart below the minimum order value', () => {
    const verdict = evaluateCoupon({ coupon: { ...base, minimum_order_value: 5000 }, subtotal: 2400, now });
    expect(verdict).toMatchObject({ ok: false, reason: 'minimum' });
  });

  it('refuses a code that covers nothing in the cart', () => {
    const coupon = { ...base, applies_to: 'categories', applies_to_categories: ['cat-home'] };
    const verdict = evaluateCoupon({ coupon, subtotal: 5200, cart: { categoryIds: ['cat-fashion'] }, now });
    expect(verdict).toMatchObject({ ok: false, reason: 'no_match' });
  });

  it('accepts a code that covers a chosen category in the cart', () => {
    const coupon = { ...base, applies_to: 'categories', applies_to_categories: ['cat-fashion'] };
    const verdict = evaluateCoupon({ coupon, subtotal: 5200, cart: { categoryIds: ['cat-fashion'] }, now });
    expect(verdict.ok).toBe(true);
  });
});
