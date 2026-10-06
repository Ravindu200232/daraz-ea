import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Alert, Field, Input, Button } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireOwner } from '@/lib/auth.js';
import { getSettings } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Store Settings — DarazEA management' };

export default async function StoreSettingsPage() {
  const viewer = await requireOwner('/admin/settings');
  const settings = await getSettings();

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/settings"
      title="Store Settings"
      subtitle={`${viewer.staff?.full_name} · Store Owner`}
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Card title="Store details">
            <PostForm action="/api/admin/settings" submitLabel="Save changes" submitVariant="primary" testId="store-settings" footer={null}>
              <Field label="Store name" htmlFor="storename" hint="Shown in the storefront header, in the browser title and at the top of every order email.">
                <Input id="storename" name="store_name" defaultValue={settings.store_name} required data-testid="store-name" />
              </Field>
              <Field label="Support email" htmlFor="supportemail" hint="Shown in the storefront footer and at the bottom of every order email.">
                <Input id="supportemail" name="support_email" type="email" defaultValue={settings.support_email} required data-testid="support-email" />
              </Field>
              <Field label="Support phone" htmlFor="supportphone">
                <Input id="supportphone" name="support_phone" type="tel" defaultValue={settings.support_phone} required data-testid="support-phone" />
              </Field>
              <button className="btn btn--primary" type="submit" data-testid="store-settings-save">Save changes</button>
            </PostForm>
          </Card>

          <Card title="New order alerts" aside={<Badge>{(settings.new_order_alert_recipients || []).length} recipients</Badge>}>
            <p className="u-small u-muted">Everyone listed here is emailed the moment an order is placed on the store. Separate the addresses with a comma.</p>
            <ul className="u-small">
              {(settings.new_order_alert_recipients || []).map((recipient) => (
                <li key={recipient}><strong>{recipient}</strong></li>
              ))}
            </ul>
            <PostForm action="/api/admin/settings" submitLabel="Save recipients" submitVariant="primary" testId="alert-recipients" footer={null}>
              <input type="hidden" name="store_name" value={settings.store_name} />
              <input type="hidden" name="support_email" value={settings.support_email} />
              <input type="hidden" name="support_phone" value={settings.support_phone} />
              <Field label="New order alert recipients" htmlFor="recipients">
                <Input id="recipients" name="new_order_alert_recipients" defaultValue={(settings.new_order_alert_recipients || []).join(', ')} data-testid="alert-recipients-input" />
              </Field>
              <button className="btn btn--primary" type="submit">Save recipients</button>
            </PostForm>
          </Card>

          <Card title="Currency">
            <Field label="Currency shown to shoppers" htmlFor="currency" hint="Prices on the storefront, in the cart, at checkout and in order emails are all shown in Sri Lankan Rupees.">
              <Input id="currency" defaultValue={settings.currency} readOnly />
            </Field>
            <Badge tone="off">Fixed for this store</Badge>
          </Card>
        </div>

        <div className="stack">
          <Card title="Where shoppers see this" footer={<Button href="/" variant="default">See the storefront</Button>}>
            <p className="u-small u-muted">Storefront header</p>
            <div className="u-flex" style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <strong style={{ fontFamily: 'var(--font-heading)' }}>{settings.store_name}</strong>
              <span className="u-small u-muted">Search products</span>
              <span className="u-push u-small">Cart (0)</span>
            </div>
            <p className="u-small u-muted u-mt3">Storefront footer and order email</p>
            <div className="u-flex" style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <span className="u-small">{settings.support_email}</span>
              <span className="u-push u-small">{settings.support_phone}</span>
            </div>
            <p className="u-small u-muted u-mt3">Order email line</p>
            <div className="u-flex" style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
              <span className="u-small">Order DA-10355 · Total Rs. 5,250</span>
            </div>
          </Card>

          <Card title="Payments and fees" footer={<><Link className="btn btn--default" href="/admin/delivery-areas">Delivery fees</Link> <Link className="btn" href="/admin/settings/payments">Payment settings</Link></>}>
            <p className="u-small u-muted u-mb0">
              Delivery fees and payment methods live in their own two screens, so the money side of the store stays separate from these details.
            </p>
          </Card>

          <Alert tone="soft" title="Who may change these">
            Store settings, delivery fees, payment settings and staff accounts are kept by the Store Owner. A Staff account is refused all four on the server.
          </Alert>
        </div>
      </div>
    </AdminPage>
  );
}
