import { describe, it, expect } from 'vitest';
import { nextStage, canMoveTo, messagePlan, makeOrderNumber, stageLabel } from '@/lib/orders.js';

describe('order stages', () => {
  it('moves one stage at a time, in order', () => {
    expect(nextStage('placed')).toBe('confirmed');
    expect(nextStage('confirmed')).toBe('shipped');
    expect(nextStage('shipped')).toBe('delivered');
    expect(nextStage('delivered')).toBeNull();
  });

  it('refuses a stage that skips one', () => {
    expect(canMoveTo('placed', 'confirmed')).toBe(true);
    expect(canMoveTo('placed', 'shipped')).toBe(false);
    expect(canMoveTo('confirmed', 'delivered')).toBe(false);
    expect(canMoveTo('delivered', 'delivered')).toBe(false);
  });

  it('labels the stages the interface shows', () => {
    expect(stageLabel('placed')).toBe('Placed');
    expect(stageLabel('delivered')).toBe('Delivered');
  });

  it('numbers orders in the shape the store uses', () => {
    expect(makeOrderNumber(1)).toBe('DA-10001');
    expect(makeOrderNumber(482)).toBe('DA-10482');
  });
});

describe('order messages', () => {
  it('emails the shopper at the stage and records the text message as not sent', () => {
    const rows = messagePlan('confirmed', { email: 'shopper@example.com', phone: '077 214 5580' });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ channel: 'email', sent_to: 'shopper@example.com', stage: 'confirmed', status: 'sent' });
    expect(rows[1]).toMatchObject({ channel: 'sms', status: 'not_sent', sent_at: null });
  });

  it('sends the text message once that channel is switched on', () => {
    const rows = messagePlan('shipped', { email: 'shopper@example.com', phone: '077 214 5580', smsEnabled: true });
    expect(rows[1].status).toBe('sent');
  });
});
