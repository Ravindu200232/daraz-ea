import { OWNER_ONLY_ROUTES } from './constants.js';

/**
 * Who may reach what, as plain functions — the same decision the pages, the API handlers and the
 * Row Level Security policies make, written once so a test can hold it still.
 */

export function mayOpenManagement(role) {
  return role === 'staff' || role === 'store_owner';
}

export function mayOpenOwnerScreens(role) {
  return role === 'store_owner';
}

export function isOwnerOnlyRoute(pathname) {
  return OWNER_ONLY_ROUTES.some((route) => pathname === route || String(pathname).startsWith(`${route}/`));
}

export function mayOpenRoute(role, pathname) {
  if (isOwnerOnlyRoute(pathname)) return mayOpenOwnerScreens(role);
  if (String(pathname).startsWith('/admin')) return mayOpenManagement(role);
  if (String(pathname).startsWith('/account') || String(pathname).endsWith('/review')) return role === 'shopper';
  return true;
}

export function signInRouteFor(pathname) {
  return String(pathname).startsWith('/admin') ? '/admin/login' : '/login';
}
