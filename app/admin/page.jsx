import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Stat, Button, Alert, Table } from '@/components/ui/index.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getDashboard, getSettings } from '@/lib/queries.js';
import { bestSellers, periodLabel, PERIODS } from '@/lib/reporting.js';
import { salesSummary } from '@/lib/orders.js';
import { newOrderAlert } from '@/lib/notifications.js';
import { formatRs } from '@/lib/money.js';
import { PAYMENT_METHODS, STAGE_LABELS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard — DarazEA management' };

const PERIOD_LABELS = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  thisMonth: 'This month',
  custom: 'Custom range',
};

export default async function DashboardPage({ searchParams }) {
  const viewer = await requireManagement('/admin');
  const params = await searchParams;
  const period = PERIODS.includes(params.period) ? params.period : 'thisMonth';
  const [{ range, orders, items, waiting }, settings] = await Promise.all([
    getDashboard(period, { from: params.from, to: params.to }),
    getSettings(),
  ]);

  const totals = salesSummary(orders);
  const ranks = bestSellers(orders, items);
  const alert = waiting[0] ? newOrderAlert(waiting[0], settings) : null;

  return (
    <AdminPage viewer={viewer} active="/admin" title="Dashboard" subtitle="Last updated just now">
      {alert && (
        <Alert tone="warn" className="u-mb4">
          <div className="u-between" style={{ width: '100%' }}>
            <div>
              <strong>{alert.subject}</strong>
              <p className="u-small">{alert.body}</p>
            </div>
            <div className="u-flex">
              <Button href={`/admin/orders/${waiting[0].id}`} variant="primary" size="sm" data-testid="alert-open-order">Open order</Button>
              <Button href="/admin/orders" size="sm">Open Orders</Button>
            </div>
          </div>
        </Alert>
      )}

      <Card title="Period" aside={<span className="u-small u-muted">Showing {periodLabel(range)}</span>}>
        <div className="tabs" style={{ marginBottom: 'var(--space-4)' }}>
          {PERIODS.map((key) => (
            <Link key={key} className={period === key ? 'is-active' : ''} href={`/admin?period=${key}`}>{PERIOD_LABELS[key]}</Link>
          ))}
        </div>
        <form method="get" action="/admin" className="u-flex">
          <input type="hidden" name="period" value="custom" />
          <div className="field u-mb0">
            <label className="field__label" htmlFor="from">From</label>
            <input className="input" id="from" name="from" type="date" defaultValue={params.from || ''} />
          </div>
          <div className="field u-mb0">
            <label className="field__label" htmlFor="to">To</label>
            <input className="input" id="to" name="to" type="date" defaultValue={params.to || ''} />
          </div>
          <Button variant="primary" type="submit">Apply period</Button>
          <p className="u-small u-muted u-mb0" style={{ flex: '1 1 260px' }}>Delivery fees and coupon discounts are already counted in the sales total.</p>
        </form>
      </Card>

      <div className="stats u-mt5">
        <Stat value={totals.orderCount} label="Orders in this period" hero>
          <p>Placed between {periodLabel(range)}</p>
          <p><Link className="btn btn--sm" style={{ background: '#fff', borderColor: '#fff' }} href={`/admin/orders?period=${period}`}>Open Orders for this period</Link></p>
        </Stat>
        <Stat value={formatRs(totals.salesTotal)} label="Sales in this period">
          <p>Across {totals.orderCount} orders · {formatRs(totals.discountTotal)} given in coupon discounts</p>
          <p><Link className="btn btn--sm" href="/admin/orders">Open the orders behind these totals</Link></p>
        </Stat>
        <Stat value={waiting.length} label="Orders waiting on staff">
          <p>Placed but not yet confirmed</p>
          <p><Link className="btn btn--sm" href="/admin/orders?stage=placed">Work the queue</Link></p>
        </Stat>
      </div>

      <div className="grid grid--2 u-mt5">
        <Card title="Best-selling products" aside={<span className="u-small u-muted">{periodLabel(range)}</span>}>
          {ranks.length ? ranks.map((rank, index) => (
            <div className="rank" key={rank.product_id} data-testid="best-seller">
              <span className="rank__no">{index + 1}</span>
              <span className="rank__name">
                <strong>{rank.name}</strong>
                <span className="u-small u-muted" style={{ display: 'block' }}>{rank.sold} sold</span>
                <span className="rank__bar"><i style={{ width: `${rank.percent}%` }} /></span>
              </span>
              <span className="rank__val">{formatRs(rank.value)}</span>
            </div>
          )) : <p className="u-small u-muted">No orders in this period yet.</p>}
        </Card>

        <Card title="Orders waiting on staff" aside={<Badge tone="warn">{waiting.length} waiting</Badge>}>
          <Table
            stack
            columns={[
              { key: 'order', label: 'Order' },
              { key: 'customer', label: 'Customer' },
              { key: 'total', label: 'Total', align: 'right' },
              { key: 'payment', label: 'Payment' },
              { key: 'stage', label: 'Stage' },
              { key: 'open', label: '' },
            ]}
            rows={waiting.map((order) => ({
              key: order.id,
              cells: {
                order: <strong>{order.order_number}</strong>,
                customer: order.customer_name,
                total: formatRs(order.order_total),
                payment: <Badge>{PAYMENT_METHODS[order.payment_method] || order.payment_method}</Badge>,
                stage: <Badge tone="info">{STAGE_LABELS[order.order_status]}</Badge>,
                open: <Link href={`/admin/orders/${order.id}`}>Open</Link>,
              },
            }))}
          />
          <p className="u-mt3"><Button href="/admin/orders">View all orders for this period</Button></p>
        </Card>
      </div>
    </AdminPage>
  );
}
