import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Table, Field, Select } from '@/components/ui/index.jsx';
import { SubmitOnChange } from '@/components/ui/client.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCategories, getProducts } from '@/lib/queries.js';
import { formatRs2 } from '@/lib/money.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Products — DarazEA management' };

export default async function AdminProductsPage({ searchParams }) {
  const viewer = await requireManagement('/admin/products');
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const sort = ['price-asc', 'price-desc', 'name', 'stock'].includes(params.sort) ? params.sort : 'name';
  const [categories, { rows, total }] = await Promise.all([
    getCategories(),
    getProducts({ q, includeHidden: true, sort: sort === 'stock' ? 'name' : sort, perPage: 0 }),
  ]);
  const byId = new Map(categories.map((category) => [category.id, category]));

  const filtered = rows.filter((product) => {
    if (params.category && params.category !== 'all' && byId.get(product.category_id)?.slug !== params.category) return false;
    if (params.status === 'hidden' && product.status !== 'hidden') return false;
    if (params.status === 'shown' && product.status !== 'shown') return false;
    if (params.status === 'outofstock' && product.in_stock) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'stock') return a.stock_total - b.stock_total;
    if (sort === 'price-asc') return Number(a.sale_price ?? a.price) - Number(b.sale_price ?? b.price);
    if (sort === 'price-desc') return Number(b.sale_price ?? b.price) - Number(a.sale_price ?? a.price);
    return a.name.localeCompare(b.name);
  });

  return (
    <AdminPage viewer={viewer} active="/admin/products" title="Products" subtitle={`${viewer.staff?.full_name} · ${viewer.role === 'store_owner' ? 'Store Owner' : 'Staff'}`}>
      <div className="u-between u-mb4">
        <form method="get" action="/admin/products" role="search" className="search" style={{ maxWidth: 420 }}>
          <label className="sr" htmlFor="product-search">Search products by name</label>
          <input className="search__input" id="product-search" name="q" type="search" defaultValue={q} placeholder="Search products by name" data-testid="product-search" />
          <button className="search__btn" type="submit">Search</button>
        </form>
        <Button href="/admin/products/new" variant="primary" data-testid="new-product">New Product</Button>
      </div>

      <Card className="u-mb4">
        <form method="get" action="/admin/products" className="u-flex">
          <Field label="Category" htmlFor="fcat" className="u-mb0">
            <Select id="fcat" name="category" defaultValue={params.category || 'all'}>
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
            </Select>
          </Field>
          <Field label="Status" htmlFor="fst" className="u-mb0">
            <Select id="fst" name="status" defaultValue={params.status || 'all'}>
              <option value="all">All statuses</option>
              <option value="shown">Shown on the store</option>
              <option value="hidden">Hidden</option>
              <option value="outofstock">Out of stock</option>
            </Select>
          </Field>
          <Button variant="default" type="submit">Apply filters</Button>
          <Button href="/admin/products" variant="ghost">Reset</Button>
          <p className="u-small u-muted u-mb0 u-push">Sorted by {sort.replace('-', ' ')}</p>
        </form>
      </Card>

      <div className="u-between u-mb3">
        <p className="u-small u-muted u-mb0">Showing {sorted.length} of {total} products, including hidden ones</p>
        <p className="u-small u-muted u-mb0">Open a product name to change its details, prices or the stock on each size and colour.</p>
      </div>

      <Table
        stack
        columns={[
          { key: 'photo', label: 'Photo' },
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'price', label: 'Price', align: 'right' },
          { key: 'sale', label: 'Sale price', align: 'right' },
          { key: 'stock', label: 'Total stock', align: 'right' },
          { key: 'state', label: 'Out of stock' },
        ]}
        rows={sorted.map((product) => ({
          key: product.id,
          cells: {
            photo: <span className="media media--xs">{product.photos?.[0] ? <img src={`${product.photos[0]}?auto=format&fit=crop&w=120&q=60`} alt="" /> : null}</span>,
            name: <><Link href={`/admin/products/${product.id}`} data-testid={`product-${product.slug}`}>{product.name}</Link> {product.status === 'hidden' ? <Badge tone="off">Hidden</Badge> : null}</>,
            category: byId.get(product.category_id)?.name,
            price: formatRs2(product.price),
            sale: product.sale_price ? formatRs2(product.sale_price) : <span className="u-muted">—</span>,
            stock: product.stock_total,
            state: product.in_stock
              ? <Badge tone={product.stock_total < 10 ? 'warn' : 'ok'}>{product.stock_total < 10 ? 'Low stock' : 'In stock'}</Badge>
              : <Badge tone="off">Out of stock</Badge>,
          },
        }))}
      />

      <p className="u-mt4"><Button href="/admin/categories" variant="ghost">Keep categories in order</Button></p>
    </AdminPage>
  );
}
