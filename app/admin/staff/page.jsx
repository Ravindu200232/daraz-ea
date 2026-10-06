import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Alert, Field, Input, Button, Table } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireOwner } from '@/lib/auth.js';
import { getStaff } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff Members — DarazEA management' };

export default async function StaffMembersPage() {
  const viewer = await requireOwner('/admin/staff');
  const staff = await getStaff();
  const active = staff.filter((member) => member.status === 'active').length;

  return (
    <AdminPage viewer={viewer} active="/admin/staff" title="Staff Members" subtitle={`Signed in as ${viewer.staff?.full_name} · Store Owner`}>
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <Card title="Staff members" aside={<span className="u-small u-muted">{staff.length} accounts · {active} active · {staff.length - active} switched off</span>}>
          <Table
            stack
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email address' },
              { key: 'role', label: 'Role' },
              { key: 'status', label: 'Status' },
              { key: 'added', label: 'Added' },
              { key: 'action', label: 'Action' },
            ]}
            rows={staff.map((member) => ({
              key: member.id,
              cells: {
                name: <>{member.full_name} {member.role === 'store_owner' ? <Badge tone="accent">Owner</Badge> : null}</>,
                email: member.email,
                role: member.role === 'store_owner' ? 'Store Owner' : 'Staff',
                status: <Badge tone={member.status === 'active' ? 'ok' : 'off'}>{member.status === 'active' ? 'Active' : 'Switched off'}</Badge>,
                added: new Date(member.added_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                action: member.role === 'store_owner'
                  ? <span className="u-muted">—</span>
                  : (
                    <PostButton
                      action="/api/admin/staff"
                      payload={{ action: 'toggle', id: member.id }}
                      size="sm"
                      testId={`toggle-staff-${member.email}`}
                    >
                      {member.status === 'active' ? 'Switch off' : 'Switch on'}
                    </PostButton>
                  ),
              },
            }))}
          />
        </Card>

        <div className="stack">
          <Card title="Add a staff member">
            <PostForm action="/api/admin/staff" hidden={{ action: 'add' }} submitLabel="Add staff member" submitVariant="primary" testId="staff-form" resetOnSuccess footer={null}>
              <Field label="Full name" htmlFor="staffname">
                <Input id="staffname" name="full_name" required data-testid="staff-name" />
              </Field>
              <Field label="Email address" htmlFor="staffemail" hint="Staff sign in at the Management Sign In with this address and a one-time code sent to them.">
                <Input id="staffemail" name="email" type="email" required data-testid="staff-email" />
              </Field>
              <p className="field__label">Role</p>
              <p className="u-mb0"><Badge tone="accent">Staff</Badge></p>
              <p className="hint">Staff handle products, orders, returns, coupons, shoppers and reviews. Payments and store settings stay with the Store Owner.</p>
              <button className="btn btn--primary" type="submit" data-testid="staff-save">Add staff member</button>
            </PostForm>
          </Card>

          <Card title="What staff can reach">
            <p className="u-small u-muted u-mb0">
              Products, categories, per-size stock, orders, returns, customers, reviews and coupons.
              Delivery fees, payments, store settings and staff accounts stay with the Store Owner.
            </p>
          </Card>

          <Card title="How staff sign in" footer={<Button href="/admin/login" variant="default">Open the Management Sign In</Button>}>
            <p className="u-small u-muted u-mb0">
              With a work email and password or a Google account, then the one-time code sent to them. A new account sets its own password
              through the Forgot Password link, and a switched-off account cannot sign in at all.
            </p>
          </Card>

          <Alert tone="soft" title="Only the Staff role">
            Every account added here is Staff. A Staff member cannot be given the Store Owner's screens, and the Store Owner's own account cannot be switched off from this page.
          </Alert>
        </div>
      </div>
    </AdminPage>
  );
}
