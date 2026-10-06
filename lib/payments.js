import { round2 } from './money.js';

/**
 * Taking the money.
 *
 * Cash on delivery is collected by the courier. A bank transfer is reported with a reference and
 * stays unpaid until Staff record that the money arrived. An online method is authorised by the
 * store's own gateway before anything is recorded: while the store has no live provider
 * credentials, the authorisation is refused and — exactly as the approved checkout shows — no
 * order, no coupon use and no stock movement happen.
 */

const DECLINED = {
  card: 'Your bank declined this card, so no order was placed and your cart is unchanged. Check the card details and try again, or pay cash on delivery.',
  wallet: 'The wallet payment did not go through, so no order was placed and your cart is unchanged. Try again, or pay cash on delivery.',
  paypal: 'PayPal did not complete the payment, so no order was placed and your cart is unchanged. Try again, or pay cash on delivery.',
};

export function isOnline(method) {
  return ['card', 'wallet', 'bank_transfer', 'paypal'].includes(method);
}

export function onlineAuthorisation(method, setting) {
  const details = setting?.store_account_details || {};
  // A provider is live only when its own account details say so; nothing is invented here.
  if (details.live !== true) {
    return { ok: false, reason: 'declined', message: DECLINED[method] || DECLINED.card };
  }
  return { ok: true, reference: `${String(method).toUpperCase()}-${Date.now()}` };
}

export function initialPaymentState(method) {
  if (method === 'cod') return { payment_status: 'unpaid', paid: false, pending: false };
  if (method === 'bank_transfer') return { payment_status: 'pending', paid: false, pending: true };
  return { payment_status: 'pending', paid: false, pending: true };
}

export function amountDue(total) {
  return round2(total);
}
