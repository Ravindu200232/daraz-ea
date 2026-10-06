import { alertRecipients } from './orders.js';

/**
 * Notifications. The shopper is emailed at every stage of an order; a text message is built in but
 * switched off at launch, so its row is written as not sent. Management is alerted on a new order.
 */

export function newOrderAlert(order, settings) {
  return {
    recipients: alertRecipients(settings),
    subject: `New order ${order.order_number} — Rs ${Number(order.order_total).toLocaleString('en-LK')}`,
    body: `${order.customer_name}, ${order.delivery_area_name} · ${order.payment_method} · waiting on staff to confirm`,
  };
}

export function stageMessage(stage, order) {
  const stageCopy = {
    placed: `We have your order ${order.order_number} and started on it.`,
    confirmed: `Order ${order.order_number} is confirmed and being packed.`,
    shipped: `Order ${order.order_number} has left the store and is on its way.`,
    delivered: `Order ${order.order_number} has been delivered. Thank you for shopping with us.`,
  };
  return {
    to: order.customer_email,
    subject: `DarazEA — order ${order.order_number}: ${stage}`,
    body: stageCopy[stage] || '',
  };
}
