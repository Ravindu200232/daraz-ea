import { supabaseAdmin, supabaseServer } from './supabase.js';
import { DEFAULT_SETTINGS } from './settings.js';
import { ratingSummary } from './reviews.js';
import { periodRange } from './reporting.js';

/**
 * Every read the pages and the API handlers make, in one place.
 *
 * `scoped()` carries the signed-in visitor's own session, so Row Level Security decides what comes
 * back. `admin()` is the service-role client and is used only where no policy can express the read:
 * a guest's cart, an order looked up by number plus phone, and the seed.
 */

async function scoped() {
  return supabaseServer();
}

async function admin() {
  return supabaseAdmin();
}

/* ------------------------------ storefront ------------------------------ */

export async function getSettings() {
  const supabase = await scoped();
  const { data } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
  return data || { id: null, ...DEFAULT_SETTINGS };
}

export async function getPaymentMethods() {
  const supabase = await scoped();
  const { data } = await supabase.from('payment_method_settings').select('*').order('method');
  return data || [];
}

export async function getDeliveryAreas({ onlyActive = true } = {}) {
  const supabase = await admin();
  let query = supabase.from('delivery_areas').select('*').order('delivery_fee');
  if (onlyActive) query = query.eq('is_active', true);
  const { data } = await query;
  return data || [];
}

export async function getCategories() {
  const supabase = await scoped();
  const { data } = await supabase.from('categories').select('*').order('name');
  return data || [];
}

export async function getDepartments() {
  const categories = await getCategories();
  return categories.filter((category) => !category.parent_category_id);
}

export async function getVariants(productIds) {
  if (!productIds?.length) return [];
  const supabase = await scoped();
  const { data } = await supabase.from('product_variants').select('*').in('product_id', productIds).order('size');
  return data || [];
}

function stockState(variants) {
  const total = (variants || []).reduce((sum, variant) => sum + Number(variant.stock_count || 0), 0);
  const anyInStock = (variants || []).some((variant) => Number(variant.stock_count) > 0);
  return { total, anyInStock };
}

export async function getProducts({
  q = '',
  categoryIds = [],
  minPrice = null,
  maxPrice = null,
  inStockOnly = false,
  sort = 'newest',
  includeHidden = false,
  page = 1,
  perPage = 12,
} = {}) {
  const supabase = await scoped();
  let query = supabase.from('products').select('*', { count: 'exact' });
  if (!includeHidden) query = query.eq('status', 'shown');
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  if (categoryIds.length) query = query.in('category_id', categoryIds);
  if (minPrice !== null) query = query.gte('price', minPrice);
  if (maxPrice !== null) query = query.lte('price', maxPrice);

  const { data, count } = await query;
  const rows = data || [];
  const variants = await getVariants(rows.map((row) => row.id));
  const byProduct = new Map();
  variants.forEach((variant) => {
    const list = byProduct.get(variant.product_id) || [];
    list.push(variant);
    byProduct.set(variant.product_id, list);
  });

  let enriched = rows.map((row) => {
    const stats = stockState(byProduct.get(row.id));
    return { ...row, variants: byProduct.get(row.id) || [], stock_total: stats.total, in_stock: stats.anyInStock };
  });

  if (inStockOnly) enriched = enriched.filter((row) => row.in_stock);

  const effective = (row) => Number(row.sale_price ?? row.price);
  if (sort === 'price-asc') enriched.sort((a, b) => effective(a) - effective(b));
  else if (sort === 'price-desc') enriched.sort((a, b) => effective(b) - effective(a));
  else if (sort === 'name') enriched.sort((a, b) => a.name.localeCompare(b.name));
  else enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = count ?? enriched.length;
  if (!inStockOnly && perPage) {
    const start = (page - 1) * perPage;
    enriched = enriched.slice(start, start + perPage);
  }
  return { rows: enriched, total, page, perPage };
}

export async function getProductBySlug(slug) {
  const supabase = await scoped();
  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
  if (!product) return null;
  const [{ data: category }, { data: variants }, { data: reviews }] = await Promise.all([
    supabase.from('categories').select('*').eq('id', product.category_id).maybeSingle(),
    supabase.from('product_variants').select('*').eq('product_id', product.id).order('size'),
    supabase.from('reviews').select('*').eq('product_id', product.id).order('written_at', { ascending: false }),
  ]);
  const visibleReviews = (reviews || []).filter((review) => review.visibility === 'shown');
  return {
    product,
    category,
    variants: variants || [],
    reviews: visibleReviews,
    rating: ratingSummary(reviews || []),
  };
}

export async function getFeaturedProducts(limit = 8) {
  const supabase = await scoped();
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'shown')
    .order('created_at', { ascending: true })
    .limit(limit);
  const rows = data || [];
  const variants = await getVariants(rows.map((row) => row.id));
  return rows.map((row) => {
    const mine = variants.filter((variant) => variant.product_id === row.id);
    const stats = stockState(mine);
    return { ...row, variants: mine, stock_total: stats.total, in_stock: stats.anyInStock };
  });
}

/* ------------------------------ account ------------------------------ */

export async function getCustomerAddresses(customerId) {
  const supabase = await scoped();
  const [{ data: addresses }, areas] = await Promise.all([
    supabase.from('delivery_addresses').select('*').eq('customer_id', customerId).order('created_at'),
    getDeliveryAreas(),
  ]);
  const byId = new Map(areas.map((area) => [area.id, area]));
  return (addresses || []).map((address) => ({ ...address, area: byId.get(address.delivery_area_id) || null }));
}

export async function getWishlist(customerId) {
  const supabase = await scoped();
  const { data } = await supabase
    .from('wishlist_items')
    .select('*, products (*)')
    .eq('customer_id', customerId)
    .order('added_at', { ascending: false });
  return data || [];
}

export async function getCartLines({ customerId = null, guestId = null }) {
  if (!customerId && !guestId) return [];
  const supabase = customerId ? await scoped() : await admin();
  let query = supabase.from('cart_items').select('*, product_variants (*, products (*))');
  query = customerId ? query.eq('customer_id', customerId) : query.eq('guest_session_id', guestId);
  const { data } = await query.order('added_at');
  return (data || []).map((row) => {
    const variant = row.product_variants;
    const product = variant?.products || null;
    return {
      id: row.id,
      quantity: row.quantity,
      variantId: row.product_variant_id,
      variantLabel: [variant?.size, variant?.colour].filter(Boolean).join(' · '),
      stockCount: variant?.stock_count ?? 0,
      unitPrice: Number(product?.sale_price ?? product?.price ?? 0),
      product,
      photo: product?.photos?.[0] || null,
    };
  });
}

export async function getCustomerOrders(customerId) {
  const supabase = await scoped();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*), payments (*), return_requests (*)')
    .eq('customer_id', customerId)
    .order('placed_at', { ascending: false });
  return data || [];
}

export async function getOrderForCustomer(number, customerId) {
  const orders = await getCustomerOrders(customerId);
  return orders.find((order) => order.order_number === number) || null;
}

/* ------------------------------ lookups ------------------------------ */

export async function findOrderForTracking(number, phone) {
  const supabase = await admin();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*), order_status_changes (*), payments (*)')
    .eq('order_number', String(number || '').trim().toUpperCase())
    .maybeSingle();
  if (!data) return { ok: false, reason: 'not_found' };
  const wanted = String(phone || '').replace(/[^0-9]/g, '');
  const onOrder = String(data.customer_phone || '').replace(/[^0-9]/g, '');
  if (!wanted || wanted !== onOrder) return { ok: false, reason: 'not_found' };
  return { ok: true, order: data };
}

export async function getOrderByNumber(number) {
  const supabase = await admin();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*), order_status_changes (*), payments (*), order_messages (*)')
    .eq('order_number', number)
    .maybeSingle();
  return data || null;
}

/* ------------------------------ management ------------------------------ */

export async function getManagementOrders({ stage = 'all', q = '' } = {}) {
  const supabase = await scoped();
  let query = supabase.from('orders').select('*').order('placed_at', { ascending: false });
  if (stage !== 'all') query = query.eq('order_status', stage);
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  const { data } = await query;
  return data || [];
}

export async function getManagementOrder(id) {
  const supabase = await scoped();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*), order_status_changes (*), payments (*), order_messages (*), return_requests (*)')
    .eq('id', id)
    .maybeSingle();
  return data || null;
}

export async function getCustomers({ q = '' } = {}) {
  const supabase = await scoped();
  let query = supabase.from('customers').select('*').order('joined_at', { ascending: false });
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await query;
  return data || [];
}

export async function getCustomer(id) {
  const supabase = await scoped();
  const { data } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('placed_at', { ascending: false });
  return { customer: data, orders: orders || [] };
}

export async function getReturns() {
  const supabase = await scoped();
  const { data } = await supabase
    .from('return_requests')
    .select('*, order_items (*), orders (*)')
    .order('requested_at', { ascending: false });
  return data || [];
}

export async function getReturn(id) {
  const supabase = await scoped();
  const { data } = await supabase
    .from('return_requests')
    .select('*, order_items (*, products (*)), orders (*)')
    .eq('id', id)
    .maybeSingle();
  return data || null;
}

export async function getCoupons() {
  const supabase = await scoped();
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getCoupon(id) {
  const supabase = await scoped();
  const { data } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const { data: uses } = await supabase
    .from('coupon_uses')
    .select('*, orders (order_number)')
    .eq('coupon_id', id)
    .order('used_at', { ascending: false });
  return { coupon: data, uses: uses || [] };
}

export async function getReviews() {
  const supabase = await scoped();
  const { data } = await supabase
    .from('reviews')
    .select('*, products (id, name, slug, photos)')
    .order('written_at', { ascending: false });
  return data || [];
}

export async function getStaff() {
  const supabase = await scoped();
  const { data } = await supabase.from('staff_members').select('*').order('added_at', { ascending: false });
  return data || [];
}

export async function getCouponByCode(code) {
  const supabase = await scoped();
  const { data } = await supabase.from('coupons').select('*').ilike('code', String(code || '').trim()).maybeSingle();
  return data || null;
}

export async function getDashboard(period = 'thisMonth', custom = {}) {
  const range = periodRange(period, custom);
  const supabase = await scoped();
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .gte('placed_at', range.start)
    .lte('placed_at', range.end)
    .order('placed_at', { ascending: false });
  const rows = orders || [];
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', rows.length ? rows.map((row) => row.id) : ['00000000-0000-0000-0000-000000000000']);
  const { data: waiting } = await supabase
    .from('orders')
    .select('*')
    .eq('order_status', 'placed')
    .order('placed_at', { ascending: false })
    .limit(6);
  return { range, orders: rows, items: items || [], waiting: waiting || [] };
}
