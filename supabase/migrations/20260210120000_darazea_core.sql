-- DarazEA core schema.
--
-- The 20 tables from the approved application specification, their foreign keys, Row Level
-- Security on every one of them, and the two helper functions the policies read. Single-seller
-- store: everyone may browse the catalogue; a shopper owns their own rows; management (Staff and
-- Store Owner) read orders, customers, returns and reviews; only the Store Owner may touch
-- delivery fees, payments, store settings and staff accounts.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- catalogue
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  parent_category_id uuid references categories (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid not null references categories (id) on delete restrict,
  description text,
  photos text[] not null default '{}',
  price numeric(12, 2) not null check (price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or sale_price >= 0),
  status text not null default 'shown' check (status in ('shown', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_status_idx on products (status);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size text,
  colour text,
  stock_count integer not null default 0 check (stock_count >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size, colour)
);
create index if not exists product_variants_product_idx on product_variants (product_id);

-- ---------------------------------------------------------------------------
-- shoppers
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text not null,
  sign_in_method text not null default 'email',
  password_hash text,
  google_subject_id text,
  joined_at timestamptz not null default now(),
  account_status text not null default 'active' check (account_status in ('active', 'off'))
);
create index if not exists customers_email_idx on customers (lower(email));

create table if not exists delivery_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  delivery_fee numeric(12, 2) not null check (delivery_fee > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  label text not null,
  address_line_1 text not null,
  address_line_2 text,
  city_or_area text not null,
  delivery_area_id uuid not null references delivery_areas (id) on delete restrict,
  phone text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists delivery_addresses_customer_idx on delivery_addresses (customer_id);

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete cascade,
  guest_session_id text,
  product_variant_id uuid not null references product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  added_at timestamptz not null default now(),
  check (customer_id is not null or guest_session_id is not null)
);
create index if not exists cart_items_customer_idx on cart_items (customer_id);
create index if not exists cart_items_guest_idx on cart_items (guest_session_id);

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  minimum_order_value numeric(12, 2) not null default 0,
  expires_at date,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0,
  applies_to text not null default 'all' check (applies_to in ('all', 'products', 'categories')),
  applies_to_products uuid[] not null default '{}',
  applies_to_categories uuid[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists coupons_code_idx on coupons (upper(code));

-- ---------------------------------------------------------------------------
-- people — before the tables that record who moved an order on
-- ---------------------------------------------------------------------------
create table if not exists staff_members (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'staff' check (role in ('staff', 'store_owner')),
  status text not null default 'active' check (status in ('active', 'off')),
  password_hash text,
  google_subject_id text,
  added_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  placed_at timestamptz not null default now(),
  customer_id uuid references customers (id) on delete set null,
  is_guest_order boolean not null default true,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  delivery_address text not null,
  delivery_area_id uuid not null references delivery_areas (id) on delete restrict,
  delivery_area_name text not null,
  delivery_fee numeric(12, 2) not null check (delivery_fee > 0),
  items_subtotal numeric(12, 2) not null check (items_subtotal >= 0),
  coupon_id uuid references coupons (id) on delete set null,
  coupon_code text,
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  order_total numeric(12, 2) not null check (order_total >= 0),
  payment_method text not null,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed')),
  order_status text not null default 'placed' check (order_status in ('placed', 'confirmed', 'shipped', 'delivered')),
  delivery_instructions text,
  created_at timestamptz not null default now()
);
create index if not exists orders_customer_idx on orders (customer_id);
create index if not exists orders_status_idx on orders (order_status);
create index if not exists orders_placed_idx on orders (placed_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  product_variant_id uuid references product_variants (id) on delete set null,
  variant_label text,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);
create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  method text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null check (status in ('unpaid', 'pending', 'paid', 'failed')),
  reference_number text,
  bank_transfer_proof_url text,
  paid_at timestamptz,
  recorded_by uuid references staff_members (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists payments_order_idx on payments (order_id);

create table if not exists order_status_changes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  status text not null check (status in ('placed', 'confirmed', 'shipped', 'delivered')),
  changed_at timestamptz not null default now(),
  changed_by uuid references staff_members (id) on delete set null,
  changed_by_name text
);
create index if not exists order_status_changes_order_idx on order_status_changes (order_id);

create table if not exists order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  sent_to text not null,
  stage text not null,
  status text not null check (status in ('sent', 'not_sent')),
  sent_at timestamptz
);
create index if not exists order_messages_order_idx on order_messages (order_id);

create table if not exists return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  order_item_id uuid not null references order_items (id) on delete cascade,
  customer_name text not null,
  reason text not null,
  requested_at timestamptz not null default now(),
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'rejected')),
  decision_note text,
  decided_by uuid references staff_members (id) on delete set null,
  decided_at timestamptz,
  unique (order_item_id)
);
create index if not exists return_requests_order_idx on return_requests (order_id);

-- ---------------------------------------------------------------------------
-- reviews, people, store settings
-- ---------------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete cascade,
  shopper_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  written_at timestamptz not null default now(),
  visibility text not null default 'shown' check (visibility in ('shown', 'hidden'))
);
create index if not exists reviews_product_idx on reviews (product_id);

create table if not exists coupon_uses (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons (id) on delete cascade,
  order_id uuid not null references orders (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  used_by_label text not null,
  discount_given numeric(12, 2) not null check (discount_given >= 0),
  used_at timestamptz not null default now()
);

create table if not exists store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  support_email text not null,
  support_phone text not null,
  new_order_alert_recipients text[] not null default '{}',
  currency text not null default 'Sri Lankan Rupees (LKR — Rs.)',
  updated_at timestamptz not null default now()
);

create table if not exists payment_method_settings (
  id uuid primary key default gen_random_uuid(),
  method text not null unique check (method in ('card', 'wallet', 'bank_transfer', 'paypal', 'cod')),
  is_enabled boolean not null default false,
  shopper_instructions text,
  store_account_details jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- role helpers (security definer so a policy can read staff_members safely)
-- ---------------------------------------------------------------------------
create or replace function public.is_management()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select status = 'active' from staff_members where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select status = 'active' and role = 'store_owner' from staff_members where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — every table, before it holds real data
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table customers enable row level security;
alter table delivery_areas enable row level security;
alter table delivery_addresses enable row level security;
alter table wishlist_items enable row level security;
alter table cart_items enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table order_status_changes enable row level security;
alter table order_messages enable row level security;
alter table return_requests enable row level security;
alter table reviews enable row level security;
alter table staff_members enable row level security;
alter table coupon_uses enable row level security;
alter table store_settings enable row level security;
alter table payment_method_settings enable row level security;

-- catalogue: anyone may read what the store shows
create policy categories_read on categories for select using (true);
create policy categories_manage on categories for all using (public.is_management()) with check (public.is_management());

create policy products_read on products for select using (status = 'shown' or public.is_management());
create policy products_manage on products for all using (public.is_management()) with check (public.is_management());

create policy variants_read on product_variants for select using (
  exists (select 1 from products p where p.id = product_variants.product_id and (p.status = 'shown' or public.is_management()))
);
create policy variants_manage on product_variants for all using (public.is_management()) with check (public.is_management());

-- shoppers own their rows
create policy customers_self_read on customers for select using (id = auth.uid() or public.is_management());
create policy customers_self_write on customers for update using (id = auth.uid()) with check (id = auth.uid());
create policy customers_insert_self on customers for insert with check (id = auth.uid());

create policy addresses_own on delivery_addresses for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy wishlist_own on wishlist_items for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
-- a signed-in shopper's cart; a guest cart is written by the server with the service-role key
create policy cart_own on cart_items for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- delivery areas and payment methods: read the ones shoppers may choose
create policy areas_read on delivery_areas for select using (is_active or public.is_management());
create policy areas_manage on delivery_areas for all using (public.is_owner()) with check (public.is_owner());

create policy payment_methods_read on payment_method_settings for select using (is_enabled or public.is_management());
create policy payment_methods_manage on payment_method_settings for all using (public.is_owner()) with check (public.is_owner());

create policy store_settings_read on store_settings for select using (true);
create policy store_settings_manage on store_settings for all using (public.is_owner()) with check (public.is_owner());

-- coupons are marketing codes shoppers type in, so they may be read; only management changes them
create policy coupons_read on coupons for select using (is_active or public.is_management());
create policy coupons_manage on coupons for all using (public.is_management()) with check (public.is_management());
create policy coupon_uses_read on coupon_uses for select using (public.is_management());
create policy coupon_uses_write on coupon_uses for insert with check (public.is_management());

-- an order belongs to its shopper; management reads every order
create policy orders_read on orders for select using (customer_id = auth.uid() or public.is_management());
create policy orders_manage on orders for update using (public.is_management()) with check (public.is_management());

create policy order_items_read on order_items for select using (
  public.is_management() or exists (select 1 from orders o where o.id = order_items.order_id and o.customer_id = auth.uid())
);

create policy payments_read on payments for select using (
  public.is_management() or exists (select 1 from orders o where o.id = payments.order_id and o.customer_id = auth.uid())
);
create policy payments_manage on payments for all using (public.is_management()) with check (public.is_management());

create policy status_changes_read on order_status_changes for select using (
  public.is_management() or exists (select 1 from orders o where o.id = order_status_changes.order_id and o.customer_id = auth.uid())
);
create policy status_changes_write on order_status_changes for insert with check (public.is_management());

create policy messages_read on order_messages for select using (
  public.is_management() or exists (select 1 from orders o where o.id = order_messages.order_id and o.customer_id = auth.uid())
);
create policy messages_write on order_messages for insert with check (public.is_management());

create policy returns_read on return_requests for select using (
  public.is_management() or exists (select 1 from orders o where o.id = return_requests.order_id and o.customer_id = auth.uid())
);
create policy returns_write on return_requests for insert with check (
  exists (select 1 from orders o where o.id = return_requests.order_id and o.customer_id = auth.uid())
);
create policy returns_manage on return_requests for update using (public.is_management()) with check (public.is_management());

-- reviews: shown to everyone, written by their own shopper, hidden or restored by management
create policy reviews_read on reviews for select using (visibility = 'shown' or customer_id = auth.uid() or public.is_management());
create policy reviews_write on reviews for insert with check (customer_id = auth.uid());
create policy reviews_manage on reviews for update using (public.is_management()) with check (public.is_management());

-- staff accounts: the owner manages them; a signed-in member may read their own row
create policy staff_self_read on staff_members for select using (id = auth.uid() or public.is_owner());
create policy staff_manage on staff_members for all using (public.is_owner()) with check (public.is_owner());
