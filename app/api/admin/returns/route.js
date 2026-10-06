import { fail, ok, readJson, requireManagement } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';

/** Deciding a return request. Any refund is handled outside the store. */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireManagement();
  if (error) return error;

  const decision = String(body.decision || '').toLowerCase();
  if (!['approved', 'rejected'].includes(decision)) {
    return fail(422, 'Record a decision of approved or rejected.', { field: 'decision' });
  }

  const admin = supabaseAdmin();
  const { data: request_ } = await admin
    .from('return_requests')
    .select('*, orders (order_number, status:order_status, customer_id)')
    .eq('id', body.id)
    .maybeSingle();
  if (!request_) return fail(404, 'That return request is not on the list.');
  if (request_.decision !== 'pending') {
    return fail(409, 'That request has already been decided — a decided request cannot be changed.');
  }

  const note = String(body.decision_note || '').trim();
  await admin
    .from('return_requests')
    .update({
      decision,
      decision_note: note || null,
      decided_by: viewer.staff?.id || null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', request_.id);

  return ok({
    message: `The request is ${decision}. The shopper sees the decision and your note on order ${request_.orders?.order_number}. Any refund is handled outside the store.`,
  });
}
