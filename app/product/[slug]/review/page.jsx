import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Alert, Badge, Stars, Field, Textarea } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { getViewer } from '@/lib/auth.js';
import { getProductBySlug } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

const RATINGS = [
  [1, 'Poor'], [2, 'Fair'], [3, 'OK'], [4, 'Good'], [5, 'Excellent'],
];

export default async function WriteReviewPage({ params }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data?.product || data.product.status !== 'shown') notFound();
  const viewer = await getViewer();
  const product = data.product;
  const inStock = data.variants.filter((variant) => Number(variant.stock_count) > 0).length;

  return (
    <StorefrontPage account>
      <div className="container">
        <Link className="u-small" href={`/product/${product.slug}`}>← Back to {product.name}</Link>
        <h1 className="u-mt3">Write a review</h1>

        {viewer.role !== 'shopper' ? (
          <div className="layout layout--aside u-mt4">
            <Card title="Signed out">
              <Alert tone="warn" title="Sign in to write a review.">
                A rating and a review are kept with the account that wrote them.
              </Alert>
              <div className="u-flex u-mt3">
                <Button href="/login" variant="primary">Sign in</Button>
                <Button href="/register" variant="ghost">Create an account</Button>
              </div>
            </Card>
            <aside />
          </div>
        ) : (
          <div className="layout layout--aside u-mt4">
            <Card title="Your review">
              <p className="u-small u-muted">Posting as <strong>{viewer.customer?.full_name}</strong> · your review appears on the product as soon as you submit it.</p>

              <PostForm action="/api/reviews" hidden={{ slug: product.slug }} submitLabel="Submit review" submitVariant="primary" testId="review-form" footer={null}>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }} data-testid="rating-group">
                  <legend className="subhead">Your rating</legend>
                  <div className="u-flex">
                    {RATINGS.map(([value, label]) => (
                      <label className="check" key={value} style={{ border: '2px solid var(--color-line)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                        <input type="radio" name="rating" value={value} defaultChecked={value === 4} aria-label={`Rate ${value} out of 5, ${label}`} />
                        <span><strong>{value}</strong> {label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="hint">A whole number of stars from 1 to 5.</p>
                </fieldset>

                <Field label="Your review" htmlFor="reviewtext" hint="Say what you think of it — the fit, the material, how it arrived.">
                  <Textarea id="reviewtext" name="review_text" rows="6" required data-testid="review-text" />
                </Field>

                <p className="u-small u-muted">Your name, the stars and the date you submit are saved with this review. Staff can take a review off the product and put it back.</p>

                <div className="u-flex u-mt3">
                  <button className="btn btn--primary" type="submit" data-testid="review-submit">Submit review</button>
                  <Button href={`/product/${product.slug}`} variant="ghost">Cancel</Button>
                </div>
              </PostForm>
            </Card>

            <aside className="stack">
              <Card title="The product you are reviewing">
                <span className="media media--4x3">
                  {product.photos?.[0] ? <img src={`${product.photos[0]}?auto=format&fit=crop&w=600&q=70`} alt={product.name} /> : null}
                </span>
                <h3 className="u-mt3 u-mb0">{product.name}</h3>
                <p className="u-small u-muted">{data.category?.name}</p>
                <p className="price">{formatRs(product.sale_price ?? product.price)}{product.sale_price ? <span className="price__was">{formatRs(product.price)}</span> : null}</p>
                <p className="u-small u-muted u-mb0">{inStock} of {data.variants.length} combinations in stock</p>
                <p className="u-mt3"><Button href={`/product/${product.slug}`} variant="default">View the product</Button></p>
              </Card>

              <Card title="What other shoppers said">
                <p className="u-flex"><Stars rating={data.rating.average} /> <span className="u-small u-muted">{data.rating.count} review{data.rating.count === 1 ? '' : 's'}</span></p>
                <p className="u-small u-muted u-mb0">Reviews are shown on the product the moment they are written, with the stars, the date and the account that wrote them.</p>
                <Badge tone="accent">Appears straight away</Badge>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </StorefrontPage>
  );
}
