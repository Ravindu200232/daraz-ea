import { NextResponse } from 'next/server';
import { getViewer } from './auth.js';

/** Small helpers every route handler shares, so refusal looks the same everywhere. */

export function ok(body = {}) {
  return NextResponse.json({ ok: true, ...body });
}

export function fail(status, message, extra = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export function readJson(request) {
  return request.json().catch(() => ({}));
}

/** Management only: Staff and Store Owner. A shopper or a guest is refused with 403. */
export async function requireManagement() {
  const viewer = await getViewer();
  if (viewer.role === 'guest') return { error: fail(401, 'Sign in at the management sign-in first.') };
  if (viewer.role !== 'staff' && viewer.role !== 'store_owner') {
    return { error: fail(403, 'This is the management side of the store.') };
  }
  return { viewer };
}

/** The four owner-only screens and everything behind them. */
export async function requireOwner() {
  const result = await requireManagement();
  if (result.error) return result;
  if (result.viewer.role !== 'store_owner') {
    return { error: fail(403, 'Only the Store Owner may change delivery fees, payments, store settings or staff accounts.') };
  }
  return result;
}

/** A signed-in shopper, for the pages and actions that belong to one account. */
export async function requireShopper() {
  const viewer = await getViewer();
  if (viewer.role !== 'shopper') {
    return { error: fail(viewer.role === 'guest' ? 401 : 403, 'Sign in to your shopper account to do that.') };
  }
  return { viewer };
}
