import { describe, it, expect } from 'vitest';
import { canAddToCart, canCheckout, capQuantity, cartSubtotal, cartPieces } from '@/lib/cart.js';

describe('the cart and its own rules', () => {
  it('caps a quantity at the stock of the chosen combination', () => {
    expect(capQuantity(3, 5)).toBe(3);
    expect(capQuantity(0, 4)).toBe(0);
    expect(capQuantity(9, 2)).toBe(2);
  });

  it('refuses to add a combination with no stock', () => {
    const verdict = canAddToCart({ stock_count: 0, size: 'L', colour: 'Navy' }, 1);
    expect(verdict.ok).toBe(false);
    expect(verdict.message).toContain('out of stock');
  });

  it('allows an in-stock combination and refuses one more than the stock left', () => {
    expect(canAddToCart({ stock_count: 2, size: 'M', colour: 'Navy' }, 2).ok).toBe(true);
    const tooMany = canAddToCart({ stock_count: 2, size: 'M', colour: 'Navy' }, 3);
    expect(tooMany.ok).toBe(false);
    expect(tooMany.message).toContain('Only 2 left');
  });

  it('refuses checkout with an empty cart and explains why', () => {
    const verdict = canCheckout([]);
    expect(verdict.ok).toBe(false);
    expect(verdict.message).toContain('empty');
  });

  it('refuses checkout when a line is above the stock left', () => {
    const verdict = canCheckout([{ quantity: 4, stockCount: 3, variantLabel: 'Size 42 / Slate Grey' }]);
    expect(verdict.ok).toBe(false);
    expect(verdict.message).toContain('Only 3 left');
  });

  it('adds the lines up for the subtotal and the piece count', () => {
    const lines = [
      { unitPrice: 3450, quantity: 2 },
      { unitPrice: 1890, quantity: 1 },
    ];
    expect(cartSubtotal(lines)).toBe(8790);
    expect(cartPieces(lines)).toBe(3);
  });
});
