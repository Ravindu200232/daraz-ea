import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Kv, Facts, Table, Alert, Field, Textarea } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getReturn } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

export default async function ReturnDetailPage({ params }) {
  const { id } = await params;
  const viewer = await requireManagement(`/admin/returns/${id}`);
  const request = await getReturn(id);
  if (!request) notFound();

  const order = request.orders || {};
  const item = request.order_items || {};
  const product = item.products || {};

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/returns"
      title={`Return request RT-${String(request.id).slice(0, 3).toUpperCase()}`}
      actions={<Link className="u-small" href="/admin/returns">← All returns</Link>}
    >
      <div className="u-flex">
        <h2 className="u-mb0">{product.name} — {item.variant_label}</h2>
        <Badge tone={request.decision === 'pending' ? 'warn' : request.decision === 'approved' ? 'ok' : 'danger'}>
          {request.decision === 'pending' ? 'Waiting for a decision' : request.decision === 'approved' ? 'Approved' : 'Rejected'}
        </Badge>
      </div>

      <Facts rows={[
        ['Requested on', new Date(request.requested_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['Customer', request.customer_name],
        ['Order', order.order_number],
        ['Decision', request.decision === 'pending' ? <Badge key="d" tone="off">Not decided yet</Badge> : <Badge key="d" tone={request.decision === 'approved' ? 'ok' : 'danger'}>{request.decision}</Badge>],
      ]} />

      <div className="grid grid--2 u-mt5" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Card title="Requested item">
            <Table
              stack
              columns={[
                { key: 'item', label: 'Item' },
                { key: 'variant', label: 'Size & colour' },
                { key: 'qty', label: 'Qty' },
                { key: 'unit', label: 'Unit price', align: 'right' },
                { key: 'line', label: 'Line total', align: 'right' },
              ]}
              rows={[{ key: item.id, cells: {
                item: product.name,
                variant: item.variant_label,
                qty: item.quantity,
                unit: formatRs(item.unit_price),
                line: formatRs(item.line_total),
              } }]}
            />
            <p className="subhead u-mt4">Reason given by the shopper</p>
            <blockquote style={{ borderLeft: '4px solid var(--color-accent)', paddingLeft: 'var(--space-3)', margin: 0, fontStyle: 'italic', color: 'var(--color-primary-700)' }}>
              “{request.reason}”
            </blockquote>
          </Card>

          <Card title="The order this request belongs to" footer={<Button href={`/admin/orders/${order.id}`} variant="default">Open order {order.order_number}</Button>}>
            <Kv rows={[
              ['Order', <Link key="o" href={`/admin/orders/${order.id}`}>{order.order_number}</Link>],
              ['Customer', `${order.customer_name} · ${order.customer_phone}`],
              ['Placed', order.placed_at ? new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
              ['Order stage', <Badge key="s" tone={order.order_status === 'delivered' ? 'ok' : 'info'}>{order.order_status}</Badge>],
              ['Delivery area', `${order.delivery_area_name} — fee ${formatRs(order.delivery_fee)}`],
              ['Payment', `${order.payment_method} · ${order.payment_status}`],
              ['Order total', formatRs(order.order_total)],
            ]} />
          </Card>
        </div>

        <Card title="Record a decision">
          {request.decision !== 'pending' ? (
            <div data-testid="decision-recorded">
              <Alert tone="ok" title={`Decision recorded — ${request.decision}`}>
                Decided on {request.decided_at ? new Date(request.decided_at).toLocaleString('en-GB') : '—'}.
              </Alert>
              <blockquote style={{ borderLeft: '4px solid var(--color-accent)', paddingLeft: 'var(--space-3)', margin: 'var(--space-4) 0', fontStyle: 'italic' }}>
                “{request.decision_note}”
              </blockquote>
              <p className="u-small u-muted">Shown to the shopper on order {order.order_number}. Any refund is handled outside the store.</p>
              <Link className="small" href={`/admin/orders/${order.id}`}>Open order {order.order_number}</Link>
            </div>
          ) : (
            <PostForm action="/api/admin/returns" hidden={{ id: request.id }} submitLabel="Save decision" submitVariant="primary" testId="decision-form" footer={null}>
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="subhead">Decision</legend>
                <label className="check check--card">
                  <input type="radio" name="decision" value="approved" defaultChecked />
                  <span><strong>Approved</strong> <span className="u-small u-muted">— the shopper keeps or sends back the item as agreed</span></span>
                </label>
                <label className="check check--card">
                  <input type="radio" name="decision" value="rejected" />
                  <span><strong>Rejected</strong> <span className="u-small u-muted">— the request is closed</span></span>
                </label>
              </fieldset>

              <Alert tone="warn" title="Any refund is handled outside the store." className="u-mt3">
                Nothing is paid back to the shopper from this screen — arrange the money with them yourself.
              </Alert>

              <Field label="Note for the shopper" htmlFor="dnote" hint={`Shown to the shopper on order ${order.order_number}.`}>
                <Textarea id="dnote" name="decision_note" rows="4" defaultValue="Approved. Please keep the item for now — our courier will collect it, and we will be in touch about the replacement." />
              </Field>

              <button className="btn btn--primary" type="submit" data-testid="decision-submit">Save decision</button>
            </PostForm>
          )}
          <p className="u-mt3"><Link className="btn btn--ghost btn--sm" href="/admin/returns">Back to Returns</Link></p>
        </Card>
      </div>
    </AdminPage>
  );
}
