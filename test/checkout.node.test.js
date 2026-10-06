// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The checkout handler, exercised through its own HTTP shape.
 *
 * The database client and the session are stubbed, so what is really being held still is the
 * business rule: an online payment that fails records nothing at all, and cash on delivery records
 * the order with the items subtotal plus the area's fixed delivery fee.
 */

const writes = [];

function makeClient() {
  return {
    from(table) {
      const builder = {};
      const record = (method) => (payload) => {
        if (method === 'insert') writes.push({ table, payload });
        if (method === 'update') writes.push({ table, type: 'update', patch: payload });
        if (method === 'delete') writes.push({ table, type: 'delete' });
        return builder;
      };
      for (const method of ['insert', 'update', 'delete', 'select', 'eq', 'ilike', 'in', 'order', 'limit', 'neq']) {
        builder[method] = record(method);
      }
      builder.maybeSingle = async () => {
        if (table === 'delivery_areas') return { data: globalThis.__area, error: null };
        if (table === 'payment_method_settings') return { data: globalThis.__setting, error: null };
        if (table === 'orders') return { data: { order_number: 'DA-10000' }, error: null };
        return { data: null, error: null };
      };
      builder.single = async () => ({ data: { id: 'order-1', order_number: 'DA-10001' }, error: null });
      return builder;
    },
  };
}

vi.mock('@/lib/supabase.js', () => ({
  supabaseAdmin: () => globalThis.__client,
  supabaseServer: async () => globalThis.__client,
}));

vi.mock('@/lib/auth.js', () => ({
  getViewer: async () => globalThis.__viewer,
}));

vi.mock('@/lib/queries.js', () => ({
  getCartLines: async () => globalThis.__lines,
}));

vi.mock('@/lib/guest.js', () => ({
  readGuestId: async () => 'guest-session-1',
  ensureGuestId: async () => 'guest-session-1',
  signOutGuest: async () => {},
  GUEST_COOKIE: 'darazea_guest',
}));

const line = {
  id: 'line-1',
  quantity: 2,
  variantId: 'variant-1',
  variantLabel: 'M · Charcoal',
  stockCount: 5,
  unitPrice: 1000,
  product: { id: 'product-1', name: 'Linen Kurta Shirt', slug: 'linen-kurta-shirt' },
  photo: null,
};

const orderBody = {
  full_name: 'Amara Perera',
  phone: '077 214 5580',
  email: 'shopper@example.com',
  address_line_1: '42 Temple Road',
  delivery_area_id: 'area-3',
  payment_method: 'cod',
};

function request(body) {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  writes.length = 0;
  globalThis.__client = makeClient();
  globalThis.__viewer = { role: 'guest', user: null, customer: null, staff: null };
  globalThis.__lines = [line];
  globalThis.__area = { id: 'area-3', name: 'Colombo 03', delivery_fee: 350, is_active: true };
  globalThis.__setting = { method: 'cod', is_enabled: true, store_account_details: null };
});

describe('POST /api/checkout', () => {
  it('records a cash on delivery order with the delivery fee added and the cart cleared', async () => {
    const { POST } = await import('@/app/api/checkout/route.js');
    const response = await POST(request(orderBody));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.orderNumber).toBe('DA-10001');

    const order = writes.find((write) => write.table === 'orders' && write.payload);
    expect(order.payload).toMatchObject({
      items_subtotal: 2000,
      delivery_fee: 350,
      discount_amount: 0,
      order_total: 2350,
      payment_method: 'cod',
      order_status: 'placed',
      is_guest_order: true,
    });
    expect(writes.some((write) => write.table === 'order_items')).toBe(true);
    expect(writes.some((write) => write.table === 'order_status_changes')).toBe(true);
    expect(writes.some((write) => write.table === 'order_messages')).toBe(true);
    expect(writes.some((write) => write.table === 'cart_items' && write.type === 'delete')).toBe(true);
  });

  it('records no order at all when an online payment does not go through', async () => {
    globalThis.__setting = { method: 'card', is_enabled: true, store_account_details: { gateway: 'LankaPay Card Gateway', merchant_id: 'DLZ-4417-8820' } };
    const { POST } = await import('@/app/api/checkout/route.js');
    const response = await POST(request({ ...orderBody, payment_method: 'card' }));
    const body = await response.json();

    expect(response.status).toBe(402);
    expect(body.message).toContain('no order was placed');
    expect(writes.filter((write) => write.table === 'orders')).toHaveLength(0);
    expect(writes.filter((write) => write.table === 'order_items')).toHaveLength(0);
    expect(writes.filter((write) => write.table === 'coupon_uses')).toHaveLength(0);
    expect(writes.filter((write) => write.table === 'product_variants')).toHaveLength(0);
  });

  it('refuses an empty cart before it touches anything', async () => {
    globalThis.__lines = [];
    const { POST } = await import('@/app/api/checkout/route.js');
    const response = await POST(request(orderBody));
    expect(response.status).toBe(422);
    expect((await response.json()).field).toBe('cart');
    expect(writes).toHaveLength(0);
  });

  it('refuses an address with no area, because delivery is charged for the area', async () => {
    globalThis.__area = null;
    const { POST } = await import('@/app/api/checkout/route.js');
    const response = await POST(request(orderBody));
    expect(response.status).toBe(422);
    expect((await response.json()).field).toBe('area');
  });

  it('refuses a phone number that is not a full number', async () => {
    const { POST } = await import('@/app/api/checkout/route.js');
    const response = await POST(request({ ...orderBody, phone: '+94 77 512' }));
    expect(response.status).toBe(422);
    expect((await response.json()).field).toBe('phone');
    expect(writes).toHaveLength(0);
  });
});
