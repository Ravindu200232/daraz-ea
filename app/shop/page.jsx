import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Chip, Chips, Pager, ProductCard, Field, Input, Select } from '@/components/ui/index.jsx';
import { MenuToggle, SubmitOnChange } from '@/components/ui/client.jsx';
import { getCategories, getProducts } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';

const PER_PAGE = 12;

function parseMoney(value) {
  const amount = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export default async function CataloguePage({ searchParams }) {
  const params = await searchParams;
  const categories = await getCategories();
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  const chosenSlugs = [].concat(params.category || []).filter(Boolean);
  const chosenIds = chosenSlugs.map((slug) => bySlug.get(slug)?.id).filter(Boolean);
  const childIds = categories
    .filter((category) => chosenIds.includes(category.parent_category_id))
    .map((category) => category.id);
  const minPrice = parseMoney(params.min);
  const maxPrice = parseMoney(params.max);
  const inStockOnly = params.instock === '1';
  const sort = ['price-asc', 'price-desc', 'name'].includes(params.sort) ? params.sort : 'newest';
  const page = Math.max(1, Number(params.page) || 1);

  const { rows, total } = await getProducts({
    q: params.q || '',
    categoryIds: [...chosenIds, ...childIds],
    minPrice,
    maxPrice,
    inStockOnly,
    sort,
    page,
    perPage: PER_PAGE,
  });

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const byId = new Map(categories.map((category) => [category.id, category]));
  const hrefFor = (nextPage) => {
    const query = new URLSearchParams();
    chosenSlugs.forEach((slug) => query.append('category', slug));
    if (params.min) query.set('min', params.min);
    if (params.max) query.set('max', params.max);
    if (inStockOnly) query.set('instock', '1');
    if (sort !== 'newest') query.set('sort', sort);
    query.set('page', String(nextPage));
    return `/shop?${query.toString()}`;
  };

  const departments = categories.filter((category) => !category.parent_category_id);

  return (
    <StorefrontPage>
      <div className="container">
        <div className="page-head">
          <div>
            <p className="eyebrow">All products</p>
            <h1>Catalogue</h1>
            <p className="u-muted">Everything the store sells, ready to filter and sort.</p>
          </div>
          <MenuToggle target=".filter-rail" className="btn btn--ghost">Filters</MenuToggle>
        </div>

        <div className="layout">
          <aside className="filter-rail" aria-label="Filter the catalogue" style={{ background: '#fff', border: '1px solid var(--color-line)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
            <form method="get" action="/shop">
              <div className="rail__hd">
                <h2 className="u-mb0" style={{ fontSize: 'var(--fs-md)' }}>Filters</h2>
                <Link className="u-small" href="/shop">Clear all</Link>
              </div>

              <div className="rail__group">
                <h3>Department and category</h3>
                <div className="filter-list">
                  {departments.map((department) => (
                    <div key={department.id}>
                      <label className="check">
                        <input type="checkbox" name="category" value={department.slug} defaultChecked={chosenSlugs.includes(department.slug)} />
                        <span>{department.name}</span>
                        <span className="cnt">{categories.filter((category) => category.parent_category_id === department.id).length}</span>
                      </label>
                      {categories.filter((category) => category.parent_category_id === department.id).map((child) => (
                        <label className="check sub" key={child.id}>
                          <input type="checkbox" name="category" value={child.slug} defaultChecked={chosenSlugs.includes(child.slug)} />
                          <span>{child.name}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rail__group">
                <h3>Price (Rs)</h3>
                <div className="range-row">
                  <Field label="From" htmlFor="pmin">
                    <Input id="pmin" name="min" type="text" inputMode="numeric" defaultValue={params.min || ''} placeholder="1,000" />
                  </Field>
                  <Field label="To" htmlFor="pmax">
                    <Input id="pmax" name="max" type="text" inputMode="numeric" defaultValue={params.max || ''} placeholder="5,000" />
                  </Field>
                </div>
                <p className="hint">Prices shown in Sri Lankan Rupees.</p>
              </div>

              <div className="rail__group">
                <h3>Availability</h3>
                <label className="check">
                  <input type="checkbox" name="instock" value="1" defaultChecked={inStockOnly} />
                  <span>In stock only</span>
                </label>
                <p className="hint">Hides every size and colour with no stock left.</p>
              </div>

              <div className="u-flex u-mt4">
                <Button variant="primary" type="submit">Apply filters</Button>
                <Button href="/shop" variant="ghost">Clear all</Button>
              </div>
            </form>
          </aside>

          <section aria-labelledby="results-title">
            <h2 className="sr" id="results-title">Products</h2>
            <div className="toolbar">
              <div>
                <p className="u-small u-muted u-mb0">
                  <strong>{total ? `1–${rows.length}` : '0'}</strong> of {total} products
                  {inStockOnly ? ' · in stock only' : ''}
                </p>
                <Chips>
                  {chosenSlugs.map((slug) => (
                    <Chip key={slug} href="/shop">{bySlug.get(slug)?.name || slug} ×</Chip>
                  ))}
                  {(minPrice || maxPrice) && <Chip href="/shop">Rs {minPrice || 0} – Rs {maxPrice || 'any'} ×</Chip>}
                  {chosenSlugs.length || minPrice || maxPrice ? <Link className="u-small" href="/shop">Clear all filters</Link> : null}
                </Chips>
              </div>
              <form method="get" action="/shop" className="u-flex">
                {chosenSlugs.map((slug) => <input key={slug} type="hidden" name="category" value={slug} />)}
                {params.min && <input type="hidden" name="min" value={params.min} />}
                {params.max && <input type="hidden" name="max" value={params.max} />}
                {inStockOnly && <input type="hidden" name="instock" value="1" />}
                <Field label="Sort by" htmlFor="sortby" className="u-mb0">
                  <SubmitOnChange>
                    <Select id="sortby" name="sort" defaultValue={sort} data-testid="sort-select">
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                      <option value="name">Name, A to Z</option>
                    </Select>
                  </SubmitOnChange>
                </Field>
              </form>
            </div>

            {rows.length ? (
              <div className="pgrid" data-testid="product-grid">
                {rows.map((product) => (
                  <ProductCard key={product.id} product={product} href={`/product/${product.slug}`} categoryName={byId.get(product.category_id)?.name} />
                ))}
              </div>
            ) : (
              <div className="empty" data-testid="catalogue-empty">
                <h3>No products match these filters</h3>
                <p>Remove a filter or widen the price range to see more items.</p>
                <Button href="/shop" variant="primary">Clear all filters</Button>
              </div>
            )}

            <div className="u-between u-mt5">
              <span className="u-small u-muted">Page {page} of {pages}</span>
              <Pager page={page} pages={pages} hrefFor={hrefFor} />
            </div>
          </section>
        </div>
      </div>
    </StorefrontPage>
  );
}
