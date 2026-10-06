import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Field, Input, Select, Textarea, Alert, Badge, Totals } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { getCartLines, getDeliveryAreas, getPaymentMethods, getSettings } from '@/lib/queries.js';
import { getViewer } from '@/lib/auth.js';
import { readGuestId } from '@/lib/guest.js';
import { getCustomerAddresses } from '@/lib/queries.js';
import { cartSubtotal, canCheckout } from '@/lib/cart.js';
import { formatLKR } from '@/lib/money.js';
import { PAYMENT_METHODS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const viewer = await getViewer();
  const customerId = viewer.role === 'shopper' ? viewer.user.id : null;
  const guestId = customerId ? null : await readGuestId();
  const [lines, areas, methods, settings] = await Promise.all([
    getCartLines({ customerId, guestId }),
    getDeliveryAreas(),
    getPaymentMethods(),
    getSettings(),
  ]);
  const addresses = customerId ? await getCustomerAddresses(customerId) : [];
  const subtotal = cartSubtotal(lines);
  const check = canCheckout(lines);
  const online = methods.filter((method) => method.is_enabled && method.method !== 'cod');
  const cod = methods.find((method) => method.method === 'cod');
  const defaultArea = areas[0];

  return (
    <StorefrontPage>
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Checkout</h1>
            <p className="u-muted">
              {viewer.role === 'shopper'
                ? `Signed in as ${viewer.customer?.email || viewer.user.email}`
                : 'Checking out as a guest — you can create an account later and your orders stay here.'}
            </p>
          </div>
        </div>

        <div className="progress-rail">
          <Link className="done" href="/cart">Cart</Link><span className="sep" aria-hidden="true">›</span>
          <span className="now">Checkout</span><span className="sep" aria-hidden="true">›</span>
          <span>Order placed</span>
        </div>

        {!check.ok ? (
          <Alert tone="error" title="This order cannot be placed yet.">
            {check.message} <Link href="/shop">Browse the catalogue</Link> and add something first.
          </Alert>
        ) : (
          <div className="layout layout--aside-wide">
            <div>
              <PostForm action="/api/checkout" submitLabel="Place the order" submitVariant="primary" testId="checkout-form" footer={null}>
                <section className="step">
                  <div className="step__hd"><span className="num">1</span> Your details</div>
                  <div className="step__bd">
                    <div className="field-row">
                      <Field label="Full name" htmlFor="fn">
                        <Input id="fn" name="full_name" defaultValue={viewer.customer?.full_name || 'Amara Perera'} required />
                      </Field>
                      <Field label="Phone number" htmlFor="ph" hint="The courier calls this number, and it is the number you track this order with.">
                        <Input id="ph" name="phone" type="tel" defaultValue={viewer.customer?.phone || '077 214 5580'} required />
                      </Field>
                    </div>
                    <Field label="Email address" htmlFor="em" hint="Your order emails go here, at every stage.">
                      <Input id="em" name="email" type="email" defaultValue={viewer.customer?.email || ''} required />
                    </Field>
                  </div>
                </section>

                <section className="step">
                  <div className="step__hd"><span className="num">2</span> Where it goes</div>
                  <div className="step__bd">
                    {addresses.length > 0 && (
                      <>
                        <div className="u-between">
                          <strong>Deliver to a saved address</strong>
                          <Link className="u-small" href="/account/addresses">Manage my addresses</Link>
                        </div>
                        <div className="stack u-mt3">
                          {addresses.map((address) => (
                            <label className="address-card" key={address.id}>
                              <input type="radio" name="saved_address" value={address.id} defaultChecked={address.is_default} />
                              <span>
                                <strong>{address.label}</strong>
                                <span className="u-small u-muted" style={{ display: 'block' }}>
                                  {address.address_line_1}{address.address_line_2 ? `, ${address.address_line_2}` : ''}, {address.city_or_area} · {address.phone}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    <Field label="Address line 1" htmlFor="a1" className="u-mt4">
                      <Input id="a1" name="address_line_1" defaultValue="27/6 Rampart Road" required />
                    </Field>
                    <Field label="Address line 2 (optional)" htmlFor="a2">
                      <Input id="a2" name="address_line_2" defaultValue="Apartment 4B" />
                    </Field>
                    <div className="field-row">
                      <Field label="Area or city" htmlFor="ar" hint={`The delivery fee for ${defaultArea?.name || 'your area'} is ${formatLKR(defaultArea?.delivery_fee || 0)} and is added to your order total.`}>
                        <Select id="ar" name="delivery_area_id" defaultValue={defaultArea?.id} data-testid="area-select">
                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>{area.name} — {formatLKR(area.delivery_fee)}</option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Delivery instructions" htmlFor="ins" hint="Optional — anything the courier should know.">
                        <Textarea id="ins" name="delivery_instructions" rows="3" defaultValue="Call me on arrival. If I am out, leave the parcel with the security desk at the gate." />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className="step">
                  <div className="step__hd"><span className="num">3</span> How you pay</div>
                  <div className="step__bd">
                    <div className="u-between">
                      <strong>Choose one way to pay</strong>
                      <span className="u-small u-muted">{formatLKR(subtotal)} due before delivery is added</span>
                    </div>

                    {online.map((method) => (
                      <label className="check check--card u-mt3" key={method.method}>
                        <input type="radio" name="payment_method" value={method.method} defaultChecked={method.method === online[0].method} />
                        <span>
                          <strong>{PAYMENT_METHODS[method.method]} <Badge tone="accent">Pay now</Badge></strong>
                          <span className="u-small u-muted" style={{ display: 'block' }}>{method.shopper_instructions}</span>
                        </span>
                      </label>
                    ))}

                    {cod?.is_enabled && (
                      <label className="check check--card u-mt3">
                        <input type="radio" name="payment_method" value="cod" defaultChecked={!online.length} />
                        <span>
                          <strong>Cash on delivery <Badge>Pay on arrival</Badge></strong>
                          <span className="u-small u-muted" style={{ display: 'block' }}>
                            The order is placed now and you hand the courier the full amount when the parcel arrives.
                          </span>
                        </span>
                      </label>
                    )}

                    <Alert tone="warn" className="u-mt3" title="If an online payment does not go through,">
                      no order is recorded and your cart is left exactly as it is. You can try again, or pay cash on delivery.
                    </Alert>
                  </div>
                </section>

                <div className="u-flex u-mt4">
                  <button className="btn btn--primary" type="submit" data-testid="place-order">Place the order</button>
                  <Button href="/cart" variant="ghost">Back to cart</Button>
                </div>
              </PostForm>
            </div>

            <aside className="summary" aria-label="Order summary">
              <Card accent title="Order summary" aside={<span className="u-small u-muted">{lines.length} items</span>}>
                {lines.map((line) => (
                  <div className="u-flex" key={line.id} style={{ alignItems: 'flex-start', borderBottom: '1px dashed var(--color-line)', paddingBottom: 'var(--space-2)' }}>
                    <span className="media media--sm">
                      {line.photo ? <img src={`${line.photo}?auto=format&fit=crop&w=160&q=60`} alt="" /> : null}
                    </span>
                    <span style={{ flex: 1 }}>
                      <strong>{line.product?.name}</strong>
                      <span className="u-small u-muted" style={{ display: 'block' }}>{line.variantLabel}</span>
                    </span>
                    <span className="u-right u-small">{line.quantity} × {formatLKR(line.unitPrice)}<br /><strong>{formatLKR(line.unitPrice * line.quantity)}</strong></span>
                  </div>
                ))}

                <div className="field u-mt4">
                  <label className="field__label" htmlFor="cpn">Coupon code</label>
                  <Input id="cpn" name="coupon_code" placeholder="DAZ10" data-testid="coupon-input" />
                  <p className="hint">Type a code and it is checked when you place the order — a code that cannot be used tells you why and leaves your total alone.</p>
                </div>

                <Totals
                  rows={[
                    ['Items subtotal', formatLKR(subtotal)],
                    ['Delivery fee', `from ${formatLKR(Math.min(...areas.map((area) => Number(area.delivery_fee)), 0))}`],
                  ]}
                  grand={['Order total', `${formatLKR(subtotal)} + delivery`]}
                  note="The delivery fee for your area and any coupon discount are applied the moment the order is placed, and an email follows at every stage."
                />
              </Card>

              <Card title="The store" className="u-mt4">
                <p className="u-small u-muted">{settings.store_name} · {settings.support_email} · {settings.support_phone}</p>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </StorefrontPage>
  );
}
