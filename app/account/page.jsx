import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Field, Input, Alert, Kv, Badge } from '@/components/ui/index.jsx';
import { PostForm, SignOutButton } from '@/components/ui/client.jsx';
import { requireShopper } from '@/lib/auth.js';
import { getCustomerAddresses } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Account — DarazEA' };

export default async function MyAccountPage() {
  const viewer = await requireShopper('/account');
  const customer = viewer.customer;
  const addresses = await getCustomerAddresses(viewer.user.id);

  return (
    <StorefrontPage account>
      <div className="container">
        <div className="page-head">
          <div>
            <h1>My Account</h1>
            <p className="u-muted">Keep your name, phone number and password up to date, and jump to the orders, addresses and saved items on this account.</p>
          </div>
          <Button href="/account/orders" variant="ghost">Go to my orders</Button>
        </div>

        <div className="layout layout--aside">
          <div className="stack">
            <Card title="Your details">
              <PostForm action="/api/account" hidden={{ action: 'profile' }} submitLabel="Save changes" submitVariant="primary" testId="profile-form" footer={null}>
                <Field label="Full name" htmlFor="full-name" hint="This is the name shown on your orders and used on delivery.">
                  <Input id="full-name" name="full_name" defaultValue={customer?.full_name || ''} required data-testid="profile-name" />
                </Field>
                <Field label="Email address" htmlFor="email" hint="Your sign-in email and where order emails are sent. Write to support@darazea.example to change it.">
                  <Input id="email" defaultValue={customer?.email || ''} readOnly />
                </Field>
                <Field label="Phone number" htmlFor="phone" hint="Used by the delivery team on the day, and needed to track an order.">
                  <Input id="phone" name="phone" type="tel" defaultValue={customer?.phone || ''} required data-testid="profile-phone" />
                </Field>
                <button className="btn btn--primary" type="submit" data-testid="profile-save">Save changes</button>
              </PostForm>
            </Card>

            <Card title="Change password">
              <PostForm action="/api/account" hidden={{ action: 'password' }} submitLabel="Update password" submitVariant="primary" testId="password-form" footer={null}>
                <Field label="Current password" htmlFor="pw-cur">
                  <Input id="pw-cur" name="current_password" type="password" required />
                </Field>
                <Field label="New password" htmlFor="pw-new" hint="At least 8 characters, with one letter and one number.">
                  <Input id="pw-new" name="new_password" type="password" required />
                </Field>
                <Field label="Confirm new password" htmlFor="pw-confirm">
                  <Input id="pw-confirm" name="confirm_password" type="password" required />
                </Field>
                <button className="btn btn--primary" type="submit">Update password</button>
              </PostForm>
            </Card>
          </div>

          <div className="stack">
            <Card title="Sign-in details">
              <Kv rows={[
                ['Sign-in method', <Badge key="method">{customer?.sign_in_method === 'google' ? 'Google account' : 'Email and password'}</Badge>],
                ['Joined', new Date(customer?.joined_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                ['Email for order updates', customer?.email || ''],
                ['Addresses saved', `${addresses.length}`],
              ]} />
            </Card>

            <Card title="Sign out" footer={<SignOutButton />}>
              <p className="u-small u-muted u-mb0">Sign out when you are finished on a shared phone or computer.</p>
            </Card>

            <Card title="Account status">
              <Alert tone={customer?.account_status === 'active' ? 'ok' : 'error'}>
                {customer?.account_status === 'active'
                  ? 'Your account is active. Orders, wishlist and reviews are kept here.'
                  : 'This account has been switched off. Email support@darazea.example if you think that is wrong.'}
              </Alert>
            </Card>
          </div>
        </div>

        <section className="section">
          <h2>Your orders and saved items</h2>
          <div className="grid grid--3">
            <Link className="pcard" href="/account/orders" style={{ padding: 'var(--space-4)' }}>
              <strong style={{ fontFamily: 'var(--font-heading)' }}>My Orders</strong>
              <p className="u-small u-muted">Every order you have placed, newest first, with the stage each one has reached.</p>
            </Link>
            <Link className="pcard" href="/account/addresses" style={{ padding: 'var(--space-4)' }}>
              <strong style={{ fontFamily: 'var(--font-heading)' }}>My Addresses</strong>
              <p className="u-small u-muted">The delivery addresses you keep ready to reuse at checkout, each with its area or city.</p>
            </Link>
            <Link className="pcard" href="/account/wishlist" style={{ padding: 'var(--space-4)' }}>
              <strong style={{ fontFamily: 'var(--font-heading)' }}>Wishlist</strong>
              <p className="u-small u-muted">Products you saved for later, ready to move into your cart.</p>
            </Link>
          </div>
        </section>
      </div>
    </StorefrontPage>
  );
}
