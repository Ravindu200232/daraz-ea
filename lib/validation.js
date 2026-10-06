import { ORDER_STAGES } from './constants.js';

/** Validation the forms and the API handlers share, so both refuse the same input. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL.test(String(value || '').trim());
}

/** A Sri Lankan mobile or landline number: at least nine digits once punctuation is dropped. */
export function isValidPhone(value) {
  return String(value || '').replace(/[^0-9]/g, '').length >= 9;
}

export function isValidMoney(value) {
  const amount = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0;
}

const REGISTER_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'number', label: 'At least one number', test: (v) => /[0-9]/.test(v) },
  { key: 'capital', label: 'At least one capital letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'symbol', label: 'At least one symbol, for example ! ? #', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const RESET_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'letter', label: 'At least one letter', test: (v) => /[A-Za-z]/.test(v) },
  { key: 'digit', label: 'At least one digit', test: (v) => /[0-9]/.test(v) },
];

export function passwordRules(level = 'register') {
  return level === 'reset' ? RESET_RULES : REGISTER_RULES;
}

/** Every rule with its own result, for the checklist the sign-up form shows. */
export function passwordChecks(value, level = 'register') {
  const v = String(value || '');
  return passwordRules(level).map((rule) => ({ key: rule.key, label: rule.label, ok: rule.test(v) }));
}

export function isValidPassword(value, level = 'register') {
  return passwordChecks(value, level).every((rule) => rule.ok);
}

export function isStage(value) {
  return ORDER_STAGES.includes(value);
}

/** The next stage an order may move to, or null when it is already delivered. */
export function nextStage(current) {
  const index = ORDER_STAGES.indexOf(current);
  if (index === -1 || index === ORDER_STAGES.length - 1) return null;
  return ORDER_STAGES[index + 1];
}

/** Only the stage straight after the current one is allowed — no skipping. */
export function canMoveTo(current, target) {
  return nextStage(current) === target;
}

export function requireFields(values, fields) {
  const missing = fields.filter((field) => {
    const value = values?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  return { ok: missing.length === 0, missing };
}
