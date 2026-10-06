/** Delivery areas: one fixed fee per area or city, and a fee of zero or less is refused. */

export function validateArea({ name, fee, existing = [] }) {
  const label = String(name || '').trim();
  const amount = Number(String(fee ?? '').replace(/[^0-9.]/g, ''));
  if (!label) return { ok: false, reason: 'name', message: 'Enter the area or city name.' };
  if (existing.some((area) => area.name.toLowerCase() === label.toLowerCase())) {
    return { ok: false, reason: 'duplicate', message: `${label} is already a delivery area.` };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'fee', message: 'Enter a fee greater than zero.' };
  }
  return { ok: true, name: label, delivery_fee: amount };
}

export function deliveringAreas(areas) {
  return (areas || []).filter((area) => area.is_active);
}

/** Checkout only ever adds the fee of the area the shopper chose, and never zero. */
export function feeForArea(areas, areaId) {
  const area = (areas || []).find((row) => row.id === areaId && row.is_active);
  return area ? Number(area.delivery_fee) : null;
}
