import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Badge, Kv, StepRail, Table, Totals } from '@/components/ui/index.jsx';
import { getOrderByNumber } from '@/lib/queries.js';
import { formatRs2 } from '@/lib/money.js';
import { PAYMENT_METHODS, PAYMENT_STATUS_LABELS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';

export default async function OrderPlacedPage({ params }) {
  const { number } = await params;
  const order = await getOrderByNumber(number);
  if (!order) notFound();

  const items = order.order_items || [];
  const payment = (order.payments || [])[0];
  const placed = new Date(order.placed_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const pieces = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StorefrontPage>
      <div className="container">
        <section className="reveal" style={{ background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary))', color: '#fff', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 'var(--space-5)', boxShadow: 'var(--shadow-lg)' }}>
          <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', fontSize: 32 }}>✓</span>
          <div>
            <h1 style={{ color: '#fff' }}>Your order is placed</h1>
            <p>Thank you, {order.customer_name?.split(' ')[0]}. We have recorded your order and started on it.</p>
            <div className="u-flex u-mt3" style={{ gap: 'var(--space-5)' }}>
              <span style={{ background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.34)', borderRadius: 'var(--radius)', padding: 'var(--space-3) var(--space-4)' }}>
                <span className="u-xs" style={{ display: 'block', letterSpacing: '.14em', textTransform: 'uppercase', color: '#cfe9f5' }}>Order number</span>
                <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-xl)' }} data-testid="order-number">{order.order_number}</strong>
              </span>
              <div>
                <p className="u-mb0"><Badge tone="accent">Placed</Badge></p>
                <p className="u-small u-mb0">Placed {placed}</p>
                <p className="u-small u-mb0">{items.length} items · {formatRs2(order.order_total)} · {PAYMENT_METHODS[order.payment_method] || order.payment_method}</p>
              </div>
            </div>
            <p className="u-small" style={{ marginTop: 'var(--space-4)', color: '#d8eef8' }}>
              Keep this order number. You need it, together with the phone number on the order, to track the delivery.
            </p>
          </div>
        </section>

        <div className="layout layout--aside u-mt5">
          <div className="stack">
            <Card title={`Items ordered (${pieces})`}>
              <Table
                stack
                columns={[
                  { key: 'item', label: 'Item' },
                  { key: 'variant', label: 'Chosen size or colour' },
                  { key: 'qty', label: 'Quantity' },
                  { key: 'unit', label: 'Unit price', align: 'right' },
                  { key: 'line', label: 'Line total', align: 'right' },
                ]}
                rows={items.map((item) => ({
                  key: item.id,
                  cells: {
                    item: item.product_name,
                    variant: item.variant_label || '—',
                    qty: item.quantity,
                    unit: formatRs2(item.unit_price),
                    line: formatRs2(item.line_total),
                  },
                }))}
              />
              <p className="hint">{items.length} lines, {pieces} items in all.</p>
            </Card>

            <Card title="Order total">
              <Totals
                rows={[
                  ['Items subtotal', formatRs2(order.items_subtotal)],
                  ...(order.coupon_code ? [[`Coupon ${order.coupon_code}`, `− ${formatRs2(order.discount_amount)}`]] : []),
                  [`Delivery fee · ${order.delivery_area_name}`, formatRs2(order.delivery_fee)],
                ]}
                grand={['Order total', formatRs2(order.order_total)]}
                note={`${order.delivery_area_name} carries a fixed delivery fee of ${formatRs2(order.delivery_fee)}.`}
              />
            </Card>
          </div>

          <div className="stack">
            <Card title="How you are paying">
              <Kv rows={[
                ['Method', PAYMENT_METHODS[order.payment_method] || order.payment_method],
                ['Payment state', <Badge key="state" tone={order.payment_status === 'paid' ? 'ok' : order.payment_status === 'pending' ? 'warn' : 'off'}>{PAYMENT_STATUS_LABELS[order.payment_status]}</Badge>],
                ['Reference', payment?.reference_number || '—'],
                ['Paid at', payment?.paid_at ? new Date(payment.paid_at).toLocaleString('en-GB') : 'Not yet'],
                ['Amount', formatRs2(order.order_total)],
              ]} />
              <p className="hint">
                {order.payment_method === 'cod'
                  ? `Hand ${formatRs2(order.order_total)} to the courier when the parcel arrives.`
                  : order.payment_method === 'bank_transfer'
                    ? 'Transfer the total to the store account and reply with the reference — the order is sent on as soon as the money arrives.'
                    : 'Nothing more to pay on delivery.'}
              </p>
            </Card>

            <Card
              title="What happens next"
              footer={<>
                <Button href="/shop" variant="default">Continue shopping</Button>
                <Button href="/track" variant="primary">Track this order</Button>
              </>}
            >
              <p className="u-small u-muted">An email follows at every stage, to {order.customer_email}.</p>
              <StepRail
                stages={[
                  { n: 1, label: 'Placed', meta: 'We have your order now.', state: 'now' },
                  { n: 2, label: 'Confirmed', meta: 'We check the items and the address, then email you.' },
                  { n: 3, label: 'Shipped', meta: 'The parcel leaves the store and an email tells you.' },
                  { n: 4, label: 'Delivered', meta: `It arrives at ${order.delivery_area_name} and the last email reaches you.` },
                ]}
              />
              <p className="hint">Track with order number <strong>{order.order_number}</strong> and the phone number on the order, {order.customer_phone}.</p>
            </Card>
          </div>
        </div>

        <p className="u-small u-mt4"><Link href="/track">Track an order</Link> · <Link href="/account/orders">My Orders</Link> keeps every order in one place.</p>
      </div>
    </StorefrontPage>
  );
}
