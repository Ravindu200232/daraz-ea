'use client';

import { useState } from 'react';
import { Stepper, PostForm } from '@/components/ui/client.jsx';
import { Badge } from '@/components/ui/index.jsx';

/** The photo gallery: thumbnails switch the main photo, as the approved product page does. */
export function Gallery({ photos, name }) {
  const [index, setIndex] = useState(0);
  const shots = photos?.length ? photos : [];
  return (
    <section className="gallery" aria-label="Product photos">
      <div className="media media--square" style={{ position: 'relative' }}>
        {shots[index] && (
          <img src={`${shots[index]}?auto=format&fit=crop&w=900&q=75`} alt={`${name} — photo ${index + 1} of ${shots.length}`} />
        )}
        <button
          type="button"
          className="gallery__nav"
          aria-label="Previous photo"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.92)', cursor: 'pointer', zIndex: 3 }}
          onClick={() => setIndex((current) => (current - 1 + shots.length) % shots.length)}
        >
          ‹
        </button>
        <button
          type="button"
          className="gallery__nav"
          aria-label="Next photo"
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.92)', cursor: 'pointer', zIndex: 3 }}
          onClick={() => setIndex((current) => (current + 1) % shots.length)}
        >
          ›
        </button>
        <span className="media__cap">Photo {index + 1} of {shots.length}</span>
      </div>
      <div className="u-flex u-mt3" style={{ gap: 'var(--space-2)' }}>
        {shots.map((photo, position) => (
          <button
            key={photo}
            type="button"
            aria-label={`Show photo ${position + 1}`}
            onClick={() => setIndex(position)}
            style={{ width: 74, height: 74, padding: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', cursor: 'pointer', border: position === index ? '2px solid var(--color-primary)' : '2px solid var(--color-line)' }}
          >
            <img src={`${photo}?auto=format&fit=crop&w=200&q=60`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * Choosing a size and colour: every combination carries its own stock, a combination with no stock
 * is shown as out of stock and cannot be added, and the quantity cannot go past the stock left.
 */
export function BuyBox({ product, variants }) {
  const stocked = variants.filter((variant) => Number(variant.stock_count) > 0);
  const [chosen, setChosen] = useState(stocked[0] || variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))];
  const colours = [...new Set(variants.map((variant) => variant.colour).filter(Boolean))];
  const find = (size, colour) => variants.find((variant) => variant.size === size && variant.colour === colour);
  const outOfStock = variants.filter((variant) => Number(variant.stock_count) <= 0).map((variant) => `${variant.size} / ${variant.colour}`);
  const max = Math.max(1, Number(chosen?.stock_count || 0));

  return (
    <section aria-labelledby="pdp-title">
      <h1 id="pdp-title">{product.name}</h1>
      <p className="u-small u-muted">{product.categoryName} · DarazEA</p>

      <p className="price price--lg">
        {product.sale_price ? `Rs ${Number(product.sale_price).toLocaleString('en-LK')}` : `Rs ${Number(product.price).toLocaleString('en-LK')}`}
        {product.sale_price ? <span className="price__was">Rs {Number(product.price).toLocaleString('en-LK')}</span> : null}
        {product.sale_price ? <Badge tone="sale">{Math.round((1 - product.sale_price / product.price) * 100)}% off</Badge> : null}
      </p>
      <p className="u-small u-muted">Delivery fee is added at checkout once the area is chosen.</p>

      <h3 className="u-mt5">Size and colour</h3>
      <div className="stack" style={{ gap: 8 }} data-testid="variant-matrix">
        <div className="u-flex" style={{ gap: 8 }}>
          <span style={{ minWidth: 64 }} />
          {colours.map((colour) => <span key={colour} className="u-strong u-small">{colour}</span>)}
        </div>
        {sizes.map((size) => (
          <div className="u-flex" key={size} style={{ gap: 8 }}>
            <span className="u-strong u-small" style={{ minWidth: 64 }}>{size}</span>
            {colours.map((colour) => {
              const variant = find(size, colour);
              if (!variant) return <span key={`${size}-${colour}`} style={{ minWidth: 96 }} />;
              const available = Number(variant.stock_count) > 0;
              const isChosen = chosen?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  className={`vbtn${isChosen ? ' is-selected' : ''}`}
                  data-testid={`variant-${size}-${colour}`}
                  disabled={!available}
                  onClick={() => { setChosen(variant); setQuantity(1); }}
                  style={{
                    minWidth: 96, minHeight: 44, borderRadius: 'var(--radius-sm)', cursor: available ? 'pointer' : 'not-allowed',
                    border: isChosen ? '2px solid var(--color-primary)' : '2px solid var(--color-line-strong)',
                    background: isChosen ? 'var(--color-primary)' : available ? '#fff' : '#f1f5f7',
                    color: isChosen ? '#fff' : available ? 'var(--color-primary)' : '#8ba3ae',
                    fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'var(--fs-xs)',
                  }}
                >
                  {available ? `${variant.stock_count} left` : 'Out of stock'}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="u-small u-mt3">
        Chosen: <strong data-testid="chosen-variant">{chosen ? `${chosen.size} · ${chosen.colour}` : 'choose a size and colour'}</strong>{' '}
        {chosen && Number(chosen.stock_count) > 0
          ? <Badge tone="ok">In stock — {chosen.stock_count} left</Badge>
          : <Badge tone="off">Out of stock</Badge>}{' '}
        {outOfStock.length ? <Badge tone="off">{outOfStock.join(', ')} out of stock</Badge> : null}
      </p>

      <div className="field u-mt4">
        <span className="field__label">Quantity</span>
        <Stepper name="quantity" value={1} min={1} max={max} onChange={setQuantity} label={`Quantity, up to ${max}`} />
        <p className="hint">Only {max} left in {chosen ? `${chosen.size} · ${chosen.colour}` : 'this combination'}.</p>
      </div>

      <div className="u-flex u-mt3">
        <PostForm
          action="/api/cart"
          hidden={{ action: 'add', variantId: chosen?.id }}
          submitLabel="Add to cart"
          submitVariant="primary"
          testId="add-to-cart"
          footer={null}
        >
          <input type="hidden" name="quantity" value={quantity} />
          <button className="btn btn--primary" type="submit" disabled={!chosen || Number(chosen.stock_count) <= 0} data-testid="add-to-cart-submit">
            Add to cart
          </button>
        </PostForm>

        <PostForm action="/api/wishlist" hidden={{ action: 'add', productId: product.id }} footer={null}>
          <button className="btn btn--ghost" type="submit">Save to wishlist</button>
        </PostForm>
      </div>
    </section>
  );
}
