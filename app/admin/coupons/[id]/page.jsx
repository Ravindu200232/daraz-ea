import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Stat } from '@/components/ui/index.jsx';
import { PostButton } from '@/components/ui/client.jsx';
import { CouponForm } from '@/components/admin/CouponForm.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCoupon, getCategories } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

export default async function EditCouponPage({ params }) {
  const { id } = await params;
  const viewer = await requireManagement(`/admin/coupons/${id}`);
  const [data, categories] = await Promise.all([getCoupon(id), getCategories()]);
  if (!data) notFound();

  const { coupon, uses } = data;
  const usesLeft = coupon.max_uses ? Math.max(0, coupon.max_uses - coupon.used_count) : null;
  const discountGiven = uses.reduce((sum, use) => sum + Number(use.discount_given || 0), 0);

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/coupons"
      title="Edit Coupon"
      actions={<Link className="u-small" href="/admin/coupons">Back to Coupons</Link>}
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <CouponForm coupon={coupon} categories={categories} />

        <div className="stack">
          <Card title="Availability" aside={<span className="u-small u-muted">Created {new Date(coupon.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}>
            <div className="u-between" style={{ border: '2px solid var(--color-line)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', background: 'var(--color-surface-3)' }}>
              <div>
                <Badge tone={coupon.is_active ? 'ok' : 'off'}>{coupon.is_active ? 'Live' : 'Switched off'}</Badge>
                <span className="u-small u-muted" style={{ display: 'block' }}>
                  {coupon.is_active ? `Shoppers can use ${coupon.code} at checkout.` : `${coupon.code} cannot be used at checkout.`}
                </span>
              </div>
            </div>
            <p className="hint">Switching a code off keeps the code and its uses — shoppers simply cannot use it at checkout.</p>
            <div className="u-mt3">
              <PostButton
                action="/api/admin/coupons"
                payload={{ action: 'toggle', id: coupon.id, is_active: !coupon.is_active }}
                variant={coupon.is_active ? 'danger' : 'primary'}
                testId="toggle-coupon"
              >
                {coupon.is_active ? `Switch off ${coupon.code}` : `Switch ${coupon.code} back on`}
              </PostButton>
            </div>
          </Card>

          <Card title="Uses so far">
            <div className="grid grid--3" style={{ gap: 'var(--space-3)' }}>
              <Stat value={coupon.used_count} label="Uses recorded" />
              <Stat value={usesLeft === null ? 'No limit' : usesLeft} label={usesLeft === null ? 'Uses' : 'Uses left'} />
              <Stat value={formatRs(discountGiven)} label="Discount given" />
            </div>

            {uses.length ? (
              <Table
                stack
                columns={[
                  { key: 'order', label: 'Order' },
                  { key: 'who', label: 'Used by' },
                  { key: 'discount', label: 'Discount given', align: 'right' },
                  { key: 'used', label: 'Used on' },
                ]}
                rows={uses.map((use) => ({
                  key: use.id,
                  cells: {
                    order: <Link href={`/admin/orders`}>{use.orders?.order_number || '—'}</Link>,
                    who: use.used_by_label,
                    discount: formatRs(use.discount_given),
                    used: new Date(use.used_at).toLocaleString('en-GB'),
                  },
                }))}
              />
            ) : (
              <p className="u-small u-muted">This code has not been used yet.</p>
            )}
            <p className="hint">Showing the {uses.length} most recent use{uses.length === 1 ? '' : 's'}.</p>
          </Card>

          <Card title="Where the code works">
            <p className="u-small u-muted">
              {coupon.applies_to === 'all'
                ? 'Every product in the store.'
                : coupon.applies_to === 'products'
                  ? `${coupon.applies_to_products.length} chosen product${coupon.applies_to_products.length === 1 ? '' : 's'}.`
                  : `${coupon.applies_to_categories.length} chosen categor${coupon.applies_to_categories.length === 1 ? 'y' : 'ies'}.`}
              {' '}A cart holding nothing the code covers is refused, with no discount.
            </p>
            <p className="u-mt3"><Button href="/checkout" variant="ghost">See it at checkout</Button></p>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
