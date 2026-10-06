import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Alert } from '@/components/ui/index.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getManagementOrders } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';
import { ORDER_STAGES, STAGE_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders — DarazEA management' };

export default async function AdminOrdersPage({ searchParams }) {
  const viewer = await requireManagement('/admin/orders');
  const params = await searchParams;
  const stage = ORDER_STAGES.includes(params.stage) ? params.stage : 'all';
  const orders = await getManagementOrders({ stage, q: params.q || '' });
  const waiting = orders.filter((order) => order.order_status === 'placed').length;

  return (
    <AdminPage viewer={viewer} active="/admin/orders" title="Orders" subtitle="All totals in Rs (LKR)">
      <section className="u-between u-mb4" style={{ background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))', color: '#fff', borderRadius: 'var(--radius)', padding: 'var(--space-4) var(--space-5)' }}>
        <div>
          <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-2xl, 31px)', display: 'block' }}>{waiting}</strong>
          <span className="u-small">Orders waiting on staff</span>
        </div>
        <div>
          <strong>{orders.length} orders</strong>
          <span className="u-small" style={{ display: 'block' }}>Sorted by placed date, newest first</span>
        </div>
      </section>

      <div className="tabs">
        <Link className={stage === 'all' ? 'is-active' : ''} href="/admin/orders">All</Link>
        {ORDER_STAGES.map((key) => (
          <Link key={key} className={stage === key ? 'is-active' : ''} href={`/admin/orders?stage=${key}`}>{STAGE_LABELS[key]}</Link>
        ))}
      </div>

      {orders.length ? (
        <Table
          stack
          columns={[
            { key: 'order', label: 'Order' },
            { key: 'placed', label: 'Placed' },
            { key: 'customer', label: 'Customer' },
            { key: 'phone', label: 'Phone' },
            { key: 'total', label: 'Total (Rs)', align: 'right' },
            { key: 'method', label: 'Payment method' },
            { key: 'payment', label: 'Payment' },
            { key: 'status', label: 'Status' },
            { key: 'open', label: '' },
          ]}
          rows={orders.map((order) => ({
            key: order.id,
            cells: {
              order: <Link href={`/admin/orders/${order.id}`} data-testid={`order-${order.order_number}`}><strong>{order.order_number}</strong></Link>,
              placed: <>{new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} <span className="u-small u-muted">{new Date(order.placed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></>,
              customer: <>{order.customer_name} {order.is_guest_order ? <Badge tone="off">Guest</Badge> : null}</>,
              phone: order.customer_phone,
              total: Number(order.order_total).toLocaleString('en-LK', { minimumFractionDigits: 2 }),
              method: PAYMENT_METHODS[order.payment_method] || order.payment_method,
              payment: <Badge tone={order.payment_status === 'paid' ? 'ok' : order.payment_status === 'pending' ? 'warn' : 'off'}>{PAYMENT_STATUS_LABELS[order.payment_status]}</Badge>,
              status: <Badge tone={order.order_status === 'delivered' ? 'ok' : order.order_status === 'placed' ? 'info' : 'accent'}>{STAGE_LABELS[order.order_status]}</Badge>,
              open: <Link href={`/admin/orders/${order.id}`}>Open →</Link>,
            },
          }))}
        />
      ) : (
        <Alert tone="soft" title={`Nothing in ${stage === 'all' ? 'the list' : STAGE_LABELS[stage]}`}>
          An order lands here the moment it moves on, so the list always shows what is waiting on you.
        </Alert>
      )}

      <p className="u-mt4"><Button href="/admin" variant="ghost">Back to the Dashboard</Button></p>
    </AdminPage>
  );
}
