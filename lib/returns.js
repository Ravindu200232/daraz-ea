/**
 * Returns: a shopper asks to send an item back from a delivered order; Staff decide, and any refund
 * is handled outside the store.
 */

export function requestableItems(orderItems, existingRequests) {
  const byItem = new Map((existingRequests || []).map((request) => [request.order_item_id, request]));
  return (orderItems || []).map((item) => {
    const request = byItem.get(item.id);
    return {
      ...item,
      state: !request ? 'not_requested' : request.decision === 'pending' ? 'waiting' : 'decided',
      request: request || null,
    };
  });
}

export function canRequestReturn({ orderStatus, item, existingRequest }) {
  if (orderStatus !== 'delivered') {
    return { ok: false, reason: 'not_delivered', message: 'An item can be sent back once the order has arrived.' };
  }
  if (!item) {
    return { ok: false, reason: 'missing_item', message: 'Choose the item you want to return.' };
  }
  if (existingRequest && existingRequest.decision !== 'pending') {
    return {
      ok: false,
      reason: 'decided',
      message: 'That request has already been decided — a decided request cannot be changed.',
    };
  }
  if (existingRequest) {
    return {
      ok: false,
      reason: 'duplicate',
      message: 'That item already has a return request waiting for a decision.',
    };
  }
  return { ok: true };
}

export function decisionSummary(request) {
  if (!request) return null;
  if (request.decision === 'pending') {
    return { label: 'Waiting for a decision', tone: 'warn' };
  }
  return {
    label: request.decision === 'approved' ? 'Approved' : 'Rejected',
    tone: request.decision === 'approved' ? 'ok' : 'danger',
    note: request.decision_note || '',
    decidedAt: request.decided_at,
  };
}
