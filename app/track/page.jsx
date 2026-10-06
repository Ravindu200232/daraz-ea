import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Alert, Badge, StepRail, Table, Totals, Field, Input } from '@/components/ui/index.jsx';
import { findOrderForTracking } from '@/lib/queries.js';
import { formatRs2, formatLKR } from '@/lib/money.js';
import { ORDER_STAGES, STAGE_LABELS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';

export default async function TrackPage({ searchParams }) {
  const params = await searchParams;
  const number = String(params.number || '').trim();
  const phone = String(params.phone || '').trim();
  const submitted = Boolean(number || phone);
  const result = submitted ? await findOrderForTracking(number, phone) : null;
  const order = result?.ok ? result.order : null;

  const history = (order?.order_status_changes || []).sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const current = order?.order_status;
  const currentIndex = ORDER_STAGES.indexOf(current);

  return (
    <StorefrontPage>
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Track your order</h1>
            <p className="u-muted">Your order number and the phone number you gave on the order, together, open its progress.</p>
          </div>
        </div>

        <section className="grid grid--2" style={{ alignItems: 'start' }}>
          <div>
            <h2>Where to find them</h2>
            <ul className="u-small u-muted">
              <li>Your order number is in the email we sent when the order was placed, written like <strong>DA-1042</strong>.</li>
              <li>It is also shown on the page you landed on straight after checkout.</li>
              <li>The phone number is the one typed into the delivery details at checkout.</li>
            </ul>
          </div>

          <Card title="Order lookup">
            <form method="get" action="/track" data-testid="track-form">
              <Field label="Order number" htmlFor="orderno">
                <Input id="orderno" name="number" defaultValue={number} placeholder="DA-1042" required />
              </Field>
              <Field label="Phone number on the order" htmlFor="orderphone" hint="The number that reaches you about this delivery.">
                <Input id="orderphone" name="phone" type="tel" defaultValue={phone} placeholder="077 123 4567" required />
              </Field>
              <div className="u-between">
                <Button variant="primary" type="submit" data-testid="track-submit">Track order</Button>
                <p className="u-small u-muted u-mb0">Signed in? <Link href="/account/orders">My Orders</Link> keeps every order in one place.</p>
              </div>
            </form>
          </Card>
        </section>

        {submitted && !order && (
          <section className="section" data-testid="track-not-found">
            <Card title="Order not found">
              <Alert tone="error" title="We could not match that order number with that phone number.">
                Check both against the email we sent when the order was placed and try again.
              </Alert>
            </Card>
          </section>
        )}

        {order && (
          <section className="section" data-testid="track-result">
            <div className="u-flex">
              <h2 className="u-mb0">Order {order.order_number}</h2>
              <Badge tone={current === 'delivered' ? 'ok' : 'info'}>{STAGE_LABELS[current]}</Badge>
              <span className="u-small u-muted">
                Placed {new Date(order.placed_at).toLocaleString('en-GB')}
                {history.length ? ` · Last update ${new Date(history[history.length - 1].changed_at).toLocaleString('en-GB')}` : ''}
              </span>
            </div>

            <div className="u-mt4">
              <StepRail
                stages={ORDER_STAGES.map((stage, index) => ({
                  n: index + 1,
                  label: STAGE_LABELS[stage],
                  meta: (history.find((row) => row.status === stage)?.changed_at
                    ? new Date(history.find((row) => row.status === stage).changed_at).toLocaleString('en-GB')
                    : 'Expected'),
                  state: index < currentIndex ? 'done' : index === currentIndex ? 'now' : 'todo',
                }))}
              />
            </div>

            <div className="layout layout--aside u-mt4">
              <Card title="Items on this order">
                <Table
                  stack
                  columns={[
                    { key: 'item', label: 'Item' },
                    { key: 'variant', label: 'Size / colour' },
                    { key: 'qty', label: 'Qty' },
                    { key: 'unit', label: 'Unit price', align: 'right' },
                    { key: 'line', label: 'Line total', align: 'right' },
                  ]}
                  rows={(order.order_items || []).map((item) => ({
                    key: item.id,
                    cells: {
                      item: item.product_name,
                      variant: item.variant_label || '—',
                      qty: item.quantity,
                      unit: formatLKR(item.unit_price),
                      line: formatLKR(item.line_total),
                    },
                  }))}
                />
              </Card>

              <Card title="Order total">
                <Totals
                  rows={[
                    ['Items subtotal', formatLKR(order.items_subtotal)],
                    ...(order.coupon_code ? [[`Coupon ${order.coupon_code}`, `− ${formatLKR(order.discount_amount)}`]] : []),
                    [`Delivery fee, ${order.delivery_area_name}`, formatLKR(order.delivery_fee)],
                  ]}
                  grand={['Order total', formatLKR(order.order_total)]}
                />
                <p className="u-small u-muted u-mt3">Payment: {order.payment_method} · {order.payment_status}</p>
              </Card>
            </div>

            <p className="u-mt4"><Button href="/track" variant="ghost">Track another order</Button></p>
          </section>
        )}
      </div>
    </StorefrontPage>
  );
}
