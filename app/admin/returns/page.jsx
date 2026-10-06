import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Alert, EmptyState } from '@/components/ui/index.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getReturns } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Returns — DarazEA management' };

export default async function AdminReturnsPage({ searchParams }) {
  const viewer = await requireManagement('/admin/returns');
  const params = await searchParams;
  const state = ['pending', 'approved', 'rejected'].includes(params.state) ? params.state : 'all';
  const all = await getReturns();
  const rows = state === 'all' ? all : all.filter((request) => request.decision === state);
  const waiting = all.filter((request) => request.decision === 'pending');

  return (
    <AdminPage viewer={viewer} active="/admin/returns" title="Returns" subtitle="Last refreshed just now">
      <div className="u-between u-mb4">
        <span className="u-small u-muted">Filters by state</span>
        <nav className="u-flex" aria-label="Filter return requests by state">
          <Link className={`btn btn--sm${state === 'all' ? ' btn--primary' : ''}`} href="/admin/returns">All requests <Badge tone="accent">{all.length}</Badge></Link>
          <Link className={`btn btn--sm${state === 'pending' ? ' btn--primary' : ''}`} href="/admin/returns?state=pending">Waiting <Badge tone="accent">{waiting.length}</Badge></Link>
          <Link className={`btn btn--sm${state === 'approved' ? ' btn--primary' : ''}`} href="/admin/returns?state=approved">Approved <Badge tone="accent">{all.filter((r) => r.decision === 'approved').length}</Badge></Link>
          <Link className={`btn btn--sm${state === 'rejected' ? ' btn--primary' : ''}`} href="/admin/returns?state=rejected">Rejected <Badge tone="accent">{all.filter((r) => r.decision === 'rejected').length}</Badge></Link>
        </nav>
      </div>

      <section aria-labelledby="waiting-title">
        <div className="u-between u-mb3">
          <h2 className="u-mb0" id="waiting-title">Requests waiting for a decision</h2>
          <span className="u-small u-muted">Decide each one on its own request page</span>
        </div>

        {waiting.length ? (
          <div className="grid grid--3" data-testid="waiting-returns">
            {waiting.map((request) => (
              <Card key={request.id} title={request.orders?.order_number} aside={<Badge tone="warn">Waiting</Badge>}>
                <p className="u-strong u-mb0">{request.order_items?.product_name}</p>
                <p className="u-small u-muted">{request.order_items?.variant_label} · Quantity {request.order_items?.quantity}</p>
                <blockquote className="u-small" style={{ borderLeft: '4px solid var(--color-accent)', paddingLeft: 'var(--space-3)', margin: 'var(--space-3) 0', fontStyle: 'italic' }}>
                  “{request.reason}”
                </blockquote>
                <p className="u-small u-muted">Customer: {request.customer_name} · Requested {new Date(request.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <div className="u-flex">
                  <Button href={`/admin/orders/${request.orders?.id}`} size="sm" variant="default">View order</Button>
                  <Button href={`/admin/returns/${request.id}`} size="sm" variant="primary" data-testid={`open-return-${request.orders?.order_number}`}>Open request</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Alert tone="soft" title="No requests waiting">Every request on the list has a decision recorded.</Alert>
        )}
      </section>

      <section className="section" aria-labelledby="decided-title">
        <div className="u-between u-mb3">
          <h2 className="u-mb0" id="decided-title">Requests already decided</h2>
          <span className="u-small u-muted">Newest decision first</span>
        </div>

        {rows.filter((request) => request.decision !== 'pending').length ? (
          <Table
            stack
            columns={[
              { key: 'order', label: 'Order' },
              { key: 'customer', label: 'Customer' },
              { key: 'item', label: 'Item' },
              { key: 'reason', label: 'Reason' },
              { key: 'requested', label: 'Requested' },
              { key: 'decision', label: 'Decision' },
              { key: 'note', label: 'Decision note' },
              { key: 'open', label: '' },
            ]}
            rows={rows.filter((request) => request.decision !== 'pending').map((request) => ({
              key: request.id,
              cells: {
                order: <Link href={`/admin/orders/${request.orders?.id}`}><strong>{request.orders?.order_number}</strong></Link>,
                customer: request.customer_name,
                item: <>{request.order_items?.product_name}<span className="u-small u-muted" style={{ display: 'block' }}>{request.order_items?.variant_label}</span></>,
                reason: request.reason,
                requested: new Date(request.requested_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                decision: <Badge tone={request.decision === 'approved' ? 'ok' : 'danger'}>{request.decision === 'approved' ? 'Approved' : 'Rejected'}</Badge>,
                note: request.decision_note || '—',
                open: <Link href={`/admin/returns/${request.id}`}>Open</Link>,
              },
            }))}
          />
        ) : (
          <EmptyState title="No further decided requests">
            <p>A request moves here once its decision is recorded.</p>
          </EmptyState>
        )}
      </section>
    </AdminPage>
  );
}
