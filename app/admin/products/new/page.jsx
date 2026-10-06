import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Alert, Button } from '@/components/ui/index.jsx';
import { ProductForm } from '@/components/admin/ProductForm.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCategories } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Product — DarazEA management' };

export default async function NewProductPage() {
  const viewer = await requireManagement('/admin/products/new');
  const categories = await getCategories();

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/products"
      title="New Product"
      actions={<Link className="btn btn--sm" href="/admin/products">Back to Products</Link>}
    >
      <Alert tone="soft" className="u-mb4" title="Saving puts the product in the catalogue and on the storefront straight away.">
        A combination with no stock shows as out of stock on the storefront and cannot be added to a cart.
      </Alert>

      <ProductForm categories={categories} />

      <p className="u-mt4"><Button href="/shop" variant="ghost">See the storefront</Button></p>
    </AdminPage>
  );
}
