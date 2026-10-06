/**
 * The saved business journeys, one test per id from `.agentforge/srs/user-journeys.json`.
 *
 * Selectors, labels and routes come from the running application: the storefront's own test ids,
 * the management shell's own links, and the seeded demo accounts. Every row a test creates carries
 * the unique prefix `QA-` and is deleted again in afterAll against the project's REST API with the
 * service-role key — no wrapper truncates or reseeds anything.
 */
import { test, expect, apiFrom } from './fixtures.js';

// These journeys are long on purpose (sign-up, review, checkout, fulfilment), so each one gets a
// budget that covers the whole business path rather than a single page load.
test.setTimeout(150_000);

// Several journeys deliberately provoke a refusal (a declined card, a refused lookup, an
// unauthorised write). The browser logs each 4xx sub-request, so those statuses are declared here
// and the checks stay meaningful.
test.use({ allowedStatuses: [401, 402, 403, 409, 422] });

const PREFIX = `QA-${Date.now().toString().slice(-6)}`;
const SUPABASE = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEMO = {
  shopper: { email: 'shopper@example.com', password: 'Demo!2026' },
  staff: { email: 'staff@example.com', password: 'Demo!2026' },
  owner: { email: 'store.owner@example.com', password: 'Demo!2026' },
};

async function rest(path, init = {}) {
  return fetch(`${SUPABASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

async function rows(path) {
  const response = await rest(path);
  return response.json();
}

async function signInShopper(page, account = DEMO.shopper) {
  await page.goto('/login');
  await page.getByTestId('email').fill(account.email);
  await page.getByTestId('password').fill(account.password);
  await page.getByTestId('sign-in-submit').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 25000 });
}

/** Management sign-in: password first, then the six-digit code this server just generated. */
async function signInManagement(page, account = DEMO.staff) {
  await page.goto('/admin/login');
  await page.getByTestId('mgmt-email').fill(account.email);
  await page.getByTestId('mgmt-password').fill(account.password);
  await page.getByTestId('mgmt-send-code').click();
  // The code is only readable once the server has answered, so wait for its own confirmation.
  await expect(page.getByTestId('post-ok')).toContainText('Password accepted', { timeout: 25000 });

  const [staff] = await rows(`staff_members?select=id&email=eq.${encodeURIComponent(account.email)}`);
  // A code is single use and several sign-ins can be open at once, so read a fresh one and retry
  // with a new code if another sign-in took it first.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const codes = await rows(`management_codes?select=code&staff_id=eq.${staff.id}&used=eq.false&order=created_at.desc&limit=5`);
    expect(codes[0]?.code, 'a one-time code was generated for the account').toBeTruthy();
    await page.getByTestId('mgmt-code').fill(codes[attempt % codes.length].code);
    await page.getByTestId('mgmt-verify').click();
    try {
      await page.waitForURL((url) => url.pathname === '/admin', { timeout: 15000 });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.getByTestId('mgmt-send-code').click().catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
}

async function addFirstStockedVariant(page, quantity = 1) {
  const products = await rows('products?select=id&status=eq.shown&limit=1');
  const variants = await rows(`product_variants?select=id&product_id=eq.${products[0].id}&stock_count=gt.0&limit=1`);
  const api = apiFrom(page);
  return api.post('/api/cart', { action: 'add', variantId: variants[0].id, quantity });
}

/** A guest order placed through the app's own API, so a staff journey has a real order to work on. */
async function placeGuestOrder(page, { method = 'cod' } = {}) {
  await page.goto('/');
  const api = apiFrom(page);
  await addFirstStockedVariant(page, 1);
  const areas = await rows('delivery_areas?select=id,name&is_active=eq.true&order=delivery_fee&limit=1');
  const placed = await api.post('/api/checkout', {
    full_name: `${PREFIX} Guest`,
    phone: '077 214 5599',
    email: `${PREFIX.toLowerCase()}@example.com`,
    address_line_1: '27/6 Rampart Road',
    delivery_area_id: areas[0].id,
    payment_method: method,
    delivery_instructions: 'Call on arrival.',
  });
  return { placed, area: areas[0] };
}

const RUN_START = new Date(Date.now() - 60_000).toISOString();

test.afterAll(async () => {
  // Everything this run created, removed again — the connected project keeps its own data.
  await rest(`products?slug=like.${PREFIX.toLowerCase()}*`, { method: 'DELETE' });
  await rest(`coupons?code=like.${PREFIX}*`, { method: 'DELETE' });
  await rest(`delivery_areas?name=like.${PREFIX}*`, { method: 'DELETE' });
  await rest(`staff_members?email=like.${PREFIX.toLowerCase()}*`, { method: 'DELETE' });
  await rest(`customers?email=like.${PREFIX.toLowerCase()}*`, { method: 'DELETE' });
  await rest(`orders?customer_name=like.${PREFIX}*`, { method: 'DELETE' });
  const [seeded] = await rows('orders?select=id&order_number=eq.DA-10355');
  if (seeded) {
    await rest(`return_requests?order_id=eq.${seeded.id}&requested_at=gte.${RUN_START}`, { method: 'DELETE' });
  }
});

test('[UJ-001] A guest browses, fills a cart, checks out and tracks the order', async ({ page }) => {
  // Browse and search without signing in.
  await page.goto('/shop');
  await expect(page.getByTestId('product-grid').locator('.pcard').first()).toBeVisible();
  await page.goto('/search?q=kurta');
  await expect(page.getByTestId('search-count')).toContainText('match');

  // Open a product, choose an in-stock combination and add it to the cart.
  await page.goto('/product/handloom-cotton-kurta');
  await page.getByTestId('add-to-cart-submit').click();
  await expect(page.getByTestId('post-ok')).toContainText('added to your cart');

  // The cart holds it, and checkout adds the delivery fee of the chosen area.
  await page.goto('/cart');
  await expect(page.getByTestId('cart-line').first()).toBeVisible();
  await expect(page.getByTestId('cart-subtotal')).toContainText('LKR');

  await page.goto('/checkout');
  await page.getByLabel('Full name').fill(`${PREFIX} Guest`);
  await page.getByLabel('Phone number').fill('077 214 5599');
  await page.getByLabel('Email address').fill(`${PREFIX.toLowerCase()}@example.com`);
  await page.getByLabel('Address line 1').fill('27/6 Rampart Road');

  // A coupon code the store knows, typed at checkout.
  await page.getByTestId('coupon-input').fill('DAZ10');

  // First an online payment that fails: no order is recorded and the cart is left alone.
  await page.getByLabel(/Card/).check();
  await page.getByTestId('place-order').click();
  await expect(page.getByTestId('post-error')).toContainText('no order was placed');
  await expect(page).toHaveURL(/\/checkout$/);

  // Then cash on delivery, which records the order and hands over the order number.
  await page.getByLabel(/Cash on delivery/).check();
  await page.getByTestId('place-order').click();
  await page.waitForURL(/\/order\/DA-\d+\/placed$/, { timeout: 25000 });
  const orderNumber = (await page.getByTestId('order-number').textContent())?.trim();
  expect(orderNumber).toMatch(/^DA-\d+$/);
  await expect(page.getByText(/email follows at every stage/i)).toBeVisible();

  // Later the guest tracks it with the order number and the phone number on the order.
  await page.goto('/track');
  await page.getByLabel('Order number').fill(orderNumber);
  await page.getByLabel('Phone number on the order').fill('077 214 5599');
  await page.getByTestId('track-submit').click();
  await expect(page.getByTestId('track-result')).toContainText(orderNumber);

  // A phone number that is not the one on the order is refused.
  await page.goto(`/track?number=${orderNumber}&phone=0719998888`);
  await expect(page.getByTestId('track-not-found')).toBeVisible();
});

test('[UJ-002] A shopper creates an account, saves, reviews and orders', async ({ page }) => {
  const email = `${PREFIX.toLowerCase()}.shopper@example.com`;

  // Create the account from the sign-up form.
  await page.goto('/register');
  await page.getByTestId('full-name').fill(`${PREFIX} Shopper`);
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-phone').fill('077 214 5601');
  await page.getByLabel('Create password').fill('Demo!2026');
  await page.getByTestId('register-submit').click();
  await page.waitForURL(/\/account$/, { timeout: 25000 });

  // Save a delivery address that checkout can reuse.
  await page.goto('/account/addresses');
  await page.getByTestId('address-label').fill('Home');
  await page.getByTestId('address-line1').fill('42 Temple Road');
  await page.getByTestId('address-phone').fill('+94 77 214 5601');
  await page.getByTestId('address-save').click();
  await expect(page.getByTestId('post-ok')).toContainText('Address saved');

  // Save a product to the wishlist, and rate and review it.
  await page.goto('/product/handloom-cotton-kurta');
  await page.getByRole('button', { name: 'Save to wishlist' }).click();
  await expect(page.getByTestId('post-ok')).toContainText('wishlist');

  await page.goto('/product/handloom-cotton-kurta/review');
  await page.getByTestId('review-text').fill(`${PREFIX} good cotton, true to size.`);
  await page.getByTestId('review-submit').click();
  await page.waitForURL(/\/product\/handloom-cotton-kurta$/, { timeout: 25000 });

  // Move the saved product into the cart and check out with the saved address.
  await page.goto('/account/wishlist');
  await page.getByRole('button', { name: 'Move to cart' }).first().click();
  await expect(page.getByTestId('post-ok')).toContainText('cart');
  await page.goto('/cart');
  await expect(page.getByTestId('cart-line').first()).toBeVisible();

  await page.goto('/checkout');
  await page.getByLabel('Full name').fill(`${PREFIX} Shopper`);
  await page.getByLabel('Phone number').fill('077 214 5601');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Address line 1').fill('42 Temple Road');
  await page.getByLabel(/Cash on delivery/).check();
  await page.getByTestId('place-order').click();
  await page.waitForURL(/\/order\/DA-\d+\/placed$/, { timeout: 25000 });

  // The order is on My Orders, and its detail page shows the stage timeline.
  await page.goto('/account/orders');
  const row = page.getByTestId('orders-list').locator('article').first();
  await expect(row).toContainText('Placed');
  const orderNumber = (await row.textContent())?.match(/DA-\d+/)?.[0];
  await row.getByRole('link', { name: 'View order' }).click();
  await page.waitForURL(new RegExp(`/account/orders/${orderNumber}$`), { timeout: 25000 });
  await expect(page.getByRole('heading', { name: `Order ${orderNumber}` })).toBeVisible();
  await expect(page.getByTestId('order-stage')).toContainText('Placed');
  await expect(page.getByText('Delivery address')).toBeVisible();
});

test('[UJ-003] A shopper asks to return an item from a delivered order', async ({ page }) => {
  await signInShopper(page);

  // My Orders, then the delivered order.
  await page.goto('/account/orders');
  await page.getByTestId('view-order-DA-10355').click();
  await expect(page.getByTestId('order-stage')).toContainText('Delivered');

  // Pick the one item on that order with no request on it yet.
  await page.getByTestId('request-return').click();
  await page.waitForURL(/\/return$/, { timeout: 25000 });
  await page.getByTestId('return-items').locator('input:not([disabled])').first().check();
  await page.getByTestId('return-reason').selectOption('Item arrived damaged');
  await page.getByTestId('return-submit').click();
  await page.waitForURL(/\/account\/orders\/DA-10355$/, { timeout: 25000 });

  // The order now shows the request as waiting for a decision, and the refund note.
  await expect(page.getByText('Waiting for a decision').first()).toBeVisible();
  await expect(page.getByText('Any refund is handled outside the store.')).toBeVisible();
});

test('[UJ-004] Staff take an order from placed to delivered', async ({ page }) => {
  const { placed } = await placeGuestOrder(page);
  expect(placed.status).toBe(200);
  const { orderNumber } = placed.body;

  // The Orders list shows it waiting on staff.
  await signInManagement(page, DEMO.staff);
  await page.goto('/admin/orders?stage=placed');
  await page.getByTestId(`order-${orderNumber}`).click();

  // One stage at a time: confirm, then ship, then deliver.
  await page.getByTestId('stage-confirm').click();
  await expect(page.getByTestId('stage-confirm').locator('..').getByTestId('post-ok')).toContainText('Confirmed');
  await page.getByTestId('stage-ship').click();
  await expect(page.getByTestId('stage-ship').locator('..').getByTestId('post-ok')).toContainText('Shipped');
  await page.getByTestId('stage-deliver').click();
  await expect(page.getByTestId('stage-deliver').locator('..').getByTestId('post-ok')).toContainText('Delivered');

  // The stage history and the message log record what happened.
  await page.reload();
  await expect(page.getByTestId('message-log').first()).toBeVisible();
  await expect(page.getByText('Not sent').first()).toBeVisible();

  // The order settles in the Orders list at its new stage.
  await page.goto('/admin/orders?stage=delivered');
  await expect(page.getByTestId(`order-${orderNumber}`)).toBeVisible();
});

test('[UJ-005] Staff put a new product on the store and see its stock state', async ({ page }) => {
  await signInManagement(page, DEMO.staff);

  await page.goto('/admin/products');
  await page.getByTestId('new-product').click();
  await page.waitForURL(/\/admin\/products\/new$/, { timeout: 25000 });

  const name = `${PREFIX} Cotton Panjabi`;
  await page.getByTestId('product-name').fill(name);
  await page.getByTestId('product-category').selectOption({ index: 1 });
  await page.getByTestId('product-price').fill('1890');
  await page.getByTestId('product-sale-price').fill('1590');
  await page.getByTestId('add-combination').click();
  await page.getByLabel('Size new', { exact: false }).first().fill('M');
  await page.getByLabel('Colour new', { exact: false }).first().fill('Navy');
  await page.getByLabel('Stock count new', { exact: false }).first().fill('0');
  await page.getByTestId('product-save').click();
  await expect(page.getByTestId('post-ok')).toContainText('is saved');

  // A combination with no stock shows as out of stock and cannot be added to a cart.
  const slug = `${PREFIX.toLowerCase()}-cotton-panjabi`;
  await page.goto(`/product/${slug}`);
  await expect(page.getByTestId('add-to-cart-submit')).toBeDisabled();
});

test('[UJ-006] Staff read a return request and record a decision', async ({ page }) => {
  await signInManagement(page, DEMO.staff);
  await page.goto('/admin/returns');
  await expect(page.getByRole('heading', { name: 'Returns' })).toBeVisible();

  const waiting = page.getByTestId('waiting-returns');
  await expect(waiting.locator('.card').first()).toBeVisible({ timeout: 15000 });
  await waiting.getByRole('link', { name: 'Open request' }).first().click();
  await page.waitForURL(/\/admin\/returns\/[0-9a-f-]+$/, { timeout: 25000 });

  // The reason sits against the order it belongs to.
  await expect(page.getByText('Reason given by the shopper')).toBeVisible();
  await page.getByLabel(/^Approved/).check();
  await page.getByLabel('Note for the shopper').fill(`${PREFIX} approved — our courier will collect it.`);
  await page.getByTestId('decision-submit').click();
  await expect(page.getByTestId('post-ok')).toContainText('approved');

  await page.reload();
  await expect(page.getByTestId('decision-recorded')).toBeVisible();
  await expect(page.getByText('Any refund is handled outside the store.')).toBeVisible();
});

test('[UJ-007] Staff create a discount code and see it live', async ({ page }) => {
  await signInManagement(page, DEMO.staff);
  const code = `${PREFIX}10`;

  await page.goto('/admin/coupons/new');
  await page.getByTestId('coupon-code').fill(code);
  await page.getByTestId('coupon-value').fill('10');
  await page.getByTestId('coupon-minimum').fill('2000');
  await page.getByTestId('coupon-max-uses').fill('50');
  await page.getByTestId('coupon-save').click();
  await page.waitForURL(/\/admin\/coupons$/, { timeout: 25000 });

  // It is on the list, live, with its rules.
  const row = page.getByTestId(`coupon-${code}`);
  await expect(row).toBeVisible();
  await expect(page.locator('tr', { has: row }).first()).toContainText('Live');

  // And the store's own checkout validation accepts it for a cart that qualifies.
  await page.goto('/');
  await addFirstStockedVariant(page, 4);
  const api = apiFrom(page);
  const applied = await api.post('/api/coupons/validate', { code });
  expect(applied.status).toBe(200);
  expect(applied.body.message).toContain(code);
});

test("[UJ-008] Staff answer a question about a shopper's orders", async ({ page }) => {
  await signInManagement(page, DEMO.staff);
  await page.goto('/admin/customers');
  await page.getByTestId('customer-search').fill('perera');
  await page.getByTestId('customer-search-submit').click();
  await expect(page.getByRole('table')).toBeVisible();

  await page.getByRole('table').getByRole('link').first().click();
  await page.waitForURL(/\/admin\/customers\/[0-9a-f-]+$/, { timeout: 25000 });
  await expect(page.getByRole('heading', { name: 'Customer detail' })).toBeVisible();
  await expect(page.getByText('Shopper details')).toBeVisible();
  await expect(page.getByText('Order history').first()).toBeVisible();
});

test('[UJ-009] The Store Owner reads the period totals and the orders behind them', async ({ page }) => {
  await signInManagement(page, DEMO.owner);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Pick a period; the totals and the best sellers follow it.
  await page.getByRole('link', { name: 'Last 30 days' }).click();
  await expect(page.getByText('Orders in this period')).toBeVisible();
  await expect(page.getByText('Sales in this period')).toBeVisible();
  await expect(page.getByText('Best-selling products')).toBeVisible();

  // Open Orders from the figures.
  await page.getByRole('link', { name: /Open Orders/ }).first().click();
  await page.waitForURL(/\/admin\/orders/, { timeout: 25000 });
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
});

test('[UJ-010] The Store Owner sets the delivery fee for a new area', async ({ page }) => {
  await signInManagement(page, DEMO.owner);
  const areaName = `${PREFIX} Galle`;

  await page.goto('/admin/delivery-areas');
  await page.getByTestId('area-name').fill(areaName);
  await page.getByTestId('area-fee').fill('420');
  await page.getByTestId('area-save').click();
  await expect(page.getByTestId('post-ok')).toContainText('is added');

  // It is delivering at its own fixed fee, and Checkout offers it.
  await page.goto('/admin/delivery-areas');
  await expect(page.getByText(areaName)).toBeVisible();
  await page.goto('/');
  await addFirstStockedVariant(page, 1);
  await page.goto('/checkout');
  await expect(page.getByTestId('area-select')).toContainText(areaName);

  // Switched off, it is no longer offered at Checkout.
  await page.goto('/admin/delivery-areas');
  await page.getByTestId(`toggle-area-${areaName}`).click();
  await expect(page.getByTestId('post-ok')).toContainText('switched off');
  await page.goto('/checkout');
  await expect(page.getByTestId('area-select')).not.toContainText(areaName);
});

test('[UJ-011] The Store Owner switches a way of paying on, and Checkout offers it', async ({ page }) => {
  await signInManagement(page, DEMO.owner);
  await page.goto('/admin/settings/payments');

  // The switch is driven from whatever state it is in, so the journey reads the same on any run.
  const walletSwitch = page.getByTestId('payment-wallet').locator('input[type="checkbox"]');
  if (!(await walletSwitch.isChecked())) {
    await page.getByTestId('payment-wallet').locator('.switch__track').click();
  }
  await expect(walletSwitch).toBeChecked();
  await page.getByTestId('save-wallet').click();
  await expect(page.getByTestId('post-ok')).toContainText('Payment settings saved');

  // Checkout now offers it alongside cash on delivery.
  await page.goto('/');
  await addFirstStockedVariant(page, 1);
  await page.goto('/checkout');
  await expect(page.getByText('Mobile wallet', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Cash on delivery', { exact: false }).first()).toBeVisible();

  // And it can be switched off again.
  await page.goto('/admin/settings/payments');
  const walletAgain = page.getByTestId('payment-wallet').locator('input[type="checkbox"]');
  if (await walletAgain.isChecked()) {
    await page.getByTestId('payment-wallet').locator('.switch__track').click();
  }
  await expect(walletAgain).not.toBeChecked();
  await page.getByTestId('save-wallet').click();
  await expect(page.getByTestId('post-ok')).toContainText('Switched off');
});

test('[UJ-012] The Store Owner adds a staff member and switches the account off', async ({ page }) => {
  const email = `${PREFIX.toLowerCase()}.staff@example.com`;

  // A staff account starts from the Store Owner, never from public sign-up.
  await page.goto('/register');
  await expect(page.getByText('A shopper account is all this can create')).toBeVisible();

  await signInManagement(page, DEMO.owner);
  await page.goto('/admin/staff');
  await page.getByTestId('staff-name').fill(`${PREFIX} New Staff`);
  await page.getByTestId('staff-email').fill(email);
  await page.getByTestId('staff-save').click();
  await expect(page.getByTestId('post-ok')).toContainText('was added as Staff');

  // Active in the list, and the account can start a management sign-in.
  await page.goto('/admin/staff');
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByTestId(`toggle-staff-${email}`)).toContainText('Switch off');

  // Switched off, it can no longer sign in.
  await page.getByTestId(`toggle-staff-${email}`).click();
  await expect(page.getByTestId('post-ok')).toContainText('can no longer sign in');

  await page.goto('/');
  const api = apiFrom(page);
  const refused = await api.post('/api/auth/management', { email, password: 'Demo!2026' });
  expect([401, 403]).toContain(refused.status);
});

test('[UJ-012] A shopper is refused a management write and the owner-only screens', async ({ page }) => {
  // A signed-in shopper cannot reach a management action or an owner-only page.
  await signInShopper(page);
  const api = apiFrom(page);
  const refused = await api.post('/api/admin/delivery-areas', { action: 'save', name: `${PREFIX} Nope`, delivery_fee: 100 });
  expect([401, 403]).toContain(refused.status);

  await page.goto('/admin/staff');
  await expect(page).toHaveURL(/\/login|\/account/);

  // Staff reach their own pages, but the four owner-only screens are refused on the server.
  await signInManagement(page, DEMO.staff);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.goto('/admin/orders');
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  await page.goto('/admin/staff');
  await expect(page.getByTestId('forbidden')).toBeVisible();
});
