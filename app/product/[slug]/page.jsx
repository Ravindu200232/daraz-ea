import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Stars, Badge } from '@/components/ui/index.jsx';
import { Gallery, BuyBox } from '@/components/product/BuyBox.jsx';
import { getProductBySlug, getCategories } from '@/lib/queries.js';
import { round2 } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data?.product || data.product.status !== 'shown') notFound();

  const categories = await getCategories();
  const category = categories.find((row) => row.id === data.product.category_id);
  const parent = categories.find((row) => row.id === category?.parent_category_id);
  const reviews = data.reviews || [];

  return (
    <StorefrontPage>
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/shop">Catalogue</Link> <span aria-hidden="true">/</span>
          {parent && <><Link href={`/shop?category=${parent.slug}`}>{parent.name}</Link> <span aria-hidden="true">/</span></>}
          <Link href={`/shop?category=${category?.slug || ''}`}>{category?.name || 'Products'}</Link>
        </nav>

        <div className="grid grid--2" style={{ alignItems: 'start', gap: 'var(--space-6)' }}>
          <Gallery photos={data.product.photos || []} name={data.product.name} />
          <BuyBox
            product={{ ...data.product, categoryName: category?.name }}
            variants={data.variants}
          />
        </div>

        <section className="section">
          <Card title="Description">
            <p>{data.product.description}</p>
          </Card>
        </section>

        <section className="section" aria-labelledby="reviews-title">
          <div className="section-head">
            <h2 id="reviews-title">Ratings and reviews</h2>
            <Button href={`/product/${data.product.slug}/review`} variant="primary">Write a review</Button>
          </div>

          <div className="grid grid--2" style={{ alignItems: 'start' }}>
            <Card title="Overall rating">
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 48, color: 'var(--color-primary)', lineHeight: 1, margin: 0 }} data-testid="rating-average">
                {data.rating.count ? data.rating.average : '—'}
              </p>
              <p className="u-small u-muted">out of 5 · {data.rating.count} review{data.rating.count === 1 ? '' : 's'}</p>
              <div className="stack" style={{ gap: 6 }}>
                {data.rating.bars.map((bar) => (
                  <div className="u-flex" key={bar.star} style={{ gap: 10 }}>
                    <span className="u-small u-muted">{bar.star}</span>
                    <span style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--color-line)', overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${bar.percent}%`, background: '#e0a800' }} />
                    </span>
                    <span className="u-small u-muted">{bar.count}</span>
                  </div>
                ))}
              </div>
              <p className="hint">Reviews appear on the store as soon as they are written.</p>
            </Card>

            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }} data-testid="review-list">
              {reviews.length ? reviews.map((review) => (
                <li key={review.id} className="card">
                  <div className="card__bd">
                    <div className="u-flex">
                      <strong>{review.shopper_name}</strong>
                      <Stars rating={review.rating} />
                      <span className="u-small u-muted">Written {new Date(review.written_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <p className="u-mb0">{review.review_text}</p>
                  </div>
                </li>
              )) : (
                <li className="empty">
                  <h3>No reviews yet</h3>
                  <p>Be the first to say what you think of it.</p>
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="section grid grid--3">
          <Card title="Stock, combination by combination">
            <p className="u-small u-muted">Every size and colour carries its own count. {data.variants.filter((variant) => Number(variant.stock_count) > 0).length} of {data.variants.length} combinations are in stock right now.</p>
          </Card>
          <Card title="Returns">
            <p className="u-small u-muted">Ask to send an item back from a delivered order — any refund is handled outside the store.</p>
            <Badge tone="accent">One request per item</Badge>
          </Card>
          <Card title="Delivery">
            <p className="u-small u-muted">The fixed fee for your area is added at checkout, and an email follows at every stage of the order.</p>
            <Button href="/cart" variant="ghost" size="sm">Go to your cart</Button>
          </Card>
        </section>
      </div>
    </StorefrontPage>
  );
}
