import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, ProductCard, Field, Select } from '@/components/ui/index.jsx';
import { SubmitOnChange } from '@/components/ui/client.jsx';
import { getCategories, getProducts } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';

const PER_PAGE = 8;

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const q = String(params.q || 'kurta').trim();
  const sort = ['price-asc', 'price-desc'].includes(params.sort) ? params.sort : 'newest';
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total }, categories] = await Promise.all([
    getProducts({ q, sort, page, perPage: PER_PAGE }),
    getCategories(),
  ]);
  const byId = new Map(categories.map((category) => [category.id, category]));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <StorefrontPage>
      <div className="container">

        <section className="search-head" aria-labelledby="sr-title" style={{ display: 'grid', gap: 'var(--space-5)', background: 'linear-gradient(135deg,var(--color-surface-2),var(--color-surface))', border: '1px solid var(--color-line)', borderRadius: 'var(--radius)', padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <div>
            <p className="eyebrow">Search results for</p>
            <h1 id="sr-title" style={{ marginBottom: 0 }}>“{q}”</h1>
            <p className="u-muted u-mb0">{total} product{total === 1 ? '' : 's'} match your keyword.</p>
          </div>
          <form action="/search" role="search" style={{ maxWidth: 460 }}>
            <label className="field__label" htmlFor="kw-again">Search again</label>
            <div className="search">
              <input className="search__input" id="kw-again" name="q" type="search" defaultValue={q} />
              <button className="search__btn" type="submit">Search</button>
            </div>
            <p className="hint">Keeps the current keyword; submitting replaces the results below.</p>
          </form>
        </section>

        <div className="toolbar">
          <p className="u-small u-muted u-mb0" data-testid="search-count">
            <strong>{total} products</strong> match “{q}”
          </p>
          <form method="get" action="/search" className="u-flex">
            <input type="hidden" name="q" value={q} />
            <Field label="Sort" htmlFor="sort-search" className="u-mb0">
              <SubmitOnChange>
                <Select id="sort-search" name="sort" defaultValue={sort}>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </Select>
              </SubmitOnChange>
            </Field>
          </form>
        </div>

        {rows.length ? (
          <div className="pgrid" data-testid="search-grid">
            {rows.map((product) => (
              <ProductCard key={product.id} product={product} href={`/product/${product.slug}`} categoryName={byId.get(product.category_id)?.name} />
            ))}
          </div>
        ) : (
          <div className="empty" data-testid="search-empty">
            <h3>Nothing matched “{q}” with these filters</h3>
            <p>Check the spelling, try a shorter keyword, or look through a department.</p>
            <p className="u-small">
              Try instead: <Link href="/search?q=kurti">kurti</Link> · <Link href="/search?q=cotton%20kurta">cotton kurta</Link> ·{' '}
              <Link href="/search?q=kurta%20set">kurta set</Link> · <Link href="/search?q=saree">saree</Link>
            </p>
            <Button href="/shop" variant="primary">Browse the catalogue</Button>
          </div>
        )}

        <div className="u-between u-mt5">
          <p className="u-small u-muted u-mb0">Showing {rows.length ? `1–${rows.length}` : 0} of {total} products</p>
          <Button href={`/shop`} variant="ghost" size="sm">See the whole catalogue</Button>
        </div>
      </div>
    </StorefrontPage>
  );
}
