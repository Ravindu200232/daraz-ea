/**
 * Seed the store with the prototype's own cast, additively.
 *
 * This script never truncates or deletes anything: every write is an upsert on a natural key
 * (email, slug, code, order number), so running it twice leaves the same rows and never touches
 * data an order or a shopper created later. It is the only place the demo accounts' credentials
 * appear — they are never shown in the interface.
 */
import { createClient } from '@supabase/supabase-js';
import { orderTotals } from '../lib/pricing.js';
import { productPhotos } from '../lib/images.js';
import { DEFAULT_SETTINGS } from '../lib/settings.js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (AgentForge sets these '
    + 'automatically when this runs through the Studio).');
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const DEMO_PASSWORD = 'Demo!2026';

/* ------------------------------------------------------------------ people */

const CUSTOMERS = [
  { email: 'shopper@example.com', full_name: 'Amara Perera', phone: '+94 77 214 5580' },
  { email: 'ayesha.fernando@example.com', full_name: 'Ayesha Fernando', phone: '071 884 2210' },
  { email: 'tharushi@example.com', full_name: 'Tharushi Weerasinghe', phone: '077 902 3311' },
  { email: 'mohamed.rizwan@example.com', full_name: 'Mohamed Rizwan', phone: '075 660 2204' },
  { email: 'pasindu@example.com', full_name: 'Pasindu Herath', phone: '076 447 8021' },
  { email: 'ishara.fernando@example.com', full_name: 'Ishara Fernando', phone: '071 448 2200' },
  { email: 'sanduni.rathnayake@example.com', full_name: 'Sanduni Rathnayake', phone: '075 220 1144' },
  { email: 'kasun.bandara@example.com', full_name: 'Kasun Bandara', phone: '076 991 3322' },
  { email: 'ruwan.jayasuriya@example.com', full_name: 'Ruwan Jayasuriya', phone: '077 331 9912' },
  { email: 'nimali.perera@example.com', full_name: 'Nimali Perera', phone: '077 448 2201' },
  { email: 'dilrukshi.jayawardena@example.com', full_name: 'Dilrukshi Jayawardena', phone: '077 220 1155' },
  { email: 'nimali.weerasinghe@example.com', full_name: 'Nimali Weerasinghe', phone: '076 220 1177' },
  { email: 'ravi.jayawardena@example.com', full_name: 'Ravi Jayawardena', phone: '071 990 2211' },
  { email: 'dilani.silva@example.com', full_name: 'Dilani Silva', phone: '077 331 0099' },
  { email: 'nuwan.perera@example.com', full_name: 'Nuwan Perera', phone: '077 331 0088' },
  { email: 'ruwan.silva@example.com', full_name: 'Ruwan Silva', phone: '078 331 0077' },
  { email: 'amaya.perera@gmail.com', full_name: 'Amaya Perera', phone: '+94 77 123 4567' },
  { email: 'kasunp@outlook.com', full_name: 'Kasun Perera', phone: '+94 71 884 2210' },
  { email: 'dilani.perera@yahoo.com', full_name: 'Dilani Perera', phone: '+94 76 502 9914' },
  { email: 'ruwan.perera@yahoo.com', full_name: 'Ruwan Perera', phone: '+94 77 640 3388', account_status: 'off' },
  { email: 'nadeesha.p@gmail.com', full_name: 'Nadeesha Perera', phone: '+94 70 219 7745' },
  { email: 'sanduni.perera@gmail.com', full_name: 'Sanduni Perera', phone: '+94 75 331 0092' },
  { email: 'tharindu.perera@gmail.com', full_name: 'Tharindu Perera', phone: '+94 77 908 1123', account_status: 'off' },
  { email: 'chamara.perera@gmail.com', full_name: 'Chamara Perera', phone: '+94 72 466 7751' },
  { email: 'nimali.ranasinghe@example.com', full_name: 'Nimali Ranasinghe', phone: '+94 77 214 8860' },
  { email: 'sahan.jayasinghe@gmail.com', full_name: 'Sahan Jayasinghe', phone: '+94 71 552 8890', account_status: 'off' },
];

const STAFF = [
  { email: 'store.owner@example.com', full_name: 'Nishadi Perera', role: 'store_owner', phone: '+94 77 214 8890' },
  { email: 'staff@example.com', full_name: 'Nilanka Perera', role: 'staff', phone: '+94 77 214 8891' },
  { email: 'ayesha@darazea.example', full_name: 'Ayesha Fernando', role: 'staff', phone: '+94 77 482 1190' },
  { email: 'dilani@darazea.example', full_name: 'Dilani Silva', role: 'staff' },
  { email: 'nuwan@darazea.example', full_name: 'Nuwan Perera', role: 'staff' },
  { email: 'ravi@darazea.example', full_name: 'Ravi Kumar', role: 'staff', status: 'off' },
];

async function ensureAuthUser({ email, full_name }) {
  const created = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (!created.error && created.data?.user) return created.data.user.id;
  if (created.error && created.error.code !== 'email_exists' && !/already/i.test(created.error.message)) {
    throw created.error;
  }
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!found) throw new Error(`could not find or create the auth user ${email}`);
  return found.id;
}

/* ------------------------------------------------------------------ catalogue */

const CATEGORIES = [
  ['Electronics', 'electronics', 'Phones, audio and small appliances', null],
  ['Mobile Phones', 'mobile-phones', 'Android and iPhone handsets and chargers', 'electronics'],
  ['Phone Cases', 'phone-cases', 'Cases, covers and screen guards', 'mobile-phones'],
  ['Audio', 'audio', 'Headphones, earbuds and speakers', 'electronics'],
  ['Home & Kitchen', 'home-kitchen', 'Cookware, storage and cleaning', null],
  ['Cookware', 'cookware', 'Pots, pans and bakeware', 'home-kitchen'],
  ['Small Appliances', 'small-appliances', 'Blenders, kettles and rice cookers', 'home-kitchen'],
  ['Fashion', 'fashion', 'Clothing and footwear for adults and children', null],
  ["Men's Clothing", 'mens-clothing', 'Shirts, trousers and jackets', 'fashion'],
  ["Women's Clothing", 'womens-clothing', 'Dresses, tops and sarees', 'fashion'],
  ['Footwear', 'footwear', 'Sandals, sneakers and court shoes', 'fashion'],
  ['Baby & Toys', 'baby-toys', 'Toys, feeding and baby care', null],
  ['Toys', 'toys', 'Soft toys, blocks and puzzles', 'baby-toys'],
  ['Stationery', 'stationery', 'Notebooks, pens and desk supplies', null],
];

const SIZES = ['S', 'M', 'L', 'XL'];
const FASHION_COLOURS = ['Navy', 'White', 'Olive'];

/** slug → category slug, price, sale price, sizes, colours, and any cells that are out of stock. */
const PRODUCTS = [
  ['handloom-cotton-kurta', 'Handloom Cotton Kurta', 'womens-clothing', 4250, 3190, ['S', 'M', 'L', 'XL'], ['Indigo', 'Ivory']],
  ['kandyan-handloom-saree', 'Kandyan Handloom Saree', 'womens-clothing', 8900, null, ['One size'], ['Rust', 'Peach']],
  ['mens-linen-shirt', "Men's Linen Shirt", 'mens-clothing', 4750, 3990, SIZES, ['White', 'Sand']],
  ['leather-sandals', 'Leather Sandals', 'footwear', 5900, null, ['40', '41', '42', '43'], ['Tan', 'Brown']],
  ['ceylon-cinnamon-gift-pack', 'Ceylon Cinnamon Gift Pack', 'home-kitchen', 2450, 1950, ['One size'], ['Natural']],
  ['rattan-storage-basket', 'Rattan Storage Basket', 'home-kitchen', 3200, null, ['Small', 'Large'], ['Natural']],
  ['batik-cushion-cover-set', 'Batik Cushion Cover Set', 'home-kitchen', 2650, null, ['45 cm'], ['Indigo', 'Rust']],
  ['denim-jacket', 'Denim Jacket', 'mens-clothing', 6400, 5120, SIZES, ['Indigo', 'Stone']],
  ['linen-kurta-indigo', 'Linen Kurta — Indigo', 'womens-clothing', 3750, 2990, SIZES, ['Indigo']],
  ['pleated-midi-skirt', 'Pleated Midi Skirt', 'womens-clothing', 4300, null, SIZES, ['Powder Blue', 'Charcoal']],
  ['block-print-cotton-blouse', 'Block-print Cotton Blouse', 'womens-clothing', 3900, 3150, SIZES, ['Indigo', 'Rust']],
  ['handloom-cotton-saree-peach', 'Handloom Cotton Saree — Peach', 'womens-clothing', 4850, null, ['One size'], ['Peach']],
  ['cropped-denim-jacket', 'Cropped Denim Jacket', 'womens-clothing', 4900, 4400, SIZES, ['Indigo', 'Stone']],
  ['silk-blend-scarf', 'Silk-blend Scarf', 'womens-clothing', 2150, 1700, ['One size'], ['Rust', 'Navy']],
  ['tiered-cotton-dress', 'Tiered Cotton Dress', 'womens-clothing', 3850, null, SIZES, ['Ivory', 'Sage']],
  ['batik-wrap-skirt', 'Batik Wrap Skirt', 'womens-clothing', 3200, 2650, SIZES, ['Indigo'], { all: 0 }],
  ['ribbed-knit-top', 'Ribbed Knit Top', 'womens-clothing', 1950, null, SIZES, ['Cream', 'Charcoal']],
  ['straight-leg-trousers', 'Straight-leg Trousers', 'womens-clothing', 4100, 3400, ['28', '30', '32'], ['Charcoal', 'Sand']],
  ['everyday-canvas-tote', 'Everyday Canvas Tote', 'fashion', 2250, null, ['One size'], ['Natural'], { all: 0 }],
  ['embroidered-kaftan-blouse', 'Embroidered Kaftan Blouse', 'womens-clothing', 4650, null, SIZES, ['Ivory', 'Rust']],
  ['everyday-cotton-panjabi', 'Everyday Cotton Panjabi', 'mens-clothing', 1890, 1590, ['M', 'L'], ['White', 'Navy']],
  ['classic-cotton-tee', 'Classic Cotton Tee', 'mens-clothing', 2450, 1899, SIZES, ['Charcoal', 'Sand']],
  ['meridian-cotton-oxford-shirt', 'Meridian Cotton Oxford Shirt', 'mens-clothing', 4950, 3465, SIZES, FASHION_COLOURS,
    { 'S · White': 0, 'L · Olive': 0, 'XL · Navy': 0, 'S · Navy': 3, 'S · Olive': 5, 'M · Navy': 6, 'M · White': 8, 'M · Olive': 2, 'L · Navy': 4, 'L · White': 7, 'XL · White': 5, 'XL · Olive': 3 }],
  ['lumora-cotton-kurta', 'Lumora Cotton Kurta', 'womens-clothing', 5600, 4250, ['XS', 'S', 'M', 'L', 'XL'], ['Sage', 'Ivory', 'Charcoal'],
    { 'XL · Sage': 0, 'XL · Ivory': 0, 'XL · Charcoal': 0, 'M · Sage': 6, 'M · Ivory': 2, 'L · Sage': 0 }],
  ['riva-linen-shirt', 'Riva Linen Shirt', 'mens-clothing', 5900, null, SIZES, ['Stone', 'White']],
  ['kenda-canvas-sneakers', 'Kenda Canvas Sneakers', 'footwear', 7400, null, ['38', '39', '40', '41', '42'], ['Off-white', 'Black']],
  ['solis-ceramic-mug-set', 'Solis Ceramic Mug Set, 4 pieces', 'home-kitchen', 2900, 2150, ['One size'], ['Grey'], { all: 0 }],
  ['linen-kurta-shirt', 'Linen Kurta Shirt', 'mens-clothing', 3450, null, SIZES, ['Charcoal', 'Sand']],
  ['aero-running-shoes', 'Aero Running Shoes', 'footwear', 5200, null, ['40', '41', '42', '43'], ['Slate Grey'], { '42 · Slate Grey': 3, '40 · Slate Grey': 5, '41 · Slate Grey': 4, '43 · Slate Grey': 0 }],
  ['canvas-tote-bag', 'Canvas Tote Bag', 'fashion', 2650, null, ['One size'], ['Natural']],
  ['ceramic-dinner-set', 'Ceramic Dinner Set', 'home-kitchen', 9900, 7900, ['12 pieces'], ['White']],
  ['wireless-earbuds', 'Wireless Earbuds', 'electronics', 15500, 13950, ['One size'], ['Black'], null, 'hidden'],
  ['running-shoes', 'Running Shoes', 'footwear', 12750, 10900, ['40', '41', '42', '43'], ['Yellow', 'Black']],
  ['cotton-bath-towel-set', 'Cotton Bath Towel Set', 'home-kitchen', 1100, null, ['2 pieces'], ['Grey', 'White']],
  ['stainless-steel-water-bottle', 'Stainless Steel Water Bottle 1 L', 'home-kitchen', 3200, 2550, ['1 L'], ['Steel']],
  ['rechargeable-table-lamp', 'Rechargeable Table Lamp', 'small-appliances', 5600, 4200, ['One size'], ['Warm White']],
  ['handloom-cotton-panjabi-navy', 'Handloom Cotton Panjabi', 'mens-clothing', 4850, 3880, ['M', 'L', 'XL', 'XXL'], ['Navy']],
  ['steel-water-bottle', 'Steel Water Bottle', 'home-kitchen', 2900, null, ['750 ml'], ['Steel']],
  ['bela-handwoven-throw', 'Bela Handwoven Throw', 'home-kitchen', 4400, null, ['One size'], ['Natural'], null, 'hidden'],
];

const DEFAULT_STOCK = 9;

function stockFor(slug, size, colour, overrides) {
  if (overrides && overrides.all === 0) return 0;
  if (overrides) {
    const key = `${size} · ${colour}`;
    if (overrides[key] !== undefined) return overrides[key];
  }
  return DEFAULT_STOCK;
}

/* ------------------------------------------------------------------ helpers */

async function upsert(table, rows, onConflict) {
  if (!rows.length) return [];
  const { data, error } = await admin.from(table).upsert(rows, { onConflict, ignoreDuplicates: false }).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function insertMissing(table, rows, conflict) {
  if (!rows.length) return [];
  const { data, error } = await admin.from(table).upsert(rows, { onConflict: conflict, ignoreDuplicates: true }).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function idBy(table, column, values) {
  const { data, error } = await admin.from(table).select(`id,${column}`).in(column, values);
  if (error) throw new Error(`${table}: ${error.message}`);
  return new Map((data || []).map((row) => [row[column], row.id]));
}

/* ------------------------------------------------------------------ seeding */

async function seed() {
  // 1. people — Auth users first, they own the identity rows
  const customerIds = new Map();
  for (const customer of CUSTOMERS) {
    const id = await ensureAuthUser(customer);
    customerIds.set(customer.email, id);
  }
  const staffIds = new Map();
  for (const member of STAFF) {
    const id = await ensureAuthUser(member);
    staffIds.set(member.email, id);
  }

  await upsert('customers', CUSTOMERS.map((customer) => ({
    id: customerIds.get(customer.email),
    full_name: customer.full_name,
    email: customer.email,
    phone: customer.phone,
    sign_in_method: 'email',
    account_status: customer.account_status || 'active',
  })), 'id');

  await upsert('staff_members', STAFF.map((member) => ({
    id: staffIds.get(member.email),
    full_name: member.full_name,
    email: member.email,
    phone: member.phone || null,
    role: member.role,
    status: member.status || 'active',
  })), 'id');

  // 2. store settings and the ways shoppers may pay
  const { data: existingSettings } = await admin.from('store_settings').select('id').limit(1).maybeSingle();
  if (!existingSettings) {
    const { error: settingsError } = await admin
      .from('store_settings')
      .insert({ ...DEFAULT_SETTINGS, currency: 'Sri Lankan Rupees (LKR — Rs.)' });
    if (settingsError) throw new Error(`store_settings: ${settingsError.message}`);
  }

  await upsert('payment_method_settings', [
    { method: 'card', is_enabled: true, shopper_instructions: 'Visa, Mastercard and American Express, through the store\'s payment gateway.', store_account_details: { gateway: 'LankaPay Card Gateway', merchant_id: 'DLZ-4417-8820', merchant_secret_note: 'Stored in the store\'s own gateway dashboard.' } },
    { method: 'wallet', is_enabled: false, shopper_instructions: 'Pay from a mobile wallet.', store_account_details: { provider: 'eZ Cash', merchant_number: '077 145 8890', account_name: 'DarazEA (Pvt) Ltd' } },
    { method: 'bank_transfer', is_enabled: false, shopper_instructions: 'Transfer the order total to the account below, then reply to your order email with the transfer reference number. Your order is sent on as soon as the money reaches the account.', store_account_details: { bank: 'Commercial Bank of Ceylon', account_name: 'DarazEA (Pvt) Ltd', account_number: '8001 4472 9930', branch: 'Nugegoda' } },
    { method: 'paypal', is_enabled: false, shopper_instructions: 'Pay from a PayPal balance or card.', store_account_details: { email: 'payments@darazea.example', merchant_id: '8KXQ7PL2NVY4' } },
    { method: 'cod', is_enabled: true, shopper_instructions: 'The courier collects the money when the parcel arrives.', store_account_details: null },
  ], 'method');

  // 3. delivery areas
  await upsert('delivery_areas', [
    { name: 'Colombo 01', delivery_fee: 200, is_active: true },
    { name: 'Colombo 03', delivery_fee: 350, is_active: true },
    { name: 'Colombo 04', delivery_fee: 300, is_active: true },
    { name: 'Dehiwala', delivery_fee: 250, is_active: true },
    { name: 'Nugegoda', delivery_fee: 250, is_active: true },
    { name: 'Kadawatha', delivery_fee: 300, is_active: true },
    { name: 'Kandy', delivery_fee: 550, is_active: true },
    { name: 'Colombo 05', delivery_fee: 350, is_active: true },
    { name: 'Jaffna Town', delivery_fee: 600, is_active: false },
  ], 'name');

  // 4. categories, parents before children
  const topLevel = CATEGORIES.filter(([, , , parent]) => !parent);
  const children = CATEGORIES.filter(([, , , parent]) => parent);
  await upsert('categories', topLevel.map(([name, slug, description]) => ({
    name, slug, description, image_url: null, parent_category_id: null,
  })), 'slug');
  const categoryIds = await idBy('categories', 'slug', CATEGORIES.map(([, slug]) => slug));
  await upsert('categories', children.map(([name, slug, description, parent]) => ({
    name, slug, description, image_url: null, parent_category_id: categoryIds.get(parent),
  })), 'slug');
  const categoryMap = await idBy('categories', 'slug', CATEGORIES.map(([, slug]) => slug));

  // 5. products and their size/colour stock
  const productRows = PRODUCTS.map(([slug, name, categorySlug, price, salePrice, , , , status]) => ({
    name,
    slug,
    category_id: categoryMap.get(categorySlug),
    description: `${name} from DarazEA. Handmade in small batches, packed in our own workshop and sent from Colombo with a fixed delivery fee for your area.`,
    photos: productPhotos(slug),
    price,
    sale_price: salePrice,
    status: status || 'shown',
  }));
  await upsert('products', productRows, 'slug');
  const productMap = await idBy('products', 'slug', PRODUCTS.map(([slug]) => slug));

  const variantRows = [];
  PRODUCTS.forEach(([slug, , , , , sizes, colours, overrides]) => {
    sizes.forEach((size) => {
      colours.forEach((colour) => {
        variantRows.push({
          product_id: productMap.get(slug),
          size,
          colour,
          stock_count: stockFor(slug, size, colour, overrides),
        });
      });
    });
  });
  // one row per product/size/colour, so a re-run updates stock instead of duplicating it
  for (let i = 0; i < variantRows.length; i += 200) {
    await upsert('product_variants', variantRows.slice(i, i + 200), 'product_id,size,colour');
  }
  const { data: allVariants } = await admin.from('product_variants').select('id,product_id,size,colour');
  const variantKey = new Map((allVariants || []).map((row) => [`${row.product_id}|${row.size}|${row.colour}`, row.id]));
  const variantOf = (slug, label) => {
    const [size, colour] = label.split(' · ');
    return variantKey.get(`${productMap.get(slug)}|${size}|${colour}`) || null;
  };

  // 6. coupons, including the ones the prototype's checkout and coupon screens show
  const areaMap = await idBy('delivery_areas', 'name', ['Colombo 01', 'Colombo 03', 'Colombo 04', 'Dehiwala', 'Nugegoda', 'Kadawatha', 'Kandy', 'Colombo 05', 'Jaffna Town']);
  const couponRows = [
    ['NEWYEAR20', 'percentage', 20, 7500, '2026-01-31', 400, 268, 'categories', [], [categoryMap.get('electronics')], false],
    ['WELCOME10', 'percentage', 10, 3000, '2026-06-30', 500, 214, 'all', [], [], true],
    ['RAMADAN250', 'fixed', 250, 2000, '2026-04-10', null, 178, 'products', [productMap.get('ceylon-cinnamon-gift-pack')], [], false],
    ['FLAT500', 'fixed', 500, 5000, '2026-12-31', 300, 96, 'all', [], [], true],
    ['KITCHEN15', 'percentage', 15, 4000, '2026-08-31', 200, 41, 'categories', [], [categoryMap.get('home-kitchen')], true],
    ['SHOES750', 'fixed', 750, 6000, '2026-07-15', 100, 12, 'categories', [], [categoryMap.get('footwear')], true],
    ['DAZ10', 'percentage', 10, 0, '2026-12-31', null, 3, 'all', [], [], true],
    ['KURTI10', 'percentage', 10, 5000, '2026-12-31', null, 1, 'all', [], [], true],
    ['MONSOON10', 'percentage', 10, 0, '2026-12-31', null, 2, 'all', [], [], true],
    ['SAVE20', 'percentage', 20, 1000, '2025-04-30', 200, 12, 'all', [], [], true],
    ['EID25', 'percentage', 25, 5000, '2026-03-31', 500, 0, 'categories', [], [categoryMap.get('fashion'), categoryMap.get('electronics')], true],
  ].map(([code, type, value, minimum, expires, maxUses, usedCount, appliesTo, products, categories, active]) => ({
    code, discount_type: type, discount_value: value, minimum_order_value: minimum,
    expires_at: expires, max_uses: maxUses, used_count: usedCount, applies_to: appliesTo,
    applies_to_products: products, applies_to_categories: categories, is_active: active,
  }));
  await upsert('coupons', couponRows, 'code');
  const couponMap = await idBy('coupons', 'code', couponRows.map((row) => row.code));

  // 7. orders with their items, payments, stage history, messages and returns
  const AREA_FEE = { 'Colombo 01': 200, 'Colombo 03': 350, 'Colombo 04': 300, 'Dehiwala': 250, 'Nugegoda': 250, 'Kadawatha': 300, 'Kandy': 550, 'Colombo 05': 350 };

  const ORDER_SPECS = [
    { number: 'DA-1048', customer: 'Tharushi Weerasinghe', email: 'tharushi@example.com', phone: '077 123 4567', area: 'Colombo 05', guest: true, method: 'cod', payment: 'unpaid', status: 'placed', placed: '2026-05-20T09:12:00Z', items: [['handloom-cotton-kurta', 'L · Indigo', 1]], coupon: 'WELCOME10' },
    { number: 'DA-1047', customer: 'Ayesha Fernando', email: 'ayesha.fernando@example.com', phone: '071 884 2210', area: 'Colombo 03', guest: false, customer_email: 'ayesha@darazea.example', method: 'card', payment: 'paid', status: 'placed', placed: '2026-05-20T08:03:00Z', items: [['kandyan-handloom-saree', 'One size · Rust', 1], ['batik-cushion-cover-set', '45 cm · Indigo', 1]] },
    { number: 'DA-1046', customer: 'Kasun Silva', email: 'kasunp@outlook.com', phone: '076 220 9013', area: 'Nugegoda', guest: false, method: 'card', payment: 'paid', status: 'confirmed', placed: '2026-05-19T18:41:00Z', items: [['ribbed-knit-top', 'M · Cream', 1], ['silk-blend-scarf', 'One size · Navy', 1]] },
    { number: 'DA-1045', customer: 'Dilani Jayasinghe', email: 'dilani.perera@yahoo.com', phone: '078 445 1188', area: 'Kandy', guest: false, method: 'bank_transfer', payment: 'pending', status: 'confirmed', placed: '2026-05-19T14:27:00Z', reference: 'BT-8841207', proof: `https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=200&q=60`, items: [['ceramic-dinner-set', '12 pieces · White', 1], ['cotton-bath-towel-set', '2 pieces · Grey', 2]] },
    { number: 'DA-1044', customer: 'Ruwan Bandara', email: 'ruwan@example.com', phone: '070 331 7742', area: 'Colombo 04', guest: true, method: 'paypal', payment: 'paid', status: 'shipped', placed: '2026-05-18T20:15:00Z', items: [['kenda-canvas-sneakers', '42 · Off-white', 1], ['canvas-tote-bag', 'One size · Natural', 1]] },
    { number: 'DA-1043', customer: 'Tharushi Weerasinghe', email: 'tharushi@example.com', phone: '077 902 3311', area: 'Dehiwala', guest: false, method: 'wallet', payment: 'paid', status: 'shipped', placed: '2026-05-18T11:52:00Z', items: [['tiered-cotton-dress', 'M · Sage', 1], ['silk-blend-scarf', 'One size · Rust', 1]] },
    { number: 'DA-1042', customer: 'Mohamed Rizwan', email: 'mohamed.rizwan@example.com', phone: '075 660 2204', area: 'Colombo 03', guest: false, method: 'card', payment: 'paid', status: 'delivered', placed: '2026-05-17T09:38:00Z', items: [['classic-cotton-tee', 'M · Charcoal', 1], ['denim-jacket', 'L · Indigo', 1], ['leather-sandals', '42 · Tan', 1]] },
    { number: 'DA-1041', customer: 'Sanduni Kotelawala', email: 'sanduni.perera@gmail.com', phone: '071 118 5590', area: 'Nugegoda', guest: false, method: 'cod', payment: 'paid', status: 'delivered', placed: '2026-05-16T16:07:00Z', items: [['block-print-cotton-blouse', 'M · Rust', 1]] },
    { number: 'DA-1040', customer: 'Pasindu Herath', email: 'pasindu@example.com', phone: '076 447 8021', area: 'Colombo 01', guest: false, method: 'card', payment: 'paid', status: 'delivered', placed: '2026-05-16T10:22:00Z', items: [['running-shoes', '42 · Black', 1], ['aero-running-shoes', '40 · Slate Grey', 1]] },
    { number: 'DA-1039', customer: 'Iresha Nawarathne', email: 'iresha@example.com', phone: '072 990 4433', area: 'Kadawatha', guest: true, method: 'bank_transfer', payment: 'pending', status: 'delivered', placed: '2026-05-15T08:55:00Z', reference: 'BT-8840913', items: [['leather-sandals', '42 · Brown', 1], ['mens-linen-shirt', 'L · White', 1]] },
    { number: 'DA-1038', customer: 'Tharindu Silva', email: 'tharindu.perera@gmail.com', phone: '077 908 1123', area: 'Colombo 03', guest: false, method: 'card', payment: 'paid', status: 'delivered', placed: '2026-05-11T10:12:00Z', items: [['steel-water-bottle', '750 ml · Steel', 1]] },
    { number: 'DA-1035', customer: 'Ruwan Jayasuriya', email: 'ruwan.jayasuriya@example.com', phone: '077 331 9912', area: 'Nugegoda', guest: false, method: 'cod', payment: 'paid', status: 'delivered', placed: '2026-05-10T09:30:00Z', items: [['everyday-cotton-panjabi', 'M · White', 1]] },
    { number: 'DA-1030', customer: 'Ishara Fernando', email: 'ishara.fernando@example.com', phone: '071 448 2200', area: 'Colombo 04', guest: false, method: 'card', payment: 'paid', status: 'delivered', placed: '2026-05-09T12:05:00Z', items: [['running-shoes', '40 · Yellow', 1]] },
    { number: 'DA-1027', customer: 'Sanduni Rathnayake', email: 'sanduni.rathnayake@example.com', phone: '075 220 1144', area: 'Kandy', guest: false, method: 'wallet', payment: 'paid', status: 'delivered', placed: '2026-05-08T15:20:00Z', items: [['silk-blend-scarf', 'One size · Rust', 1]] },
    { number: 'DA-1022', customer: 'Kasun Bandara', email: 'kasun.bandara@example.com', phone: '076 991 3322', area: 'Dehiwala', guest: false, method: 'card', payment: 'paid', status: 'delivered', placed: '2026-05-06T11:11:00Z', items: [['wireless-earbuds', 'One size · Black', 1]] },
    { number: 'DA-1063', customer: 'Nimali Perera', email: 'nimali.perera@example.com', phone: '077 448 2201', area: 'Colombo 05', guest: false, method: 'cod', payment: 'unpaid', status: 'placed', placed: '2026-05-20T09:38:00Z', items: [['pleated-midi-skirt', 'M · Powder Blue', 1]], recent: true },
    { number: 'DA-10482', customer: 'Amara Perera', email: 'shopper@example.com', phone: '077 214 5580', area: 'Nugegoda', guest: false, shopper: true, method: 'cod', payment: 'unpaid', status: 'placed', placed: '2026-05-18T10:15:00Z', items: [['linen-kurta-shirt', 'M · Charcoal', 2]] },
    { number: 'DA-10461', customer: 'Amara Perera', email: 'shopper@example.com', phone: '077 214 5580', area: 'Nugegoda', guest: false, shopper: true, method: 'card', payment: 'paid', status: 'confirmed', placed: '2026-05-12T09:41:00Z', items: [['riva-linen-shirt', 'M · Stone', 1]] },
    { number: 'DA-10403', customer: 'Amara Perera', email: 'shopper@example.com', phone: '077 214 5580', area: 'Colombo 03', guest: false, shopper: true, method: 'bank_transfer', payment: 'pending', status: 'shipped', placed: '2026-05-04T14:02:00Z', reference: 'BT-8840117', items: [['denim-jacket', 'M · Indigo', 1], ['leather-sandals', '41 · Tan', 1]] },
    { number: 'DA-10355', customer: 'Amara Perera', email: 'shopper@example.com', phone: '077 214 5580', area: 'Colombo 03', guest: false, shopper: true, method: 'card', payment: 'paid', status: 'delivered', placed: '2026-04-26T10:24:00Z', coupon: 'KURTI10', items: [['classic-cotton-tee', 'M · Charcoal', 1], ['aero-running-shoes', '42 · Slate Grey', 2], ['silk-blend-scarf', 'One size · Navy', 1]] },
  ];

  for (const spec of ORDER_SPECS) {
    const { data: existing } = await admin.from('orders').select('id').eq('order_number', spec.number).maybeSingle();
    if (existing) continue;

    const fee = AREA_FEE[spec.area] || 350;
    const lines = spec.items.map(([slug, label, quantity]) => {
      const [size, colour] = label.split(' · ');
      const product = PRODUCTS.find(([productSlug]) => productSlug === slug);
      const unitPrice = Number(product[4] ?? product[3]);
      return { slug, product_id: productMap.get(slug), variant_id: variantOf(slug, label), label, size, colour, quantity, unitPrice };
    });
    const coupon = spec.coupon ? { code: spec.coupon, discount_type: 'percentage', discount_value: 10, minimum_order_value: 0, is_active: true } : null;
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const discount = coupon ? Math.round(((subtotal * 10) / 100) * 100) / 100 : 0;
    const totals = orderTotals({ items: lines, deliveryFee: fee, discount });
    if (!totals.ok) throw new Error(`totals for ${spec.number}: ${totals.reason}`);

    const customerEmail = spec.email;
    const customerId = spec.guest ? null : (customerIds.get(spec.email) || null);

    const { data: orderRows, error: orderError } = await admin.from('orders').insert({
      order_number: spec.number,
      placed_at: spec.placed,
      customer_id: customerId,
      is_guest_order: Boolean(spec.guest),
      customer_name: spec.customer,
      customer_phone: spec.phone,
      customer_email: customerEmail,
      delivery_address: `${spec.customer}, ${spec.area}, Western Province`,
      delivery_area_id: areaMap.get(spec.area),
      delivery_area_name: spec.area,
      delivery_fee: fee,
      items_subtotal: totals.itemsSubtotal,
      coupon_id: spec.coupon ? couponMap.get(spec.coupon) || null : null,
      coupon_code: spec.coupon || null,
      discount_amount: totals.discountAmount,
      order_total: totals.orderTotal,
      payment_method: spec.method,
      payment_status: spec.payment,
      order_status: spec.status,
      delivery_instructions: 'Call on arrival. If I am out, leave the parcel with the security desk at the gate.',
    }).select().single();
    if (orderError) throw new Error(`order ${spec.number}: ${orderError.message}`);
    const order = orderRows;

    const { data: itemRows, error: itemError } = await admin.from('order_items').insert(lines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      product_variant_id: line.variant_id,
      variant_label: line.label,
      product_name: PRODUCTS.find(([slug]) => slug === line.slug)[1],
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: Math.round(line.unitPrice * line.quantity * 100) / 100,
    }))).select();
    if (itemError) throw new Error(`items ${spec.number}: ${itemError.message}`);

    await admin.from('payments').insert({
      order_id: order.id,
      method: spec.method,
      amount: totals.orderTotal,
      status: spec.payment,
      reference_number: spec.reference || (spec.method === 'card' ? `TXN-88${spec.number.replace(/\D/g, '')}` : null),
      bank_transfer_proof_url: spec.proof || null,
      paid_at: spec.payment === 'paid' ? spec.placed : null,
    });

    const history = [
      { status: 'placed', changed_at: spec.placed, changed_by_name: 'Recorded when the order was placed' },
    ];
    const staffId = staffIds.get('staff@example.com');
    const stagesAfter = { placed: [], confirmed: ['confirmed'], shipped: ['confirmed', 'shipped'], delivered: ['confirmed', 'shipped', 'delivered'] };
    (stagesAfter[spec.status] || []).forEach((stage) => {
      history.push({
        status: stage,
        changed_at: new Date(new Date(spec.placed).getTime() + 3600 * 1000 * (history.length + 1)).toISOString(),
        changed_by: staffId,
        changed_by_name: 'Nilanka Perera (Staff)',
      });
    });
    await admin.from('order_status_changes').insert(history.map((row) => ({ ...row, order_id: order.id })));

    const messages = history.map((row) => ({
      order_id: order.id,
      channel: 'email',
      sent_to: customerEmail,
      stage: row.status,
      status: 'sent',
      sent_at: row.changed_at,
    }));
    messages.push({
      order_id: order.id,
      channel: 'sms',
      sent_to: spec.phone,
      stage: 'confirmed',
      status: 'not_sent',
      sent_at: null,
    });
    await admin.from('order_messages').insert(messages);

    if (spec.coupon && couponMap.get(spec.coupon) && totals.discountAmount > 0) {
      await admin.from('coupon_uses').insert({
        coupon_id: couponMap.get(spec.coupon),
        order_id: order.id,
        customer_id: customerId,
        used_by_label: customerId ? spec.customer : `Guest · ${spec.phone}`,
        discount_given: totals.discountAmount,
        used_at: spec.placed,
      });
    }

    if (spec.number === 'DA-10355') {
      const canvas = itemRows.find((item) => item.variant_label === '42 · Slate Grey');
      const tee = itemRows.find((item) => item.variant_label === 'M · Charcoal');
      await admin.from('return_requests').insert([
        { order_id: order.id, order_item_id: canvas.id, customer_name: spec.customer, reason: 'The shoes are a size too small', requested_at: '2026-05-18T09:00:00Z', decision: 'pending' },
        { order_id: order.id, order_item_id: tee.id, customer_name: spec.customer, reason: 'The indigo colour is darker than the photo', requested_at: '2026-05-17T09:00:00Z', decision: 'approved', decision_note: 'Approved on 17 May 2026. Our team will call you to arrange the pickup.', decided_by: staffId, decided_at: '2026-05-17T15:00:00Z' },
      ]);
    }
  }

  // returns on the management queue and the decided table
  const returnSpecs = [
    ['DA-1048', 'handloom-cotton-kurta', 'L · Indigo', 'The navy is much darker than the photo, I would like to return it.', '2026-05-20T13:00:00Z', 'pending'],
    ['DA-1045', 'ceramic-dinner-set', '12 pieces · White', 'Two dinner plates arrived chipped, the box looked fine from outside.', '2026-05-20T12:00:00Z', 'pending'],
    ['DA-1039', 'leather-sandals', '42 · Brown', 'Both pairs are too tight across the strap, please send them back.', '2026-05-19T13:00:00Z', 'pending'],
    ['DA-1041', 'block-print-cotton-blouse', 'M · Rust', 'Wrong size delivered', '2026-05-17T10:00:00Z', 'approved', 'Keep the parcel aside, our courier will collect it.'],
    ['DA-1038', 'steel-water-bottle', '750 ml · Steel', 'Lid keeps leaking', '2026-05-16T10:00:00Z', 'rejected', 'No fault found when the bottle was tested here.'],
    ['DA-1035', 'everyday-cotton-panjabi', 'M · White', 'Ordered by mistake', '2026-05-15T10:00:00Z', 'approved', 'Any refund is handled outside the store.'],
    ['DA-1030', 'running-shoes', '40 · Yellow', 'Sole came apart', '2026-05-14T10:00:00Z', 'approved', 'Item collected on 10 May.'],
    ['DA-1027', 'silk-blend-scarf', 'One size · Rust', 'Seam came apart', '2026-05-13T10:00:00Z', 'approved', 'Courier booked to collect on 11 May.'],
    ['DA-1022', 'wireless-earbuds', 'One size · Black', 'Right earbud has no sound', '2026-05-11T10:00:00Z', 'rejected', 'Shows signs of use, so it cannot be taken back.'],
  ];

  for (const [number, slug, label, reason, requestedAt, decision, note] of returnSpecs) {
    const { data: order } = await admin.from('orders').select('id, customer_name').eq('order_number', number).maybeSingle();
    if (!order) continue;
    const { data: item } = await admin.from('order_items').select('id').eq('order_id', order.id).eq('variant_label', label).maybeSingle();
    if (!item) continue;
    const { data: existing } = await admin.from('return_requests').select('id').eq('order_item_id', item.id).maybeSingle();
    if (existing) continue;
    await admin.from('return_requests').insert({
      order_id: order.id,
      order_item_id: item.id,
      customer_name: order.customer_name,
      reason,
      requested_at: requestedAt,
      decision,
      decision_note: note || null,
      decided_by: decision === 'pending' ? null : staffIds.get('staff@example.com'),
      decided_at: decision === 'pending' ? null : new Date(new Date(requestedAt).getTime() + 86400000).toISOString(),
    });
  }

  // 8. reviews, in the words the approved screens show
  const reviewSpecs = [
    ['handloom-cotton-kurta', 'Ayesha Fernando', 5, 'Fabric is a good weight and the indigo did not run in the first wash. Size M fits true.', 'shown', '2026-05-12T09:00:00Z'],
    ['kenda-canvas-sneakers', 'Mohamed Rizwan', 2, 'The size 42 runs small, I would take the next size up. Delivery to Colombo 05 was quick though.', 'shown', '2026-05-09T09:00:00Z'],
    ['rechargeable-table-lamp', 'Dilrukshi Jayawardena', 1, 'Arrived with a cracked shade and it stopped holding a charge on the second day.', 'hidden', '2026-05-06T09:00:00Z'],
    ['stainless-steel-water-bottle', 'Tharindu Silva', 4, 'Keeps water cold through the whole working day. The cap thread is stiff for the first few days.', 'shown', '2026-05-04T09:00:00Z'],
    ['kenda-canvas-sneakers', 'Nimali Weerasinghe', 1, 'Second pair I have ordered and the sole came away at the toe again.', 'hidden', '2026-05-02T09:00:00Z'],
    ['meridian-cotton-oxford-shirt', 'Ayesha Fernando', 5, 'Good cotton, and the fit is exactly right for me. Washed it twice and it has not shrunk. Ordered a second one in white.', 'shown', '2026-05-04T09:00:00Z'],
    ['meridian-cotton-oxford-shirt', 'Nuwan Perera', 4, 'Nice shirt for the price and it arrived neatly folded. The sleeves run slightly long on me, but the navy is exactly as shown.', 'shown', '2026-04-28T09:00:00Z'],
    ['meridian-cotton-oxford-shirt', 'Dilani Silva', 5, 'Ordered two, one navy and one olive. Both reached Kandy in three days and the size guide was accurate.', 'shown', '2026-04-19T09:00:00Z'],
    ['meridian-cotton-oxford-shirt', 'Ravi Jayawardena', 3, 'The olive is a little darker in person than in the photos. Stitching is neat and the collar sits well.', 'shown', '2026-04-06T09:00:00Z'],
    ['handloom-cotton-kurta', 'Amara Perera', 4, 'Neat stitching and the cloth is soft. I took size L and it fits well after one wash.', 'shown', '2026-05-12T11:00:00Z'],
  ];

  const shopperId = customerIds.get('shopper@example.com');
  for (const [slug, shopper, rating, text, visibility, writtenAt] of reviewSpecs) {
    const productId = productMap.get(slug);
    if (!productId) continue;
    const { data: existing } = await admin
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('shopper_name', shopper)
      .eq('review_text', text)
      .maybeSingle();
    if (existing) continue;
    const emailOwner = CUSTOMERS.find((customer) => customer.full_name === shopper);
    const customerId = emailOwner ? customerIds.get(emailOwner.email) : shopperId;
    if (!customerId) continue;
    await admin.from('reviews').insert({
      product_id: productId,
      customer_id: customerId,
      shopper_name: shopper,
      rating,
      review_text: text,
      written_at: writtenAt,
      visibility,
    });
  }

  // 9. the demo shopper's own addresses, wishlist and cart, as the approved screens show them
  if (shopperId) {
    const { data: existingAddresses } = await admin.from('delivery_addresses').select('id').eq('customer_id', shopperId);
    if (!existingAddresses?.length) {
      await admin.from('delivery_addresses').insert([
        { customer_id: shopperId, label: 'Home', address_line_1: '42 Temple Road, Apartment 3B', address_line_2: 'Off High Level Road', city_or_area: 'Nugegoda', delivery_area_id: areaMap.get('Nugegoda'), phone: '+94 71 448 2190', is_default: true },
        { customer_id: shopperId, label: 'Office', address_line_1: '18 Galle Road, Floor 4', address_line_2: 'Colpetty', city_or_area: 'Colombo 03', delivery_area_id: areaMap.get('Colombo 03'), phone: '+94 77 512 6034', is_default: false },
        { customer_id: shopperId, label: "Parents' house", address_line_1: '9 Lake Drive', address_line_2: 'Off Kandy Road', city_or_area: 'Kandy', delivery_area_id: areaMap.get('Kandy'), phone: '+94 81 223 7788', is_default: false },
      ]);
    }

    const wishlist = ['lumora-cotton-kurta', 'riva-linen-shirt', 'kenda-canvas-sneakers', 'solis-ceramic-mug-set'];
    await admin.from('wishlist_items').upsert(
      wishlist.map((slug) => ({ customer_id: shopperId, product_id: productMap.get(slug) })),
      { onConflict: 'customer_id,product_id', ignoreDuplicates: true },
    );

    const { data: existingCart } = await admin.from('cart_items').select('id').eq('customer_id', shopperId);
    if (!existingCart?.length) {
      await admin.from('cart_items').insert([
        { customer_id: shopperId, product_variant_id: variantOf('linen-kurta-shirt', 'M · Charcoal'), quantity: 2 },
        { customer_id: shopperId, product_variant_id: variantOf('aero-running-shoes', '42 · Slate Grey'), quantity: 3 },
        { customer_id: shopperId, product_variant_id: variantOf('canvas-tote-bag', 'One size · Natural'), quantity: 1 },
      ]);
    }
  }

  console.log('✅ Seeded the store: categories, products, stock, orders, returns, reviews, coupons, areas, staff and the demo accounts.');
  console.log(`   Demo accounts (never shown in the interface): ${STAFF[0].email}, ${STAFF[1].email}, ${CUSTOMERS[0].email} — password ${DEMO_PASSWORD}`);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
});
