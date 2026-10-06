import { describe, it, expect } from 'vitest';
import { mayOpenManagement, mayOpenOwnerScreens, mayOpenRoute, isOwnerOnlyRoute, signInRouteFor } from '@/lib/permissions.js';
import { OWNER_ONLY_ROUTES } from '@/lib/constants.js';

describe('who may open what', () => {
  it('lets Staff and the Store Owner reach the management side', () => {
    expect(mayOpenManagement('staff')).toBe(true);
    expect(mayOpenManagement('store_owner')).toBe(true);
    expect(mayOpenManagement('shopper')).toBe(false);
    expect(mayOpenManagement('guest')).toBe(false);
  });

  it('keeps the four owner-only screens to the Store Owner', () => {
    expect(OWNER_ONLY_ROUTES).toEqual([
      '/admin/delivery-areas',
      '/admin/settings/payments',
      '/admin/settings',
      '/admin/staff',
    ]);
    for (const route of OWNER_ONLY_ROUTES) {
      expect(isOwnerOnlyRoute(route)).toBe(true);
      expect(mayOpenRoute('staff', route)).toBe(false);
      expect(mayOpenRoute('store_owner', route)).toBe(true);
    }
    expect(mayOpenOwnerScreens('staff')).toBe(false);
  });

  it('still lets Staff reach their own management pages', () => {
    expect(mayOpenRoute('staff', '/admin/orders')).toBe(true);
    expect(mayOpenRoute('staff', '/admin/coupons/new')).toBe(true);
    expect(mayOpenRoute('shopper', '/admin')).toBe(false);
    expect(mayOpenRoute('guest', '/admin/products')).toBe(false);
  });

  it('keeps the account pages and the review form to a signed-in shopper', () => {
    expect(mayOpenRoute('shopper', '/account/orders')).toBe(true);
    expect(mayOpenRoute('shopper', '/product/kurta/review')).toBe(true);
    expect(mayOpenRoute('guest', '/account/wishlist')).toBe(false);
    expect(mayOpenRoute('staff', '/account')).toBe(false);
  });

  it('sends a signed-out visitor to the right sign-in page', () => {
    expect(signInRouteFor('/admin/orders')).toBe('/admin/login');
    expect(signInRouteFor('/account/orders')).toBe('/login');
  });
});
