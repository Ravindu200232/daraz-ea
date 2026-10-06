import { fail, ok, readJson, requireOwner } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { parseMoney } from '@/lib/money.js';
import { validateArea } from '@/lib/areas.js';

/** Delivery fees: one fixed fee per area or city, set by the Store Owner. */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireOwner();
  if (error) return error;
  const admin = supabaseAdmin();
  const action = String(body.action || 'save');

  const { data: areas } = await admin.from('delivery_areas').select('*');

  if (action === 'toggle') {
    const area = (areas || []).find((row) => row.id === body.id);
    if (!area) return fail(404, 'That area is not on the list.');
    const active = !area.is_active;
    await admin.from('delivery_areas').update({ is_active: active }).eq('id', area.id);
    return ok({ message: active ? `${area.name} is delivering again.` : `${area.name} is switched off — shoppers are not offered it.` });
  }

  const checked = validateArea({
    name: body.name,
    fee: body.delivery_fee,
    existing: (areas || []).filter((row) => row.id !== body.id),
  });
  if (!checked.ok) return fail(checked.reason === 'duplicate' ? 409 : 422, checked.message, { field: checked.reason });

  if (body.id) {
    await admin.from('delivery_areas').update({ name: checked.name, delivery_fee: checked.delivery_fee }).eq('id', body.id);
    return ok({ message: `${checked.name} is now Rs ${checked.delivery_fee} per order — that is the fee shoppers there pay at checkout.` });
  }

  const { error: insertError } = await admin
    .from('delivery_areas')
    .insert({ name: checked.name, delivery_fee: checked.delivery_fee, is_active: true });
  if (insertError) return fail(500, insertError.message);
  return ok({ message: `${checked.name} is added at Rs ${checked.delivery_fee} and starts delivering straight away.` });
}

export async function PATCH(request) {
  const body = await readJson(request);
  const { error } = await requireOwner();
  if (error) return error;
  const fee = parseMoney(body.delivery_fee);
  if (!(fee > 0)) return fail(422, 'Enter a fee greater than zero.', { field: 'delivery_fee' });
  const admin = supabaseAdmin();
  await admin.from('delivery_areas').update({ delivery_fee: fee }).eq('id', body.id);
  return ok({ message: 'Delivery fee saved.' });
}
