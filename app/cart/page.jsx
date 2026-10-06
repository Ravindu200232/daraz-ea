import Link from 'next/link';
import { StorefrontPage, cartCountFor } from '@/components/shell/PageFrames.jsx';
import { Button, Card, Alert, EmptyState } from '@/components/ui/index.jsx';
import { PostForm, Stepper } from '@/components/ui/client.jsx';
import { getCartLines } from '@/lib/queries.js';
import { getViewer } from '@/lib/auth.js';
import { readGuestId } from '@/lib/guest.js';
import { cartSubtotal } from '@/lib/cart.js';
import { formatLKR } from '@/lib/money.js';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const viewer = await getViewer();
  const customerId = viewer.role === 'shopper' ? viewer.user.id : null;
  const guestId = customerId ? null : await readGuestId();
  const lines = await getCartLines({ customerId, guestId });
  const subtotal = cartSubtotal(lines);
  const pieces = lines.reduce((sum, line) => sum + line.quantity, 0);
  await cartCountFor(viewer, guestId);

  return (
    <StorefrontPage>
      <div className="container">
        <div className="progress-rail">
          <span className="now">Cart</span><span className="sep" aria-hidden="true">›</span>
          <span>Checkout</span><span className="sep" aria-hidden="true">›</span>
          <span>Order placed</span>
        </div>

        <div className="layout layout--aside">
          <section aria-labelledby="cart-title">
            <div className="page-head">
              <div>
                <h1 id="cart-title">Your cart</h1>
                <p className="u-muted">{lines.length} item{lines.length === 1 ? '' : 's'} held for you · {pieces} piece{pieces === 1 ? '' : 's'}.</p>
              </div>
            </div>

            {lines.length ? (
              <Card>
                {lines.map((line) => (
                  <article className="cart-line" key={line.id} data-testid="cart-line">
                    <span className="cart-line__media media">
                      {line.photo ? <img src={`${line.photo}?auto=format&fit=crop&w=300&q=70`} alt={line.product?.name} /> : null}
                    </span>
                    <div>
                      <h3 className="u-mb0"><Link href={`/product/${line.product?.slug}`}>{line.product?.name}</Link></h3>
                      <p className="u-small u-muted u-mb0">{line.variantLabel}</p>
                      <p className="u-small u-mb0">{formatLKR(line.unitPrice)} each</p>
                      {line.stockCount <= 3
                        ? <p className="u-mb0"><span className="badge badge--warn">{line.stockCount} left</span></p>
                        : <p className="hint">In stock</p>}
                      {line.quantity >= line.stockCount && (
                        <div className="alert alert--warn u-mt3">
                          <span className="alert__icon" aria-hidden="true">!</span>
                          <div><strong>Only {line.stockCount} left in {line.variantLabel}.</strong> Your quantity stayed at {line.stockCount} — more than that cannot be ordered.</div>
                        </div>
                      )}
                    </div>
                    <div className="cart-line__side">
                      <PostForm action="/api/cart" hidden={{ action: 'set', variantId: line.variantId }} footer={null} testId={`cart-quantity-${line.variantId}`}>
                        <Stepper
                          name="quantity"
                          value={line.quantity}
                          min={0}
                          max={Math.max(1, line.stockCount)}
                          label={`Quantity for ${line.product?.name}`}
                        />
                        <button className="btn btn--sm" type="submit">Update quantity</button>
                      </PostForm>
                      <p className="line-total u-mb0">{formatLKR(line.unitPrice * line.quantity)}</p>
                      <PostForm action="/api/cart" hidden={{ action: 'remove', variantId: line.variantId }} footer={null}>
                        <button className="btn btn--sm" type="submit" data-testid={`remove-${line.variantId}`}>Remove</button>
                      </PostForm>
                    </div>
                  </article>
                ))}
              </Card>
            ) : (
              <EmptyState
                title="Your cart is empty"
                action={<Button href="/shop" variant="primary">Browse the catalogue</Button>}
              >
                <p>Anything you add is held here until you check out.</p>
              </EmptyState>
            )}
          </section>

          <aside className="summary" aria-label="Items subtotal">
            <Card accent title="Items subtotal">
              <p className="u-small u-muted">{lines.length} item{lines.length === 1 ? '' : 's'} · {pieces} piece{pieces === 1 ? '' : 's'}, delivery not included</p>
              <p className="summary__big" data-testid="cart-subtotal">{formatLKR(subtotal)}</p>
              <p className="hint">Delivery is added at checkout once you choose your area or city.</p>
              {lines.length ? (
                <>
                  <Button href="/checkout" variant="primary" block className="u-mt3" data-testid="proceed-to-checkout">Proceed to checkout</Button>
                  <Button href="/shop" variant="ghost" block className="u-mt2">Continue shopping</Button>
                </>
              ) : (
                <>
                  <Alert tone="warn" title="You cannot check out yet.">Your cart is empty — add a product and it will be ready to go.</Alert>
                  <Button variant="default" block className="u-mt3" disabled>Proceed to checkout</Button>
                  <Button href="/shop" variant="ghost" block className="u-mt2">Continue shopping</Button>
                </>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </StorefrontPage>
  );
}
