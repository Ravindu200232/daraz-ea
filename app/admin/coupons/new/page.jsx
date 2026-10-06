import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Alert } from '@/components/ui/index.jsx';
import { CouponForm } from '@/components/admin/CouponForm.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getCategories } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Coupon — DarazEA management' };

export default async function NewCouponPage() {
  const viewer = await requireManagement('/admin/coupons/new');
  const categories = await getCategories();

  return (
    <AdminPage
      viewer={viewer}
      active="/admin/coupons"
      title="New Coupon"
      actions={<Link className="u-small" href="/admin/coupons">Back to Coupons</Link>}
    >
      <Alert tone="soft" className="u-mb4" title="Codes have to be unique.">
        A code that already exists is refused and the existing coupon is offered instead. Every use of a code is recorded with the order it was used on and the discount given.
      </Alert>
      <CouponForm categories={categories} />
    </AdminPage>
  );
}
