import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Field, Input, Select, EmptyState, Badge } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireShopper } from '@/lib/auth.js';
import { getCustomerAddresses, getDeliveryAreas } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Addresses — DarazEA' };

export default async function MyAddressesPage() {
  const viewer = await requireShopper('/account/addresses');
  const [addresses, areas] = await Promise.all([
    getCustomerAddresses(viewer.user.id),
    getDeliveryAreas(),
  ]);

  return (
    <StorefrontPage account>
      <div className="container">
        <div className="page-head">
          <div>
            <h1>My Addresses</h1>
            <p className="u-muted">{addresses.length} saved address{addresses.length === 1 ? '' : 'es'}, each with the area the delivery fee comes from.</p>
          </div>
        </div>

        <div className="layout layout--aside">
          <section aria-labelledby="saved-h">
            <div className="u-between u-mb3">
              <h2 className="u-mb0" id="saved-h">Saved addresses</h2>
              <span className="u-small u-muted">Chosen at checkout</span>
            </div>

            {addresses.length ? (
              <div className="grid grid--2" data-testid="address-list">
                {addresses.map((address) => (
                  <article className="card" key={address.id}>
                    <div className="card__hd">
                      <h3 className="u-mb0">{address.label}</h3>
                      {address.is_default && <Badge tone="accent">Default</Badge>}
                    </div>
                    <div className="card__bd u-small">
                      <p className="u-mb0">{address.address_line_1}</p>
                      {address.address_line_2 && <p className="u-mb0">{address.address_line_2}</p>}
                      <p className="u-mb0">{address.city_or_area}</p>
                      <p className="u-mb0">{address.phone}</p>
                      <p className="hint">Delivery fee for {address.city_or_area}: {formatRs(address.area?.delivery_fee || 0)}</p>
                    </div>
                    <div className="card__ft">
                      <PostButton action="/api/addresses" payload={{ action: 'delete', id: address.id }} variant="danger" size="sm" data-testid={`delete-${address.id}`}>
                        Delete
                      </PostButton>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No saved addresses yet">
                <p>Add the first address your orders should be delivered to.</p>
              </EmptyState>
            )}
          </section>

          <aside>
            <Card title="Add a new address">
              <PostForm action="/api/addresses" hidden={{ action: 'save' }} submitLabel="Save address" submitVariant="primary" testId="address-form" resetOnSuccess footer={null}>
                <Field label="Label" htmlFor="ad-label" hint="A name you will recognise, like Home or Office.">
                  <Input id="ad-label" name="label" defaultValue="" required data-testid="address-label" />
                </Field>
                <Field label="Address line 1" htmlFor="ad-line1">
                  <Input id="ad-line1" name="address_line_1" required data-testid="address-line1" />
                </Field>
                <Field label="Address line 2" htmlFor="ad-line2">
                  <Input id="ad-line2" name="address_line_2" />
                </Field>
                <Field label="Area or city" htmlFor="ad-area" hint="Delivery is charged for this area when you check out.">
                  <Select id="ad-area" name="city_or_area" data-testid="address-area">
                    {areas.map((area) => <option key={area.id}>{area.name}</option>)}
                  </Select>
                </Field>
                <Field label="Phone number" htmlFor="ad-phone">
                  <Input id="ad-phone" name="phone" type="tel" required data-testid="address-phone" />
                </Field>
                <label className="check">
                  <input type="checkbox" name="is_default" value="1" />
                  <span>Make this my default address</span>
                </label>
                <button className="btn btn--primary" type="submit" data-testid="address-save">Save address</button>
              </PostForm>
            </Card>
            <p className="u-small u-muted u-mt3"><Link href="/checkout">Go to checkout</Link> to use a saved address on an order.</p>
          </aside>
        </div>
      </div>
    </StorefrontPage>
  );
}
