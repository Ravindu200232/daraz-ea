import { STAGE_LABELS } from './constants.js';
import { canMoveTo, nextStage } from './validation.js';
import { round2 } from './money.js';

/** Order fulfilment: the stages, who may move an order, and what each stage writes down. */

export { canMoveTo, nextStage };

export function stageLabel(stage) {
  return STAGE_LABELS[stage] || stage;
}

/** An order number in the shape the store uses everywhere: DA-10482. */
export function makeOrderNumber(sequence) {
  return `DA-${10000 + Number(sequence)}`;
}

/**
 * The shopper is emailed at every stage. A text message is built in but switched off at launch, so
 * its row is recorded as not sent instead of being quietly dropped.
 */
export function messagePlan(stage, { email, phone, smsEnabled = false, at = new Date().toISOString() }) {
  const rows = [
    { channel: 'email', sent_to: email, stage, status: 'sent', sent_at: at },
  ];
  if (phone) {
    rows.push({
      channel: 'sms',
      sent_to: phone,
      stage,
      status: smsEnabled ? 'sent' : 'not_sent',
      sent_at: smsEnabled ? at : null,
    });
  }
  return rows;
}

export function alertRecipients(settings) {
  return (settings?.new_order_alert_recipients || []).filter(Boolean);
}

export function salesSummary(orders) {
  return {
    orderCount: orders.length,
    salesTotal: round2(orders.reduce((sum, order) => sum + Number(order.order_total || 0), 0)),
    discountTotal: round2(orders.reduce((sum, order) => sum + Number(order.discount_amount || 0), 0)),
  };
}
