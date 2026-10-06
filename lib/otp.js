/**
 * The one-time code every management account needs on top of its password or Google account.
 * Six digits, ten minutes, single use.
 */

export const CODE_TTL_MINUTES = 10;

export function generateCode(random = Math.random) {
  const value = Math.floor(random() * 1_000_000);
  return String(value).padStart(6, '0');
}

export function expiryFrom(now = new Date()) {
  return new Date(new Date(now).getTime() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
}

export function verifyCode({ entered, expected, expiresAt, used = false, now = new Date() }) {
  if (used) {
    return { ok: false, reason: 'used', message: 'That code has already been used. Send a new code and try again.' };
  }
  if (!expiresAt || new Date(expiresAt).getTime() < new Date(now).getTime()) {
    return { ok: false, reason: 'expired', message: 'That code is not correct or has expired. Type the six digits again, or send a new code.' };
  }
  const clean = String(entered || '').replace(/[^0-9]/g, '');
  if (clean.length !== 6 || clean !== String(expected || '')) {
    return { ok: false, reason: 'wrong', message: 'That code is not correct or has expired. Type the six digits again, or send a new code.' };
  }
  return { ok: true };
}

export function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!domain) return String(email || '');
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`;
}
