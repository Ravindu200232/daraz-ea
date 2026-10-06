import { describe, it, expect } from 'vitest';
import {
  isValidEmail, isValidPhone, isValidMoney, isValidPassword, passwordChecks, canMoveTo, requireFields,
} from '@/lib/validation.js';
import { validateArea } from '@/lib/areas.js';
import { validateStoreSettings } from '@/lib/settings.js';
import { validateStaff, validateCustomer } from '@/lib/staff.js';
import { validateReview } from '@/lib/reviews.js';
import { verifyCode } from '@/lib/otp.js';

describe('the validation the forms and the API share', () => {
  it('refuses a half-typed email address and accepts a full one', () => {
    expect(isValidEmail('nimali.perera@')).toBe(false);
    expect(isValidEmail('nimali.perera@example.com')).toBe(true);
  });

  it('refuses a phone number that is too short', () => {
    expect(isValidPhone('+94 77 512')).toBe(false);
    expect(isValidPhone('077 214 6603')).toBe(true);
  });

  it('refuses a price of zero or less', () => {
    expect(isValidMoney('0')).toBe(false);
    expect(isValidMoney('1,590.00')).toBe(true);
  });

  it('holds the sign-up password rule and the softer reset rule apart', () => {
    expect(isValidPassword('priya1987', 'register')).toBe(false);
    expect(passwordChecks('priya1987', 'register').filter((rule) => !rule.ok).map((rule) => rule.key)).toEqual(['capital', 'symbol']);
    expect(isValidPassword('Demo!2026', 'register')).toBe(true);
    expect(isValidPassword('priya1987', 'reset')).toBe(true);
  });

  it('refuses a missing field by name', () => {
    expect(requireFields({ a: 'x' }, ['a', 'b'])).toMatchObject({ ok: false, missing: ['b'] });
  });

  it('refuses a stage that skips one', () => {
    expect(canMoveTo('placed', 'shipped')).toBe(false);
  });
});

describe('the rules each management form enforces', () => {
  it('refuses a duplicate delivery area and a fee of zero', () => {
    expect(validateArea({ name: 'Colombo 03', fee: 250, existing: [{ name: 'Colombo 03' }] })).toMatchObject({ ok: false, reason: 'duplicate' });
    expect(validateArea({ name: 'Galle', fee: 0 })).toMatchObject({ ok: false, reason: 'fee' });
    expect(validateArea({ name: 'Galle', fee: 400 }).delivery_fee).toBe(400);
  });

  it('refuses a support email that is not a full address', () => {
    const verdict = validateStoreSettings({ store_name: 'DarazEA', support_email: 'support@darazea', support_phone: '+94 77 214 8890' });
    expect(verdict).toMatchObject({ ok: false, reason: 'email' });
  });

  it('refuses a staff email address that is already on an account', () => {
    expect(validateStaff({ full_name: 'Ayesha', email: 'ayesha@darazea.example', existing: [{ email: 'ayesha@darazea.example' }] }))
      .toMatchObject({ ok: false, reason: 'duplicate' });
  });

  it('refuses a shopper sign-up with a short phone number', () => {
    expect(validateCustomer({ full_name: 'Priya', email: 'priya@example.com', phone: '+94 77 512' })).toMatchObject({ ok: false, reason: 'phone' });
  });

  it('refuses a review outside 1 to 5 and an empty review', () => {
    expect(validateReview({ rating: 6, text: 'nice' })).toMatchObject({ ok: false, reason: 'rating' });
    expect(validateReview({ rating: 4, text: '   ' })).toMatchObject({ ok: false, reason: 'text' });
    expect(validateReview({ rating: 4, text: 'Good cotton.' }).ok).toBe(true);
  });

  it('refuses a wrong, expired or already-used one-time code', () => {
    const now = new Date('2026-05-20T10:00:00Z');
    const future = '2026-05-20T10:05:00Z';
    expect(verifyCode({ entered: '000000', expected: '471920', expiresAt: future, now }).ok).toBe(false);
    expect(verifyCode({ entered: '471920', expected: '471920', expiresAt: '2026-05-20T09:00:00Z', now }).reason).toBe('expired');
    expect(verifyCode({ entered: '471920', expected: '471920', expiresAt: future, used: true, now }).reason).toBe('used');
    expect(verifyCode({ entered: '471 920', expected: '471920', expiresAt: future, now }).ok).toBe(true);
  });
});
