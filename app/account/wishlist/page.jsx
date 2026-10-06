import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, EmptyState, Badge, Select } from '@/components/ui/index.jsx';
import { PostForm, PostButton } from '@/components/ui/client.jsx';
import { requireShopper } from '@/lib/auth.js';
import { getWishlist, getVariants } from '@/lib/queries.js';
import { formatRs } from '@/lib/money.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wishlist — DarazEA' };

export default async function WishlistPage() {
  const viewer = await requireShopper('/account/wishlist');
  const items = await getWishlist(viewer.user.id);
  const variants = await getVariants(items.map((item) => item.product_id));
  const inStockCount = (productId) => variants.filter((variant) => variant.product_id === productId && Number(variant.stock_count) > 0).length;

  return (
    <StorefrontPage account>
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Wishlist</h1>
            <p className="u-muted">Saved for later, in the order you added them.</p>
          </div>
        </div>

        <div className="u-between u-mb3">
          <strong>{items.length} product{items.length === 1 ? '' : 's'} saved</strong>
          <span className="u-small u-muted">Choose a size or colour to move anything into the cart.</span>
        </div>

        {items.length ? (
          <div className="stack" data-testid="wishlist-list">
            {items.map((item) => {
              const product = item.products;
              const mine = variants.filter((variant) => variant.product_id === product.id && Number(variant.stock_count) > 0);
              return (
                <article className="card" key={item.id} style={{ display: 'grid', gridTemplateColumns: '84px minmax(0,1fr) 200px 240px', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-4)' }}>
                  <span className="media" style={{ width: 84, height: 84 }}>
                    {product.photos?.[0] ? <img src={`${product.photos[0]}?auto=format&fit=crop&w=240&q=70`} alt={product.name} /> : null}
                  </span>
                  <div>
                    <Link className="u-strong" href={`/product/${product.slug}`}>{product.name}</Link>
                    <p className="u-mb0"><Badge tone={mine.length ? 'default' : 'off'}>{mine.length ? `In stock in ${mine.length} combination${mine.length === 1 ? '' : 's'}` : 'Out of stock'}</Badge></p>
                  </div>
                  <div>
                    <div className="u-strong">{formatRs(product.sale_price ?? product.price)}</div>
                    {product.sale_price && <div className="u-small u-muted"><s>{formatRs(product.price)}</s></div>}
                    <div className="u-small u-muted">Saved {new Date(item.added_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div className="u-end">
                    {mine.length ? (
                      <PostForm action="/api/wishlist" hidden={{ action: 'move', productId: product.id }} submitLabel="Move to cart" submitVariant="primary" testId={`move-${product.slug}`} footer={null}>
                        <Select name="variantId" aria-label={`Size and colour for ${product.name}`} style={{ maxWidth: 190 }}>
                          {mine.map((variant) => (
                            <option key={variant.id} value={variant.id}>{variant.size} · {variant.colour} — {variant.stock_count} left</option>
                          ))}
                        </Select>
                        <button className="btn btn--primary btn--sm" type="submit">Move to cart</button>
                      </PostForm>
                    ) : (
                      <Button variant="primary" size="sm" disabled>Move to cart</Button>
                    )}
                    <PostButton action="/api/wishlist" payload={{ action: 'remove', productId: product.id }} size="sm" data-testid={`remove-${product.slug}`}>
                      Remove
                    </PostButton>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Your wishlist is empty" action={<><Button href="/shop" variant="primary">Browse the catalogue</Button> <Button href="/search" variant="ghost">Search for a product</Button></>}>
            <p>Save a product from any product page, and it waits for you here until you are ready to buy it.</p>
          </EmptyState>
        )}

        <section className="section">
          <Card title="How the wishlist works">
            <p className="u-small u-muted">A saved product is listed by the date you first added it, and the same product cannot be saved twice. Moving a saved product into your cart takes it off the wishlist.</p>
          </Card>
        </section>
      </div>
    </StorefrontPage>
  );
}
