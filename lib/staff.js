import { isValidEmail, isValidPhone } from './validation.js';

/** Staff accounts are added by the Store Owner and are always the Staff role. */

export function validateStaff({ full_name, email, existing = [] }) {
  const name = String(full_name || '').trim();
  const address = String(email || '').trim().toLowerCase();
  if (!name) return { ok: false, reason: 'name', message: 'Enter the full name.' };
  if (!isValidEmail(address)) {
    return { ok: false, reason: 'email', message: 'Enter a full email address.' };
  }
  if (existing.some((member) => String(member.email).toLowerCase() === address)) {
    return { ok: false, reason: 'duplicate', message: 'That email address already belongs to a staff member.' };
  }
  return { ok: true, full_name: name, email: address, role: 'staff' };
}

export function validateCustomer({ full_name, email, phone }) {
  const name = String(full_name || '').trim();
  const address = String(email || '').trim().toLowerCase();
  const number = String(phone || '').trim();
  if (!name) return { ok: false, reason: 'name', message: 'Enter your full name.' };
  if (!isValidEmail(address)) return { ok: false, reason: 'email', message: 'Enter a full email address.' };
  if (!isValidPhone(number)) {
    return { ok: false, reason: 'phone', message: 'Enter the complete phone number, including the country code.' };
  }
  return { ok: true, full_name: name, email: address, phone: number };
}
