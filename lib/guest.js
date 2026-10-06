import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';

/**
 * A guest's cart lives in the database under a random session id held in an httpOnly cookie, so a
 * visitor with no account still keeps a cart between pages — and no shopper can read another
 * guest's cart, because the id is never a guessable value and only the server reads it.
 */

export const GUEST_COOKIE = 'darazea_guest';

export async function readGuestId() {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value || null;
}

export async function ensureGuestId() {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}

export async function signOutGuest() {
  const store = await cookies();
  store.delete(GUEST_COOKIE);
}
