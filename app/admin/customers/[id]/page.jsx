import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Kv, Table, EmptyState } from '@/components/ui/index.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCustomer } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';
import { STAGE_LABELS } from '@/lib/constants.js';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }) {
  const { id } = await params;
  const viewer = await requireManagement(`/admin/customers/${id}`);
  const data = await getCustomer(id);
  if (!data) notFound();

  const { customer, orders } = data;
  const spent = orders.reduce((sum, order) => sum + Number(order.order_total || 0), 0);

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/customers"
      title="Customer detail"
      actions={<Link className="u-small" href="/admin/customers">← Back to Customers</Link>}
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <Card title="Shopper details" aside={<Badge tone={customer.account_status === 'active' ? 'ok' : 'off'}>{customer.account_status === 'active' ? 'Active' : 'Switched off'}</Badge>}>
          <Kv rows={[
            ['Full name', customer.full_name],
            ['Email address', customer.email],
            ['Phone number', customer.phone],
            ['Sign-in method', customer.sign_in_method === 'google' ? 'Google account' : 'Email and password'],
            ['Joined date', new Date(customer.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
            ['Account status', customer.account_status],
            ['Orders placed', `${orders.length}`],
            ['Spent with the store', formatRs(spent)],
          ]} />
        </Card>

        <Card title="Order history" aside={<span className="u-small u-muted">{orders.length} orders, newest first</span>}>
          {orders.length ? (
            <Table
              stack
              columns={[
                { key: 'order', label: 'Order' },
                { key: 'placed', label: 'Placed' },
                { key: 'total', label: 'Total', align: 'right' },
                { key: 'stage', label: 'Stage' },
                { key: 'action', label: 'Action' },
              ]}
              rows={orders.map((order) => ({
                key: order.id,
                cells: {
                  order: <strong>{order.order_number}</strong>,
                  placed: new Date(order.placed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                  total: formatRs(order.order_total),
                  stage: <Badge tone={order.order_status === 'delivered' ? 'ok' : order.order_status === 'placed' ? 'info' : 'accent'}>{STAGE_LABELS[order.order_status]}</Badge>,
                  action: <Link href={`/admin/orders/${order.id}`} data-testid={`open-${order.order_number}`}>Open order</Link>,
                },
              }))}
            />
          ) : (
            <EmptyState title="No orders yet">
              <p>Every order this shopper places will be listed here, newest first, with its stage and total.</p>
            </EmptyState>
          )}
          {orders.some((order) => order.order_status === 'placed') && (
            <p className="u-mt3">
              <Button href={`/admin/orders/${orders.find((order) => order.order_status === 'placed').id}`} variant="primary">
                Move the waiting order on
              </Button>
            </p>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}
