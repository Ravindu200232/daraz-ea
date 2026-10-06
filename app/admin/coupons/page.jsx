import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Stat, EmptyState } from '@/components/ui/index.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCoupons } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Coupons — DarazEA management' };

export default async function AdminCouponsPage() {
  const viewer = await requireManagement('/admin/coupons');
  const coupons = await getCoupons();
  const live = coupons.filter((coupon) => coupon.is_active).length;
  const uses = coupons.reduce((sum, coupon) => sum + Number(coupon.used_count || 0), 0);

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/coupons"
      title="Coupons"
      actions={<Button href="/admin/coupons/new" variant="primary" size="sm" data-testid="new-coupon">New Coupon</Button>}
    >
      <section className="stats" aria-label="Coupon totals">
        <Stat value={coupons.length} label="Coupons" />
        <Stat value={live} label="Live now" />
        <Stat value={coupons.length - live} label="Switched off" />
        <Stat value={uses} label="Uses so far" />
      </section>

      <div className="u-between u-mt5 u-mb3">
        <h2 className="u-mb0">All coupons</h2>
        <span className="u-small u-muted">{coupons.length} coupons</span>
      </div>

      {coupons.length ? (
        <Table
          stack
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'discount', label: 'Discount' },
            { key: 'minimum', label: 'Minimum order', align: 'right' },
            { key: 'expiry', label: 'Expiry date' },
            { key: 'max', label: 'Maximum uses', align: 'right' },
            { key: 'used', label: 'Uses so far', align: 'right' },
            { key: 'applies', label: 'Applies to' },
            { key: 'active', label: 'Active state' },
          ]}
          rows={coupons.map((coupon) => ({
            key: coupon.id,
            cells: {
              code: <Link href={`/admin/coupons/${coupon.id}`} data-testid={`coupon-${coupon.code}`}><strong>{coupon.code}</strong></Link>,
              discount: <>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `${formatRs(coupon.discount_value)} off`}<span className="u-small u-muted" style={{ display: 'block' }}>{coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed amount'}</span></>,
              minimum: formatRs(coupon.minimum_order_value),
              expiry: coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry',
              max: coupon.max_uses ?? 'No limit',
              used: coupon.used_count,
              applies: coupon.applies_to === 'all' ? 'All products' : coupon.applies_to === 'products' ? `${coupon.applies_to_products.length} products` : `Category · ${coupon.applies_to_categories.length} ticked`,
              active: <Badge tone={coupon.is_active ? 'ok' : 'off'}>{coupon.is_active ? 'Live' : 'Switched off'}</Badge>,
            },
          }))}
        />
      ) : (
        <EmptyState title="No coupons yet" action={<Button href="/admin/coupons/new" variant="primary">New Coupon</Button>}>
          <p>Discount codes you create show up here, with how each one works and how many times it has been used.</p>
        </EmptyState>
      )}

      <Card title="How a code is refused" className="u-mt5">
        <p className="u-small u-muted">
          A code is refused at checkout, with its own message, when it is unknown, switched off, expired, past its use limit,
          below its minimum order value, or covers nothing in the cart. Every accepted use is recorded with the order and the discount given.
        </p>
      </Card>
    </AdminPage>
  );
}
