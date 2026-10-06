import { fail, ok, readJson, requireShopper } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { canRequestReturn } from '@/lib/returns.js';
import { RETURN_REASONS } from '@/lib/constants.js';

/** Asking to send an item back from a delivered order. Any refund is handled outside the store. */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireShopper();
  if (error) return error;

  const reason = String(body.reason || '').trim();
  if (!reason) return fail(422, 'Choose why the item is coming back.', { field: 'reason' });
  if (!RETURN_REASONS.includes(reason) && reason.length < 4) {
    return fail(422, 'Choose why the item is coming back.', { field: 'reason' });
  }

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items (*), return_requests (*)')
    .eq('order_number', body.orderNumber)
    .eq('customer_id', viewer.user.id)
    .maybeSingle();
  if (!order) return fail(404, 'That order is not on your account.');

  const item = (order.order_items || []).find((row) => row.id === body.order_item_id);
  const existing = (order.return_requests || []).find((row) => row.order_item_id === body.order_item_id);
  const verdict = canRequestReturn({ orderStatus: order.order_status, item, existingRequest: existing });
  if (!verdict.ok) return fail(422, verdict.message, { field: verdict.reason });

  const { error: insertError } = await admin.from('return_requests').insert({
    order_id: order.id,
    order_item_id: item.id,
    customer_name: order.customer_name,
    reason,
    decision: 'pending',
  });
  if (insertError) return fail(500, insertError.message);

  return ok({
    message: 'Your return request is sent. Your order now shows it as waiting for a decision — any refund is handled outside the store.',
    redirect: `/account/orders/${order.order_number}`,
  });
}
