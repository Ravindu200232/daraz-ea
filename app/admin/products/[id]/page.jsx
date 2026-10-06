import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Alert, Badge, Button, Kv } from '@/components/ui/index.jsx';
import { ProductForm } from '@/components/admin/ProductForm.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCategories } from '@/lib/queries.js';
import { supabaseServer } from '@/lib/supabase.js';
import { formatRs2 } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

async function loadProduct(id) {
  const supabase = await supabaseServer();
  const { data: product } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (!product) return null;
  const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', id).order('size');
  return { product, variants: variants || [] };
}

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const viewer = await requireManagement(`/admin/products/${id}`);
  const data = await loadProduct(id);
  if (!data) notFound();
  const categories = await getCategories();
  const { product, variants } = data;
  const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock_count), 0);
  const outOfStock = variants.filter((variant) => Number(variant.stock_count) <= 0).length;

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/products"
      title="Edit product"
      subtitle={`Last saved ${new Date(product.updated_at).toLocaleString('en-GB')}`}
      actions={<>
        <Badge tone={product.status === 'shown' ? 'ok' : 'off'}>{product.status === 'shown' ? 'Shown on store' : 'Hidden'}</Badge>
        <Link className="u-small" href={`/product/${product.slug}`}>View on store</Link>
      </>}
    >
      <p className="u-small"><Link href="/admin/products">← Back to products</Link></p>

      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <ProductForm product={product} categories={categories} variants={variants} />
        </div>
        <aside className="stack">
          <div className="card">
            <div className="card__hd"><h2 className="u-mb0">This product</h2></div>
            <div className="card__bd">
              <Kv rows={[
                ['Price', formatRs2(product.price)],
                ['Sale price', product.sale_price ? formatRs2(product.sale_price) : '—'],
                ['Combinations', `${variants.length}`],
                ['Total stock', `${totalStock}`],
                ['Out of stock', `${outOfStock} combination${outOfStock === 1 ? '' : 's'}`],
                ['Category', categories.find((category) => category.id === product.category_id)?.name || '—'],
              ]} />
              <p className="u-small"><Link href="/admin/products">Back to the product list</Link></p>
            </div>
          </div>
          <Alert tone="soft" title="Saving updates the storefront straight away">
            The new price and stock counts are live on the store, and nobody is emailed.
          </Alert>
          <p><Button href={`/product/${product.slug}`} variant="ghost">See it on the storefront</Button></p>
        </aside>
      </div>
    </AdminPage>
  );
}
