/** The store's own name, support details and who is alerted when an order arrives. */

export const DEFAULT_SETTINGS = {
  store_name: 'DarazEA',
  support_email: 'support@darazea.example',
  support_phone: '+94 77 214 8890',
  new_order_alert_recipients: ['nishadi@darazea.example', 'orders@darazea.example'],
  currency: 'Sri Lankan Rupees (LKR — Rs.)',
};

export function validateStoreSettings({ store_name, support_email, support_phone, recipients }) {
  const name = String(store_name || '').trim();
  const email = String(support_email || '').trim();
  const phone = String(support_phone || '').trim();
  if (!name) return { ok: false, reason: 'name', message: 'Enter the store name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, reason: 'email', message: 'Enter a full email address, for example support@darazea.example.' };
  }
  if (phone.replace(/[^0-9]/g, '').length < 9) {
    return { ok: false, reason: 'phone', message: 'Enter the support phone number, including the country code.' };
  }
  return {
    ok: true,
    store_name: name,
    support_email: email,
    support_phone: phone,
    new_order_alert_recipients: (recipients || []).map((value) => String(value).trim()).filter(Boolean),
  };
}
