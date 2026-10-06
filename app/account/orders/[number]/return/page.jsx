import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Alert, Kv, Badge, Field, Select } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { requireShopper } from '@/lib/auth.js';
import { getOrderForCustomer } from '@/lib/queries.js';
import { requestableItems } from '@/lib/returns.js';
import { RETURN_REASONS } from '@/lib/constants.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

export default async function RequestReturnPage({ params }) {
  const { number } = await params;
  const viewer = await requireShopper(`/account/orders/${number}/return`);
  const order = await getOrderForCustomer(number, viewer.user.id);
  if (!order) notFound();

  const items = requestableItems(order.order_items || [], order.return_requests || []);
  const requestable = items.filter((item) => item.state === 'not_requested');

  return (
    <StorefrontPage account>
      <div className="container">
        <Link className="u-small" href={`/account/orders/${order.order_number}`}>← Back to order {order.order_number}</Link>
        <h1 className="u-mt3">Request a return</h1>
        <p className="u-muted">
          Order {order.order_number} · {order.order_status === 'delivered' ? `Delivered ${new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : `At ${order.order_status}`} · {order.delivery_area_name} · {order.order_items?.length} items
        </p>

        <div className="layout layout--aside u-mt5">
          <Card title="Which item is coming back?">
            {order.order_status !== 'delivered' ? (
              <Alert tone="warn" title="This order has not been delivered yet">
                An item can be sent back once the order has arrived. <Link href="/track">Track the order</Link> to see where it has got to.
              </Alert>
            ) : (
              <PostForm action="/api/returns" hidden={{ orderNumber: order.order_number }} submitLabel="Send return request" submitVariant="primary" testId="return-form" footer={null}>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="subhead">One item at a time — pick the item you want to return.</legend>
                  <div className="stack" data-testid="return-items">
                    {items.map((item) => (
                      <label
                        className="address-card"
                        key={item.id}
                        style={{ opacity: item.state === 'not_requested' ? 1 : 0.72 }}
                      >
                        <input
                          type="radio"
                          name="order_item_id"
                          value={item.id}
                          disabled={item.state !== 'not_requested'}
                          defaultChecked={item.state === 'not_requested' && requestable[0]?.id === item.id}
                        />
                        <span>
                          <strong>{item.product_name}</strong>
                          <span className="u-small u-muted" style={{ display: 'block' }}>
                            {item.variant_label} · Qty {item.quantity} · {formatRs(item.line_total)}
                          </span>
                        </span>
                        {item.state === 'waiting' && <Badge tone="warn">Waiting for a decision</Badge>}
                        {item.state === 'decided' && <Badge tone={item.request?.decision === 'approved' ? 'ok' : 'danger'}>{item.request?.decision === 'approved' ? 'Approved' : 'Rejected'}</Badge>}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Field label="Why is this item coming back?" htmlFor="reason" hint="The store team reads this together with the order — one line is enough.">
                  <Select id="reason" name="reason" defaultValue={RETURN_REASONS[0]} data-testid="return-reason">
                    {RETURN_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                  </Select>
                </Field>

                <Alert tone="warn" title="Any refund is handled outside the store.">
                  DarazEA does not refund money through this site. If the store approves the return, the team will contact you about how the money reaches you.
                </Alert>

                <div className="u-flex u-mt4">
                  <button className="btn btn--primary" type="submit" data-testid="return-submit">Send return request</button>
                  <Button href={`/account/orders/${order.order_number}`} variant="ghost">Cancel</Button>
                </div>
              </PostForm>
            )}
          </Card>

          <aside className="stack">
            <Card title="This order">
              <Kv rows={[
                ['Order number', order.order_number],
                ['Delivered on', order.order_status === 'delivered' ? new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not yet'],
                ['Delivery area', `${order.delivery_area_name} · ${formatRs(order.delivery_fee)}`],
                ['Coupon', order.coupon_code ? `${order.coupon_code} · −${formatRs(order.discount_amount)}` : 'None'],
                ['Order total', formatRs(order.order_total)],
                ['Payment', order.payment_status],
              ]} />
              <p className="hint">Requests already sent on this order: {(order.return_requests || []).length}.</p>
            </Card>

            <Card title="Before you send it">
              <p className="u-small u-muted u-mb0">
                Keep the item and its packaging until you hear back. One request per item, and a request that has already been decided cannot be changed.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </StorefrontPage>
  );
}
