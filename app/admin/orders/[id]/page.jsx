import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Kv, Timeline, Table, Totals, Field, Input, Select, Alert } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getManagementOrder } from '@/lib/queries.js';
import { nextStage } from '@/lib/validation.js';
import { formatRs2, formatRs } from '@/lib/money.js';
import { ORDER_STAGES, STAGE_LABELS, PAYMENT_METHODS, PAYMENT_STATUS_LABELS, PAYMENT_METHODS as METHODS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params;
  const viewer = await requireManagement(`/admin/orders/${id}`);
  const order = await getManagementOrder(id);
  if (!order) notFound();

  const history = (order.order_status_changes || []).sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const messages = (order.order_messages || []).sort((a, b) => new Date(a.sent_at || 0) - new Date(b.sent_at || 0));
  const payment = (order.payments || [])[0];
  const upcoming = nextStage(order.order_status);
  const currentIndex = ORDER_STAGES.indexOf(order.order_status);

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/orders"
      title={`Order ${order.order_number}`}
      actions={<Link className="btn btn--sm" href="/admin/orders">All orders</Link>}
    >
      <Alert tone="ok" className="u-mb4">
        <strong>Order {STAGE_LABELS[order.order_status].toLowerCase()}.</strong> {order.customer_name} has the {STAGE_LABELS[order.order_status].toLowerCase()} email — the next stage is {upcoming ? STAGE_LABELS[upcoming] : 'nothing, the order is delivered'}.
      </Alert>

      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Card title="Order stage" aside={<Badge tone={order.order_status === 'delivered' ? 'ok' : 'info'}>{STAGE_LABELS[order.order_status]}</Badge>}>
            <Timeline rows={ORDER_STAGES.map((stage, index) => ({
              key: stage,
              n: index + 1,
              title: STAGE_LABELS[stage],
              meta: history.find((row) => row.status === stage)?.changed_at
                ? new Date(history.find((row) => row.status === stage).changed_at).toLocaleString('en-GB')
                : 'Waiting on staff',
              state: index < currentIndex ? 'done' : index === currentIndex ? 'done' : 'todo',
              tag: <Badge tone={index <= currentIndex ? 'off' : 'solid'}>{index <= currentIndex ? 'Done' : 'Next'}</Badge>,
            }))} />

            <div className="u-flex u-mt4">
              {ORDER_STAGES.slice(1).map((stage) => {
                const action = { confirmed: 'confirm', shipped: 'ship', delivered: 'deliver' }[stage];
                const allowed = nextStage(order.order_status) === stage;
                return (
                  <PostButton
                    key={stage}
                    action="/api/admin/orders"
                    payload={{ id: order.id, action }}
                    variant={allowed ? 'primary' : 'default'}
                    testId={`stage-${action}`}
                    {...(!allowed ? {} : {})}
                  >
                    {stage === 'confirmed' ? 'Confirm order' : stage === 'shipped' ? 'Mark shipped' : 'Mark delivered'}
                  </PostButton>
                );
              })}
            </div>
            <p className="hint">
              One stage at a time — an order cannot skip a stage. The shopper is emailed at every stage, and a text message is
              recorded as not sent while that channel is off.
            </p>
          </Card>

          <Card title="Items and totals" aside={<span className="u-small u-muted">{order.order_items?.length} items</span>}>
            <Table
              stack
              columns={[
                { key: 'item', label: 'Item' },
                { key: 'variant', label: 'Chosen size or colour' },
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
                  unit: formatRs2(item.unit_price),
                  line: formatRs2(item.line_total),
                },
              }))}
            />
            <Totals
              rows={[
                ['Items subtotal', formatRs2(order.items_subtotal)],
                ...(order.coupon_code ? [[`Coupon ${order.coupon_code}`, `− ${formatRs2(order.discount_amount)}`]] : []),
                [`Delivery fee · ${order.delivery_area_name}`, formatRs2(order.delivery_fee)],
              ]}
              grand={['Order total', formatRs2(order.order_total)]}
            />
          </Card>

          <Card title="Stage history">
            <ol className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ORDER_STAGES.map((stage) => {
                const row = history.find((entry) => entry.status === stage);
                return (
                  <li key={stage}>
                    <div className="u-flex">
                      <Badge tone={row ? 'accent' : 'off'}>{STAGE_LABELS[stage]}</Badge>
                      <span className="u-small u-muted">{row ? new Date(row.changed_at).toLocaleString('en-GB') : 'Not yet'}</span>
                    </div>
                    <p className="u-small u-mb0">
                      {row
                        ? `${row.changed_by_name || 'Recorded when the order was placed'}.`
                        : 'No one has marked this order delivered.'}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card title="Messages" aside={<span className="u-small u-muted">{messages.length} entries</span>}>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }} data-testid="message-log">
              {messages.map((message) => (
                <li key={message.id} className="u-flex">
                  <Badge>{message.channel === 'email' ? 'Email' : 'Text'}</Badge>
                  <span>{message.sent_to}</span>
                  <span className="u-small u-muted">{message.stage}</span>
                  <span className="u-small u-muted">{message.sent_at ? new Date(message.sent_at).toLocaleString('en-GB') : '—'}</span>
                  <Badge tone={message.status === 'sent' ? 'ok' : 'off'}>{message.status === 'sent' ? 'Sent' : 'Not sent'}</Badge>
                  {message.status !== 'sent' && <span className="u-small u-muted">Text messages are switched off, so nothing was sent on this stage.</span>}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="stack">
          <Card title="Customer" aside={<Link className="u-small" href={`/admin/customers`}>Open Customers</Link>}>
            <Kv rows={[
              ['Name', order.customer_name],
              ['Phone', order.customer_phone],
              ['Email', order.customer_email],
              ['Checked out', order.is_guest_order ? <Badge key="g" tone="off">As a guest</Badge> : <Badge key="a">From an account</Badge>],
            ]} />
          </Card>

          <Card title="Delivery">
            <Kv rows={[
              ['Address', order.delivery_address],
              ['Area or city', order.delivery_area_name],
              ['Delivery fee', formatRs2(order.delivery_fee)],
              ['Instructions', order.delivery_instructions || '—'],
            ]} />
          </Card>

          <Card title="Payment">
            <Kv rows={[
              ['Method', METHODS[order.payment_method] || order.payment_method],
              ['Amount', formatRs2(payment?.amount ?? order.order_total)],
              ['Status', <Badge key="s" tone={order.payment_status === 'paid' ? 'ok' : order.payment_status === 'pending' ? 'warn' : 'off'}>{PAYMENT_STATUS_LABELS[order.payment_status]}</Badge>],
              ['Reference', payment?.reference_number || '—'],
              ['Proof', payment?.bank_transfer_proof_url ? <a href={payment.bank_transfer_proof_url}>attached slip</a> : '—'],
              ['Recorded', payment?.paid_at ? new Date(payment.paid_at).toLocaleString('en-GB') : 'Not yet'],
            ]} />
          </Card>

          <Card title="Record the money">
            <PostForm action="/api/admin/orders" hidden={{ id: order.id, action: 'record-payment' }} submitLabel="Record payment" submitVariant="primary" testId="record-payment" footer={null}>
              <Field label="Amount received" htmlFor={`amt-${order.id}`}>
                <Input id={`amt-${order.id}`} name="amount" defaultValue={Number(order.order_total).toFixed(2)} />
              </Field>
              <Field label="Payment status" htmlFor={`stat-${order.id}`}>
                <Select id={`stat-${order.id}`} name="payment_status" defaultValue={order.payment_method === 'bank_transfer' ? 'Money received — bank transfer' : 'Cash collected — cash on delivery'}>
                  <option>Money received — bank transfer</option>
                  <option>Cash collected — cash on delivery</option>
                  <option>Payment failed</option>
                </Select>
              </Field>
              <Field label="Reference or transaction number" htmlFor={`ref-${order.id}`} hint="Needed for a bank transfer, so the money can be matched.">
                <Input id={`ref-${order.id}`} name="reference_number" defaultValue={payment?.reference_number || ''} data-testid="payment-reference" />
              </Field>
              <button className="btn btn--primary" type="submit" data-testid="record-payment-submit">Record payment</button>
            </PostForm>
            <p className="hint">
              A bank transfer stays unpaid until the money is recorded here, and only then can the order be confirmed.
              Cash on delivery is marked when the courier collects it.
            </p>
          </Card>

          {order.return_requests?.length ? (
            <Card title="Returns on this order">
              {order.return_requests.map((request) => (
                <p key={request.id} className="u-small">
                  <Badge tone={request.decision === 'pending' ? 'warn' : request.decision === 'approved' ? 'ok' : 'danger'}>{request.decision}</Badge>{' '}
                  {request.reason}
                  {request.decision === 'pending' && <> · <Link href={`/admin/returns/${request.id}`}>Decide this request</Link></>}
                </p>
              ))}
            </Card>
          ) : null}
        </div>
      </div>
    </AdminPage>
  );
}
