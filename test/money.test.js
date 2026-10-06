import { describe, it, expect } from 'vitest';
import { formatRs, formatRs2, formatLKR, formatLKR2, parseMoney, lineTotal, round2 } from '@/lib/money.js';

/** The store prints Sri Lankan Rupees in three shapes; these are the exact strings the pages contain. */
describe('money', () => {
  it('prints a catalogue price the way the product cards do', () => {
    expect(formatRs(3190)).toBe('Rs 3,190');
    expect(formatRs(2450)).toBe('Rs 2,450');
  });

  it('prints a two-decimal total the way the order pages do', () => {
    expect(formatRs2(4880)).toBe('Rs 4,880.00');
    expect(formatRs2(5250.5)).toBe('Rs 5,250.50');
  });

  it('prints the LKR form the cart and the management side use', () => {
    expect(formatLKR(3450)).toBe('LKR 3,450');
    expect(formatLKR2(3450)).toBe('LKR 3,450.00');
  });

  it('reads a typed amount back as a number', () => {
    expect(parseMoney('3,450.00')).toBe(3450);
    expect(parseMoney('')).toBe(0);
    expect(parseMoney('abc')).toBe(0);
  });

  it('computes a line total and never renders "2 x Rs 22.50"', () => {
    expect(lineTotal(2250, 2)).toBe(4500);
    expect(round2(10.005)).toBe(10.01);
  });
});
