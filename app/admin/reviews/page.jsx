import Link from 'next/link';
import { AdminPage } from '@/components/shell/PageFrames.jsx';
import { Card, Badge, Button, Stars, Alert, EmptyState } from '@/components/ui/index.jsx';
import { PostButton } from '@/components/ui/client.jsx';
import { requireManagement } from '@/lib/auth.js';
import { getReviews } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reviews — DarazEA management' };

export default async function AdminReviewsPage({ searchParams }) {
  const viewer = await requireManagement('/admin/reviews');
  const params = await searchParams;
  const filter = ['shown', 'hidden'].includes(params.visibility) ? params.visibility : 'all';
  const all = await getReviews();
  const rows = filter === 'all' ? all : all.filter((review) => review.visibility === filter);

  return (
    <AdminPage viewer={viewer} active="/admin/reviews" title="Reviews" subtitle={`Signed in as ${viewer.staff?.full_name}`}>
      <div className="tabs">
        <Link className={filter === 'all' ? 'is-active' : ''} href="/admin/reviews">All <span className="count">{all.length}</span></Link>
        <Link className={filter === 'shown' ? 'is-active' : ''} href="/admin/reviews?visibility=shown">On the store <span className="count">{all.filter((r) => r.visibility === 'shown').length}</span></Link>
        <Link className={filter === 'hidden' ? 'is-active' : ''} href="/admin/reviews?visibility=hidden">Hidden <span className="count">{all.filter((r) => r.visibility === 'hidden').length}</span></Link>
      </div>

      {rows.length ? (
        <div className="stack" data-testid="review-list">
          {rows.map((review) => (
            <article className="card" key={review.id} style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) 210px', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-4)' }}>
              <span className="media" style={{ width: 96, height: 96 }}>
                {review.products?.photos?.[0] ? <img src={`${review.products.photos[0]}?auto=format&fit=crop&w=300&q=70`} alt={review.products.name} /> : null}
              </span>
              <div>
                <div className="u-flex">
                  <Link href={`/admin/products/${review.products?.id}`}><strong>{review.products?.name}</strong></Link>
                  <Stars rating={review.rating} />
                  <span className="u-small u-muted">{review.rating} out of 5</span>
                </div>
                <p className="u-mb0">{review.review_text}</p>
                <p className="u-small u-muted u-mb0">
                  Written {new Date(review.written_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} by {review.shopper_name}
                </p>
              </div>
              <div className="u-end" style={{ justifyContent: 'flex-end' }}>
                <Badge tone={review.visibility === 'shown' ? 'ok' : 'off'}>{review.visibility === 'shown' ? 'On the store' : 'Hidden'}</Badge>
                <PostButton
                  action="/api/admin/reviews"
                  payload={{ id: review.id, visibility: review.visibility === 'shown' ? 'hidden' : 'shown' }}
                  size="sm"
                  testId={`review-${review.id}`}
                >
                  {review.visibility === 'shown' ? 'Take off the store' : 'Put back on the store'}
                </PostButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews here" action={<Button href="/admin/products" variant="default">Open Products</Button>}>
          <p>A review lands here the moment a signed-in shopper writes one on a product page.</p>
        </EmptyState>
      )}

      <Alert tone="soft" className="u-mt4" title="How reviews work">
        A review is shown on the product the moment it is written, with the stars, the date and the account that wrote it.
        Taking one off the store hides it straight away and you can put it back at any time.
      </Alert>
    </AdminPage>
  );
}
