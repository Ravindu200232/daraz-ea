/** Shared vocabulary for the store, in the words the interface uses. */

export const ORDER_STAGES = ['placed', 'confirmed', 'shipped', 'delivered'];

export const STAGE_LABELS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export const PAYMENT_METHODS = {
  card: 'Card',
  wallet: 'Mobile wallet',
  bank_transfer: 'Bank transfer',
  paypal: 'PayPal',
  cod: 'Cash on delivery',
};

export const ONLINE_METHODS = ['card', 'wallet', 'bank_transfer', 'paypal'];

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Not paid',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
};

export const RETURN_REASONS = [
  'Wrong size or fit',
  'Item arrived damaged',
  'Item is not as described',
  'Wrong item was sent',
  'Changed my mind',
  'Item arrived late',
];

export const SMS_CHANNEL_ENABLED = false;

export const CURRENCY_LABEL = 'Sri Lankan Rupees (LKR — Rs.)';

/** The four screens only the Store Owner may open. */
export const OWNER_ONLY_ROUTES = [
  '/admin/delivery-areas',
  '/admin/settings/payments',
  '/admin/settings',
  '/admin/staff',
];

export const STAGE_BADGE = {
  placed: 'info',
  confirmed: 'accent',
  shipped: 'info',
  delivered: 'ok',
};
