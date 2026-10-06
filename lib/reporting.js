/** Reporting: the chosen period, the totals it holds, and which products sell best. */

export const PERIODS = ['today', 'last7', 'last30', 'thisMonth', 'custom'];

export function periodRange(period, { now = new Date(), from, to } = {}) {
  const end = new Date(now);
  const start = new Date(now);
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'last7':
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last30':
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      return {
        start: from ? new Date(from).toISOString() : new Date(0).toISOString(),
        end: to ? new Date(`${to}T23:59:59.999Z`).toISOString() : end.toISOString(),
      };
    case 'thisMonth':
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export function inPeriod(isoDate, range) {
  const at = new Date(isoDate).getTime();
  return at >= new Date(range.start).getTime() && at <= new Date(range.end).getTime();
}

/**
 * Best-selling products for the period, from the order lines that actually shipped.
 */
export function bestSellers(orders, items, limit = 5) {
  const orderIds = new Set((orders || []).map((order) => order.id));
  const totals = new Map();
  (items || [])
    .filter((item) => orderIds.has(item.order_id))
    .forEach((item) => {
      const current = totals.get(item.product_id) || { product_id: item.product_id, name: item.product_name, sold: 0, value: 0 };
      current.sold += Number(item.quantity) || 0;
      current.value += Number(item.line_total) || 0;
      totals.set(item.product_id, current);
    });
  const rows = Array.from(totals.values()).sort((a, b) => b.sold - a.sold).slice(0, limit);
  const top = rows[0]?.sold || 1;
  return rows.map((row) => ({ ...row, percent: Math.round((row.sold / top) * 100) }));
}

export function periodLabel(range) {
  const format = (value) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${format(range.start)} – ${format(range.end)}`;
}
