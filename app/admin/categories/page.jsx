import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Field, Input, Select, Textarea, Alert } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCategories } from '@/lib/queries.js';
import { categoryImage } from '@/lib/images.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categories — DarazEA management' };

export default async function AdminCategoriesPage({ searchParams }) {
  const viewer = await requireManagement('/admin/categories');
  const params = await searchParams;
  const categories = await getCategories();
  const departments = categories.filter((category) => !category.parent_category_id);
  const editing = categories.find((category) => category.id === params.edit) || null;
  const childrenOf = (id) => categories.filter((category) => category.parent_category_id === id);

  return (
    <AdminPage viewer={viewer} active="/admin/categories" title="Categories" subtitle="Catalogue">
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <Card title={`${categories.length} categories · ${departments.length} top level`} aside={<Button href="#new-category" variant="ghost" size="sm">New category</Button>}>
          <Table
            columns={[
              { key: 'image', label: 'Image' },
              { key: 'name', label: 'Name' },
              { key: 'description', label: 'Description' },
              { key: 'parent', label: 'Parent category' },
              { key: 'actions', label: 'Actions' },
            ]}
            rows={categories.map((category) => ({
              key: category.id,
              cells: {
                image: (
                  <span className="media media--xs">
                    {categoryImage(category.slug) ? (
                      <img src={`${categoryImage(category.slug)}?auto=format&fit=crop&w=120&q=60`} alt="" />
                    ) : <span className="u-muted">—</span>}
                  </span>
                ),
                name: (
                  <>{category.parent_category_id ? '• ' : '▾ '}
                    <Link href={`/admin/categories?edit=${category.id}`} data-testid={`category-${category.slug}`}>{category.name}</Link>
                    {editing?.id === category.id ? <Badge tone="solid">Editing</Badge> : null}
                  </>
                ),
                description: category.description || '—',
                parent: categories.find((parent) => parent.id === category.parent_category_id)?.name
                  ? categories.find((parent) => parent.id === category.parent_category_id).name
                  : <Badge tone="off">Top level</Badge>,
                actions: (
                  <div className="row-actions">
                    <Button href={`/admin/categories?edit=${category.id}`} size="sm" variant="default">Edit</Button>
                    <PostButton action="/api/admin/categories" payload={{ action: 'delete', id: category.id }} variant="danger" size="sm" testId={`delete-${category.slug}`}>
                      Delete
                    </PostButton>
                  </div>
                ),
              },
            }))}
          />
          <p className="hint">{departments.length} departments · {categories.length - departments.length} categories inside them. A category inside a parent sits under it on the storefront.</p>
        </Card>

        <div className="stack">
          <Card title={editing ? `Edit category · ${editing.name}` : 'Edit category'} aside={<Badge>{editing?.name || 'Pick one to edit'}</Badge>}>
            <PostForm
              action="/api/admin/categories"
              hidden={{ action: 'save', id: editing?.id }}
              submitLabel="Save changes"
              submitVariant="primary"
              testId="category-form"
              footer={null}
            >
              <Field label="Name" htmlFor="cname">
                <Input id="cname" name="name" defaultValue={editing?.name || ''} required data-testid="category-name" />
              </Field>
              <Field label="Description" htmlFor="cdesc">
                <Textarea id="cdesc" name="description" rows="3" defaultValue={editing?.description || ''} />
              </Field>
              <Field label="Image URL" htmlFor="cimage" hint="The picture shoppers see on the department card.">
                <Input id="cimage" name="image_url" defaultValue={editing?.image_url || ''} />
              </Field>
              <Field label="Parent category" htmlFor="cparent" hint="A category inside a parent sits under it on the storefront.">
                <Select id="cparent" name="parent_category_id" defaultValue={editing?.parent_category_id || ''}>
                  <option value="">No parent — top level</option>
                  {departments.filter((department) => department.id !== editing?.id).map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                  {categories.filter((category) => category.parent_category_id && category.id !== editing?.id).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="u-flex">
                <button className="btn btn--primary" type="submit" data-testid="category-save">
                  {editing ? 'Save changes' : 'Create category'}
                </button>
                {editing && <Button href="/admin/categories" variant="ghost">Cancel</Button>}
              </div>
            </PostForm>
          </Card>

          <Card title="New category" id="new-category">
            <PostForm action="/api/admin/categories" hidden={{ action: 'save' }} submitLabel="Create category" submitVariant="primary" testId="new-category-form" resetOnSuccess footer={null}>
              <Field label="Name" htmlFor="newname">
                <Input id="newname" name="name" required data-testid="new-category-name" />
              </Field>
              <Field label="Description" htmlFor="newdesc">
                <Input id="newdesc" name="description" />
              </Field>
              <Field label="Parent category" htmlFor="newparent">
                <Select id="newparent" name="parent_category_id" defaultValue="">
                  <option value="">No parent — top level</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </Select>
              </Field>
              <button className="btn btn--primary" type="submit" data-testid="new-category-save">Create category</button>
            </PostForm>
          </Card>

          <Alert tone="soft" title="Deleting a category">
            A category still used by a product cannot be deleted — move those products first.
          </Alert>
        </div>
      </div>
    </AdminPage>
  );
}
