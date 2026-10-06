import { fail, ok, readJson, requireShopper } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { isValidPhone } from '@/lib/validation.js';

/** The delivery addresses a shopper keeps and reuses at checkout. */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireShopper();
  if (error) return error;

  const admin = supabaseAdmin();
  const customerId = viewer.user.id;
  const action = String(body.action || 'save');

  if (action === 'delete') {
    await admin.from('delivery_addresses').delete().eq('customer_id', customerId).eq('id', body.id);
    return ok({ message: 'That address was removed.' });
  }

  const label = String(body.label || '').trim();
  const line1 = String(body.address_line_1 || '').trim();
  const city = String(body.city_or_area || '').trim();
  const phone = String(body.phone || '').trim();
  if (!label) return fail(422, 'Give the address a label, like Home or Office.', { field: 'label' });
  if (!line1) return fail(422, 'Enter the first line of the address.', { field: 'address_line_1' });
  if (!city) return fail(422, 'Choose the area or city.', { field: 'city_or_area' });
  if (!isValidPhone(phone)) {
    return fail(422, 'Enter the complete phone number, including the country code.', { field: 'phone' });
  }

  const { data: area } = await admin
    .from('delivery_areas')
    .select('*')
    .eq('name', city)
    .maybeSingle();
  if (!area) return fail(422, 'That area is not one the store delivers to.', { field: 'city_or_area' });

  const row = {
    customer_id: customerId,
    label,
    address_line_1: line1,
    address_line_2: String(body.address_line_2 || '').trim() || null,
    city_or_area: city,
    delivery_area_id: area.id,
    phone,
    is_default: Boolean(body.is_default),
  };

  if (action === 'update' && body.id) {
    await admin.from('delivery_addresses').update(row).eq('id', body.id).eq('customer_id', customerId);
    return ok({ message: 'Address saved.' });
  }

  await admin.from('delivery_addresses').insert(row);
  return ok({ message: 'Address saved — it can now be chosen at checkout.' });
}
