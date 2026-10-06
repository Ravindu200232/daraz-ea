import { lineTotal, round2 } from './money.js';

/** The cart's own rules, kept out of the components so the server can enforce the same ones. */

export function capQuantity(stockCount, requested) {
  const stock = Math.max(0, Number(stockCount) || 0);
  const wanted = Math.max(0, Math.floor(Number(requested) || 0));
  return Math.min(stock, wanted);
}

export function cartSubtotal(lines) {
  return round2(
    (lines || []).reduce(
      (sum, line) => sum + lineTotal(line.unitPrice, line.quantity),
      0,
    ),
  );
}

export function cartPieces(lines) {
  return (lines || []).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
}

/** Refuse checkout with the reason, rather than posting an empty order. */
export function canCheckout(lines) {
  if (!lines || lines.length === 0) {
    return { ok: false, reason: 'empty', message: 'Your cart is empty — add a product and it will be ready to go.' };
  }
  const overStock = lines.find((line) => Number(line.quantity) > Number(line.stockCount ?? line.quantity));
  if (overStock) {
    return {
      ok: false,
      reason: 'stock',
      message: `Only ${overStock.stockCount} left in ${overStock.variantLabel}. Your quantity stayed at ${overStock.stockCount}.`,
    };
  }
  return { ok: true };
}

/** A combination with no stock is shown as out of stock and cannot be added to a cart. */
export function canAddToCart(variant, requestedQuantity = 1) {
  if (!variant) return { ok: false, reason: 'missing', message: 'Choose a size and colour.' };
  if (Number(variant.stock_count) <= 0) {
    return { ok: false, reason: 'out_of_stock', message: 'This size and colour is out of stock.' };
  }
  if (Number(requestedQuantity) > Number(variant.stock_count)) {
    return {
      ok: false,
      reason: 'stock',
      message: `Only ${variant.stock_count} left in this size and colour.`,
    };
  }
  return { ok: true };
}

export function variantLabel(variant) {
  if (!variant) return '';
  const parts = [variant.size, variant.colour].filter(Boolean);
  return parts.join(' · ');
}
