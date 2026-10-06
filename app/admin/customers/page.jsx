import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Field, Input } from '@/components/ui/index.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCustomers } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Customers — DarazEA management' };

export default async function AdminCustomersPage({ searchParams }) {
  const viewer = await requireManagement('/admin/customers');
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const customers = await getCustomers({ q });

  return (
    <AdminPage viewer={viewer} active="/admin/customers" title="Customers" subtitle={`${customers.length} shopper account${customers.length === 1 ? '' : 's'}`}>
      <Card className="u-mb4">
        <form method="get" action="/admin/customers" role="search">
          <Field label="Find a shopper" htmlFor="q" hint="Part of a name, an email address or a phone number is enough.">
            <div className="u-flex" style={{ flexWrap: 'nowrap' }}>
              <Input id="q" name="q" type="search" defaultValue={q} placeholder="Name, email address or phone number" data-testid="customer-search" />
              <Button variant="primary" type="submit" data-testid="customer-search-submit">Search</Button>
              <Button href="/admin/customers" variant="default">Clear</Button>
            </div>
          </Field>
        </form>
      </Card>

      <div className="u-between u-mb3">
        <p className="u-small u-mb0"><strong>{customers.length}</strong> shopper{customers.length === 1 ? '' : 's'} {q ? `matching “${q}”` : 'on the store'}</p>
        <p className="u-small u-muted u-mb0">Sorted by joined date, newest first</p>
      </div>

      {customers.length ? (
        <Table
          stack
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email address' },
            { key: 'phone', label: 'Phone number' },
            { key: 'joined', label: 'Joined' },
            { key: 'status', label: 'Account status' },
          ]}
          rows={customers.map((customer) => ({
            key: customer.id,
            cells: {
              name: <Link href={`/admin/customers/${customer.id}`} data-testid={`customer-${customer.id}`}>{customer.full_name}</Link>,
              email: customer.email,
              phone: customer.phone,
              joined: new Date(customer.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              status: <Badge tone={customer.account_status === 'active' ? 'ok' : 'off'}>{customer.account_status === 'active' ? 'Active' : 'Switched off'}</Badge>,
            },
          }))}
        />
      ) : (
        <Card title="No shopper matches that search">
          <p className="u-small u-muted">Try the name, the email address or the phone number as it was given to you.</p>
          <Button href="/admin/customers" variant="default">Clear search</Button>
        </Card>
      )}

      <p className="u-small u-muted u-mt3">
        Only shoppers who placed an order with an account are listed here; a guest order keeps its own name and phone number on the order.
      </p>
    </AdminPage>
  );
}
