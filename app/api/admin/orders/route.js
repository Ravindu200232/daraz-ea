import { fail, ok, readJson, requireManagement } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { canMoveTo } from '@/lib/validation.js';
import { messagePlan, stageLabel } from '@/lib/orders.js';
import { parseMoney } from '@/lib/money.js';

/**
 * Working an order: confirm, ship, deliver — one stage at a time, no skipping — and recording the
 * money for a bank transfer or a cash on delivery parcel.
 */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireManagement();
  if (error) return error;

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from('orders')
    .select('*')
    .eq('id', body.id)
    .maybeSingle();
  if (!order) return fail(404, 'That order is not on the list.');

  const action = String(body.action || '');

  if (['confirm', 'ship', 'deliver'].includes(action)) {
    const target = { confirm: 'confirmed', ship: 'shipped', deliver: 'delivered' }[action];
    if (!canMoveTo(order.order_status, target)) {
      return fail(409, `Order ${order.order_number} is at ${stageLabel(order.order_status)} — it cannot move to ${stageLabel(target)} from there.`);
    }
    if (target === 'confirmed' && order.payment_method === 'bank_transfer' && order.payment_status !== 'paid') {
      return fail(409, 'Record the money for this bank transfer first — the order moves to confirmed once the money has arrived.');
    }

    const at = new Date().toISOString();
    await admin.from('orders').update({ order_status: target }).eq('id', order.id);
    await admin.from('order_status_changes').insert({
      order_id: order.id,
      status: target,
      changed_at: at,
      changed_by: viewer.staff?.id || null,
      changed_by_name: `${viewer.staff?.full_name || 'Management'} (${viewer.role === 'store_owner' ? 'Store Owner' : 'Staff'})`,
    });
    await admin.from('order_messages').insert(
      messagePlan(target, { email: order.customer_email, phone: order.customer_phone, at }).map((row) => ({ ...row, order_id: order.id })),
    );

    return ok({
      message: `Order ${order.order_number} is ${stageLabel(target)}. ${order.customer_name} has the ${stageLabel(target).toLowerCase()} email.`,
    });
  }

  if (action === 'record-payment') {
    const status = String(body.payment_status || '').split(' — ')[0].trim();
    const received = status === 'Money received' || status === 'Cash collected';
    const patch = {
      status: received ? 'paid' : 'failed',
      recorded_by: viewer.staff?.id || null,
      paid_at: received ? new Date().toISOString() : null,
    };
    if (order.payment_method === 'bank_transfer') {
      const reference = String(body.reference_number || '').trim();
      if (received && !reference) {
        return fail(422, 'Enter the reference from the bank slip so the transfer can be matched.', { field: 'reference_number' });
      }
      patch.reference_number = reference || null;
    }
    if (body.bank_transfer_proof_url) patch.bank_transfer_proof_url = body.bank_transfer_proof_url;
    if (body.amount !== undefined && body.amount !== '') {
      const amount = parseMoney(body.amount);
      if (!(amount > 0)) return fail(422, 'Enter the amount received.', { field: 'amount' });
      patch.amount = amount;
    }

    await admin.from('payments').update(patch).eq('order_id', order.id);
    await admin.from('orders').update({ payment_status: patch.status }).eq('id', order.id);

    return ok({
      message: received
        ? `The money for ${order.order_number} is recorded — the order can move on now.`
        : `The payment on ${order.order_number} is recorded as failed.`,
    });
  }

  return fail(400, 'Unknown order action.');
}
