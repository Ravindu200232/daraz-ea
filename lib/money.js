/**
 * Money is formatted in exactly one place.
 *
 * The approved prototype prints Sri Lankan Rupees in three shapes and the application keeps all
 * three: a catalogue price (`Rs 3,190`), a two-decimal total (`Rs 4,880.00`) and the LKR form the
 * cart and the management side use (`LKR 3,450.00`). Two formatters drift; these do not.
 */

const LKR = 'en-LK';

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Rupees with no decimals when the amount is whole, exactly as the product cards print it. */
export function formatRs(value) {
  const amount = round2(value);
  const whole = Number.isInteger(amount);
  return `Rs ${amount.toLocaleString(LKR, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Rupees, always two decimals — the order totals on Order Placed and the management screens. */
export function formatRs2(value) {
  return `Rs ${round2(value).toLocaleString(LKR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatLKR(value) {
  return `LKR ${round2(value).toLocaleString(LKR, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatLKR2(value) {
  return `LKR ${round2(value).toLocaleString(LKR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A numeric input ("3,450.00") read back as a number. */
export function parseMoney(value) {
  const amount = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(amount) ? round2(amount) : 0;
}

/**
 * Kept for the seeded scaffold's own contract: amounts held in cents, formatted for the store.
 */
export function formatPrice(cents) {
  const rupees = (Number(cents) || 0) / 100;
  return `Rs ${rupees.toLocaleString(LKR, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** A line total is computed, never rendered as "2 x Rs 22.50". */
export function lineTotal(unitPrice, quantity) {
  return round2((Number(unitPrice) || 0) * (Number(quantity) || 0));
}

export { round2 };
