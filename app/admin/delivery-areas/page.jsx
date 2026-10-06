import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Stat, Field, Input, Alert, EmptyState } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireOwner } from '@/lib/auth.js';
import { getDeliveryAreas } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Delivery Areas — DarazEA management' };

export default async function DeliveryAreasPage() {
  const viewer = await requireOwner('/admin/delivery-areas');
  const areas = await getDeliveryAreas({ onlyActive: false });
  const active = areas.filter((area) => area.is_active).length;

  return (
    <AdminPage viewer={viewer} active="/admin/delivery-areas" title="Delivery Areas" subtitle="Currency: Sri Lankan Rupees (LKR)">
      <section className="stats">
        <Stat value={areas.length} label="Areas set up"><p>Cities and areas the store delivers to.</p></Stat>
        <Stat value={active} label="Delivering now"><p>Offered to shoppers at Checkout.</p></Stat>
        <Stat value={areas.length - active} label="Switched off"><p>Kept on file, not offered at Checkout.</p></Stat>
      </section>

      <Card
        title="Add an area"
        className="u-mt5"
        footerStart
        footer={<span className="u-small u-muted">A new area starts delivering straight away. Switch it off in the list below when the store stops covering it.</span>}
      >
        <PostForm action="/api/admin/delivery-areas" hidden={{ action: 'save' }} submitLabel="Add area" submitVariant="primary" testId="area-form" resetOnSuccess footer={null}>
          <div className="u-flex" style={{ alignItems: 'flex-start' }}>
            <Field label="Area or city" htmlFor="area-name">
              <Input id="area-name" name="name" required data-testid="area-name" />
            </Field>
            <Field label="Fixed delivery fee (LKR)" htmlFor="area-fee" hint="Added to the order total at Checkout — delivery is never free.">
              <Input id="area-fee" name="delivery_fee" inputMode="decimal" required data-testid="area-fee" />
            </Field>
          </div>
          <button className="btn btn--primary" type="submit" data-testid="area-save">Add area</button>
        </PostForm>
      </Card>

      <Card
        title={`Delivery areas · ${areas.length} areas`}
        aside={<span className="u-small u-muted">One fixed fee per area or city. Shoppers choose their area at Checkout.</span>}
        className="u-mt4"
        footerStart
        footer={<span className="u-small u-muted">Every delivering area adds its fixed fee to the order total at Checkout. Switched-off areas are kept here with their fee, but shoppers are not offered them.</span>}
      >
        {areas.length ? (
          <Table
            stack
            columns={[
              { key: 'name', label: 'Area or city' },
              { key: 'fee', label: 'Fixed delivery fee', align: 'right' },
              { key: 'delivering', label: 'Delivering' },
              { key: 'actions', label: 'Actions' },
            ]}
            rows={areas.map((area) => ({
              key: area.id,
              cells: {
                name: <strong>{area.name}</strong>,
                fee: formatRs(area.delivery_fee),
                delivering: <Badge tone={area.is_active ? 'ok' : 'off'}>{area.is_active ? 'Delivering' : 'Switched off'}</Badge>,
                actions: (
                  <div className="row-actions">
                    <form method="get" action="/admin/delivery-areas" className="u-flex" style={{ gap: 8 }}>
                      <input type="hidden" name="edit" value={area.id} />
                      <Button size="sm" variant="default" type="submit" data-testid={`edit-fee-${area.name}`}>Edit fee</Button>
                    </form>
                    <PostButton
                      action="/api/admin/delivery-areas"
                      payload={{ action: 'toggle', id: area.id }}
                      size="sm"
                      testId={`toggle-area-${area.name}`}
                    >
                      {area.is_active ? 'Switch off' : 'Switch on'}
                    </PostButton>
                  </div>
                ),
              },
            }))}
          />
        ) : (
          <EmptyState title="No delivery areas yet">
            <p>Add the first city or area the store delivers to and set its fixed fee.</p>
          </EmptyState>
        )}
      </Card>

      <Card title="Change a fixed fee" className="u-mt4">
        <PostForm action="/api/admin/delivery-areas" hidden={{ action: 'save' }} submitLabel="Save fee" submitVariant="primary" testId="fee-form" footer={null}>
          <Field label="Area or city" htmlFor="fee-area" hint="Type the name exactly as it is on the list; this sets its fixed fee.">
            <Input id="fee-area" name="name" defaultValue={areas[0]?.name || ''} required />
          </Field>
          <Field label="Fixed delivery fee (LKR)" htmlFor="fee-value" hint="The fee is added to the order total at Checkout and must be greater than zero.">
            <Input id="fee-value" name="delivery_fee" defaultValue={areas[0]?.delivery_fee ?? ''} required />
          </Field>
          <button className="btn btn--primary" type="submit">Save fee</button>
        </PostForm>
        <Alert tone="soft" className="u-mt3" title="A fee of zero is refused">
          Delivery is never free: an area whose fee is zero or less cannot be saved, and an area that is switched off is not offered at Checkout.
        </Alert>
      </Card>
    </AdminPage>
  );
}
