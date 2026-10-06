import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Badge, Kv, StepRail, Table, Totals, Alert } from '@/components/ui/index.jsx';
import { requireShopper } from '@/lib/auth.js';
import { getOrderForCustomer } from '@/lib/queries.js';
import { formatRs2 } from '@/lib/money.js';
import { ORDER_STAGES, STAGE_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';

export default async function AccountOrderDetailPage({ params }) {
  const { number } = await params;
  const viewer = await requireShopper(`/account/orders/${number}`);
  const order = await getOrderForCustomer(number, viewer.user.id);
  if (!order) notFound();

  const history = (order.order_status_changes || []).sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const currentIndex = ORDER_STAGES.indexOf(order.order_status);
  const payment = (order.payments || [])[0];
  const returns = order.return_requests || [];

  return (
    <StorefrontPage account>
      <div className="container">
        <Link className="u-small" href="/account/orders">← Back to My Orders</Link>

        <div className="page-head u-mt3">
          <div>
            <h1 className="u-mb0">Order {order.order_number}</h1>
            <p className="u-muted u-mb0">
              Placed {new Date(order.placed_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' '}· {order.order_items?.length} items · {formatRs2(order.order_total)}
            </p>
          </div>
          <div className="u-flex">
            <Badge tone={order.order_status === 'delivered' ? 'ok' : 'info'} data-testid="order-stage">{STAGE_LABELS[order.order_status]}</Badge>
            <Badge tone={order.payment_status === 'paid' ? 'ok' : order.payment_status === 'pending' ? 'warn' : 'off'}>{PAYMENT_STATUS_LABELS[order.payment_status]}</Badge>
            <Button href="/track" variant="default">Track Order</Button>
            {order.order_status === 'delivered' && (
              <Button href={`/account/orders/${order.order_number}/return`} variant="primary" data-testid="request-return">Request a Return</Button>
            )}
          </div>
        </div>

        <StepRail
          stages={ORDER_STAGES.map((stage, index) => ({
            n: index + 1,
            label: STAGE_LABELS[stage],
            meta: history.find((row) => row.status === stage)?.changed_at
              ? new Date(history.find((row) => row.status === stage).changed_at).toLocaleString('en-GB')
              : 'Not yet',
            state: index < currentIndex ? 'done' : index === currentIndex ? 'done now' : 'todo',
          }))}
        />

        <div className="layout layout--aside u-mt5">
          <Card title="Items" aside={<span className="u-small u-muted">{order.order_items?.length} lines</span>}>
            <Table
              stack
              columns={[
                { key: 'item', label: 'Item' },
                { key: 'variant', label: 'Size or colour' },
                { key: 'qty', label: 'Qty' },
                { key: 'unit', label: 'Unit price (LKR)', align: 'right' },
                { key: 'line', label: 'Line total (LKR)', align: 'right' },
              ]}
              rows={(order.order_items || []).map((item) => ({
                key: item.id,
                cells: {
                  item: item.product_name,
                  variant: item.variant_label || '—',
                  qty: item.quantity,
                  unit: Number(item.unit_price).toLocaleString('en-LK', { minimumFractionDigits: 2 }),
                  line: Number(item.line_total).toLocaleString('en-LK', { minimumFractionDigits: 2 }),
                },
              }))}
            />
            <Totals
              rows={[
                ['Items subtotal (LKR)', Number(order.items_subtotal).toLocaleString('en-LK', { minimumFractionDigits: 2 })],
                [`Delivery fee — ${order.delivery_area_name} (LKR)`, Number(order.delivery_fee).toLocaleString('en-LK', { minimumFractionDigits: 2 })],
                ...(order.coupon_code ? [[`Coupon ${order.coupon_code} (LKR)`, `−${Number(order.discount_amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`]] : []),
              ]}
              grand={['Order total (LKR)', Number(order.order_total).toLocaleString('en-LK', { minimumFractionDigits: 2 })]}
            />
          </Card>

          <div className="stack">
            <Card title="Delivery">
              <p className="subhead">Delivery address</p>
              <Kv rows={[
                ['Name', order.customer_name],
                ['Address', order.delivery_address],
                ['Phone', order.customer_phone],
              ]} />
              <p className="subhead u-mt4">Delivery instructions</p>
              <p className="u-small u-mb0">{order.delivery_instructions || '—'}</p>
            </Card>

            <Card title="Payment">
              <Kv rows={[
                ['Method', PAYMENT_METHODS[order.payment_method] || order.payment_method],
                ['Status', <Badge key="s" tone={order.payment_status === 'paid' ? 'ok' : 'warn'}>{PAYMENT_STATUS_LABELS[order.payment_status]}</Badge>],
                ['Reference', payment?.reference_number || '—'],
                ['Paid', payment?.paid_at ? new Date(payment.paid_at).toLocaleString('en-GB') : 'Not yet'],
                ['Amount (LKR)', Number(order.order_total).toLocaleString('en-LK', { minimumFractionDigits: 2 })],
              ]} />
            </Card>

            <Card title="Returns">
              {returns.length ? returns.map((request) => {
                const item = (order.order_items || []).find((row) => row.id === request.order_item_id);
                return (
                  <div key={request.id} className="u-mb4">
                    <div className="u-between">
                      <strong className="u-small">{item?.product_name} — {item?.variant_label}</strong>
                      <Badge tone={request.decision === 'pending' ? 'warn' : request.decision === 'approved' ? 'ok' : 'danger'}>
                        {request.decision === 'pending' ? 'Waiting for a decision' : request.decision === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                    <Kv rows={[
                      ['Reason', request.reason],
                      ['Requested', new Date(request.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
                      ...(request.decision !== 'pending' ? [
                        ['Decision', request.decision === 'approved' ? 'Approved' : 'Rejected'],
                        ['Decision note', request.decision_note || '—'],
                        ['Decided', request.decided_at ? new Date(request.decided_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
                      ] : []),
                    ]} />
                    <hr />
                  </div>
                );
              }) : <Alert tone="soft" title="No return on this order.">An item can be sent back once the order has arrived.</Alert>}
              <p className="hint">Any refund is handled outside the store.</p>
            </Card>
          </div>
        </div>
      </div>
    </StorefrontPage>
  );
}
