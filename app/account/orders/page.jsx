import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Badge, EmptyState } from '@/components/ui/index.jsx';
import { requireShopper } from '@/lib/auth.js';
import { getCustomerOrders } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';
import { ORDER_STAGES, STAGE_LABELS, PAYMENT_METHODS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Orders — DarazEA' };

export default async function MyOrdersPage() {
  const viewer = await requireShopper('/account/orders');
  const orders = await getCustomerOrders(viewer.user.id);

  return (
    <StorefrontPage account>
      <div className="container">
        <div className="page-head">
          <div>
            <h1>My Orders</h1>
            <p className="u-muted">{orders.length} order{orders.length === 1 ? '' : 's'}, newest first.</p>
          </div>
          <Button href="/shop" variant="ghost">Continue shopping</Button>
        </div>

        <div className="layout layout--aside">
          <section className="stack" aria-label="Order history" data-testid="orders-list">
            {orders.length ? orders.map((order) => {
              const stageIndex = ORDER_STAGES.indexOf(order.order_status);
              return (
                <article
                  className="pcard"
                  key={order.id}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--space-3)', padding: 'var(--space-4)', alignItems: 'center' }}
                >
                  <div>
                    <span className="u-xs u-muted u-strong" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Order</span>
                    <span className="u-strong" style={{ display: 'block', fontFamily: 'var(--font-heading)' }}>{order.order_number}</span>
                  </div>
                  <div>
                    <span className="u-xs u-muted" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '.08em' }}>Placed</span>
                    <span className="u-strong">{new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="u-xs u-muted" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '.08em' }}>Total</span>
                    <span className="u-strong">{formatRs(order.order_total)}</span>
                  </div>
                  <div>
                    <span className="u-xs u-muted" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '.08em' }}>Payment</span>
                    <Badge>{PAYMENT_METHODS[order.payment_method] || order.payment_method}</Badge>
                  </div>
                  <div>
                    <span className="u-xs u-muted" style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '.08em' }}>Stage</span>
                    <span className="u-strong">{STAGE_LABELS[order.order_status]}</span>
                    <span aria-hidden="true" style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {ORDER_STAGES.map((stage, index) => (
                        <i key={stage} style={{ display: 'block', width: 22, height: 8, borderRadius: 2, background: index <= stageIndex ? 'var(--color-ok)' : 'var(--color-line)' }} />
                      ))}
                    </span>
                  </div>
                  <div className="u-end">
                    <Button href={`/account/orders/${order.order_number}`} variant="primary" size="sm" data-testid={`view-order-${order.order_number}`}>View order</Button>
                  </div>
                </article>
              );
            }) : (
              <EmptyState title="You have not placed an order yet" action={<Button href="/shop" variant="primary">Browse the catalogue</Button>}>
                <p>Your orders will appear here, newest first, each with the stage it has reached.</p>
              </EmptyState>
            )}
          </section>

          <aside className="stack">
            <Card title="Track an order" footer={<Button href="/track" variant="default">Track an order</Button>}>
              <p className="u-small u-muted">Enter the order number and the phone number the order was placed with, and see how far it has got.</p>
            </Card>
            <Card title="Returns and refunds">
              <p className="u-small u-muted">Something not right? Open a delivered order and ask to return an item — one request per item, and any refund is handled outside the store.</p>
            </Card>
            <Card title="Your details">
              <p className="u-small u-muted u-mb0"><strong>{viewer.customer?.full_name}</strong><br />{viewer.customer?.email}<br />{orders.length} orders placed</p>
              <p className="u-mt3"><Link className="btn btn--sm" href="/account">My account</Link></p>
            </Card>
          </aside>
        </div>
      </div>
    </StorefrontPage>
  );
}
