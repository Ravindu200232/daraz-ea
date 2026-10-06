import Link from 'next/link';
import { StorefrontPage } from '@/components/shell/PageFrames.jsx';
import { Button, ProductCard, Card, Badge, Stars } from '@/components/ui/index.jsx';
import { getFeaturedProducts, getCategories, getDepartments } from '@/lib/queries.js';
import { categoryImage, P } from '@/lib/images.js';

export const dynamic = 'force-dynamic';

const TRUST = [
  ['🚚', 'Delivery charged by area', 'One fixed fee per city or area, added at checkout before you pay.'],
  ['💳', 'Card or cash on delivery', 'Pay on the gateway with Visa or Mastercard, or hand the money to the courier.'],
  ['✉️', 'An email at every stage', 'Placed, confirmed, shipped, delivered — you always know where your parcel is.'],
];

const DEPARTMENT_CARDS = [
  { slug: 'womens-clothing', label: 'Womenswear', products: '96 products', image: P.P9 },
  { slug: 'mens-clothing', label: 'Menswear', products: '121 products', image: P.P10 },
  { slug: 'footwear', label: 'Footwear', products: '58 products', image: P.P11 },
  { slug: 'home-kitchen', label: 'Home & Living', products: '128 products', image: P.P12 },
];

export default async function HomePage() {
  const [featured, departments, categories] = await Promise.all([
    getFeaturedProducts(8),
    getDepartments(),
    getCategories(),
  ]);
  const byId = new Map(categories.map((category) => [category.id, category]));
  const departmentNames = new Set(departments.map((department) => department.name));

  return (
    <StorefrontPage>
      <div className="container">

        <section className="reveal" aria-labelledby="hero-title" style={{
          position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          background: 'linear-gradient(135deg,var(--color-primary),var(--color-secondary) 58%,#0aa1c9)',
          color: '#fff', padding: 'var(--space-7) var(--space-6)', boxShadow: 'var(--shadow-lg)',
        }}>
          <div className="grid grid--2" style={{ position: 'relative', zIndex: 2, alignItems: 'center', gap: 'var(--space-6)' }}>
            <div>
              <p className="eyebrow" style={{ color: 'var(--color-accent)' }}>Handloom · Home &amp; Living · Ceylon produce</p>
              <h1 id="hero-title" style={{ color: '#fff', fontSize: 'var(--fs-3xl)', marginBottom: 'var(--space-3)' }}>
                Everything you love, delivered across Sri Lanka
              </h1>
              <p style={{ color: '#d8eef8', maxWidth: '52ch' }}>
                Handloom clothing, footwear and homeware picked by our own team — delivered to your door with a
                fixed delivery fee for your area, and an email at every stage of the order.
              </p>
              <div className="u-flex u-mt4">
                <Button href="/shop" variant="primary" style={{ background: '#fff', borderColor: '#fff', color: 'var(--color-primary)' }}>Shop the catalogue</Button>
                <Button href="/track" variant="ghost" style={{ borderColor: 'rgba(255,255,255,.6)', color: '#fff' }}>Track an order</Button>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
              <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-md)', display: 'block', color: '#fff' }}>Welcome offer for new shoppers</strong>
              <p className="u-small" style={{ margin: '6px 0 0', color: '#e6f6fc' }}>10% off your first order over LKR 3,000, applied at checkout.</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '.16em', padding: '8px 16px', borderRadius: 'var(--radius-pill)', marginTop: 'var(--space-2)' }}>WELCOME10</span>
              <p className="u-xs" style={{ margin: '10px 0 0', color: '#d6edf7' }}>Expires 30 June 2026 · one code per order</p>
            </div>
          </div>
        </section>

        <section className="section reveal grid grid--3" aria-label="Why shoppers shop with us">
          {TRUST.map(([icon, title, body]) => (
            <Card key={title}>
              <span style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--color-surface)', fontSize: 20 }} aria-hidden="true">{icon}</span>
              <h3 className="u-mt3 u-mb0">{title}</h3>
              <p className="u-small u-muted u-mb0">{body}</p>
            </Card>
          ))}
        </section>

        <section className="section" aria-labelledby="featured-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Picked by our buyers</p>
              <h2 id="featured-title">Featured this week</h2>
            </div>
            <Button href="/shop" variant="ghost">View all products</Button>
          </div>
          {featured.length ? (
            <div className="pgrid" data-testid="featured-grid">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={`/product/${product.slug}`}
                  categoryName={byId.get(product.category_id)?.name || (departmentNames.has(byId.get(product.category_id)?.name) ? null : '')}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>No featured products yet</h3>
              <p>The products worth pushing today will appear here.</p>
              <Button href="/shop" variant="primary">Browse the catalogue</Button>
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="depts-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Browse the store</p>
              <h2 id="depts-title">Shop by department</h2>
            </div>
            <Button href="/shop" variant="ghost">All departments</Button>
          </div>
          <div className="grid grid--4">
            {DEPARTMENT_CARDS.map((card) => (
              <Link
                key={card.slug}
                href={`/shop?category=${card.slug}`}
                className="pcard"
                style={{ aspectRatio: '16/10', justifyContent: 'flex-end', background: 'var(--color-primary)', color: '#fff' }}
              >
                <img src={`${card.image}?auto=format&fit=crop&w=700&q=70`} alt={card.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .55 }} />
                <span style={{ position: 'relative', padding: 'var(--space-4)', background: 'linear-gradient(180deg,transparent,rgba(0,32,47,.82))', width: '100%' }}>
                  <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-md)', display: 'block' }}>{card.label}</strong>
                  <span className="u-small">{card.products}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <Card accent title="Not sure where your parcel is?">
            <div className="u-between">
              <p className="u-muted u-mb0 u-small">Enter your order number and the phone number you gave at checkout.</p>
              <Button href="/track" variant="primary">Track an order</Button>
            </div>
          </Card>
        </section>

        <section className="section grid grid--3" aria-label="Why shoppers come back">
          <Card title="Reviews from real orders">
            <p className="u-small u-muted">Ratings and reviews are kept with the account that wrote them, and appear on the product straight away.</p>
            <div className="u-flex"><Stars rating={5} /><span className="u-small u-muted">4.6 average across the catalogue</span></div>
          </Card>
          <Card title="Returns handled by people">
            <p className="u-small u-muted">Ask to send an item back from a delivered order; the store team reads every request and answers it.</p>
            <Badge tone="accent">One request per item</Badge>
          </Card>
          <Card title="A discount when it fits your order">
            <p className="u-small u-muted">Codes take a percentage or a fixed amount off, above a minimum order value, until they expire.</p>
            <Button href="/shop" size="sm" variant="ghost">Find something to buy</Button>
          </Card>
        </section>

      </div>
    </StorefrontPage>
  );
}
