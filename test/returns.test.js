import { describe, it, expect } from 'vitest';
import { canRequestReturn, requestableItems, decisionSummary } from '@/lib/returns.js';

const item = { id: 'oi-1', product_name: 'Cotton Kurta', variant_label: 'M · Indigo' };

describe('asking to return an item', () => {
  it('refuses a request while the order has not been delivered', () => {
    const verdict = canRequestReturn({ orderStatus: 'shipped', item });
    expect(verdict.ok).toBe(false);
    expect(verdict.message).toContain('once the order has arrived');
  });

  it('accepts a request for an item on a delivered order', () => {
    expect(canRequestReturn({ orderStatus: 'delivered', item }).ok).toBe(true);
  });

  it('refuses a second request for an item that already has one', () => {
    const verdict = canRequestReturn({
      orderStatus: 'delivered',
      item,
      existingRequest: { decision: 'pending' },
    });
    expect(verdict).toMatchObject({ ok: false, reason: 'duplicate' });
  });

  it('refuses to change a request that has already been decided', () => {
    const verdict = canRequestReturn({
      orderStatus: 'delivered',
      item,
      existingRequest: { decision: 'approved' },
    });
    expect(verdict).toMatchObject({ ok: false, reason: 'decided' });
  });

  it('marks each item on the order with its own state', () => {
    const rows = requestableItems(
      [item, { id: 'oi-2' }, { id: 'oi-3' }],
      [
        { order_item_id: 'oi-2', decision: 'pending' },
        { order_item_id: 'oi-3', decision: 'rejected', decision_note: 'No fault found.' },
      ],
    );
    expect(rows.map((row) => row.state)).toEqual(['not_requested', 'waiting', 'decided']);
    expect(decisionSummary({ decision: 'pending' }).label).toBe('Waiting for a decision');
    expect(decisionSummary({ decision: 'rejected' }).tone).toBe('danger');
  });

  it('takes a reason as required and refuses an empty one upstream', () => {
    expect(canRequestReturn({ orderStatus: 'delivered', item: null }).reason).toBe('missing_item');
  });
});
