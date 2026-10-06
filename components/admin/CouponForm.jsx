'use client';

import { useState } from 'react';
import { PostForm } from '@/components/ui/client.jsx';
import { Field, Input, Select, Textarea, Badge } from '@/components/ui/index.jsx';

/** Building a discount code: type and value, limits, and what it covers. */
export function CouponForm({ coupon, categories = [] }) {
  const [appliesTo, setAppliesTo] = useState(coupon?.applies_to || 'all');
  return (
    <PostForm
      action="/api/admin/coupons"
      hidden={{ id: coupon?.id, applies_to: appliesTo }}
      submitLabel={coupon ? 'Save changes' : 'Save coupon'}
      submitVariant="primary"
      testId="coupon-form"
      footer={null}
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">Code and discount</h2></div>
            <div className="card__bd">
              <Field label="Coupon code" htmlFor="code" hint="Shoppers type this at Checkout. No two coupons can share a code.">
                <Input id="code" name="code" defaultValue={coupon?.code || ''} required data-testid="coupon-code" />
              </Field>
              <div className="field-row">
                <Field label="Discount type" htmlFor="dtype">
                  <Select id="dtype" name="discount_type" defaultValue={coupon?.discount_type || 'percentage'} data-testid="coupon-type">
                    <option value="percentage">Percentage off the order</option>
                    <option value="fixed">Fixed amount off the order</option>
                  </Select>
                </Field>
                <Field label="Discount value" htmlFor="dval" hint="10 means 10% off the items subtotal.">
                  <Input id="dval" name="discount_value" defaultValue={coupon?.discount_value ?? '10'} required data-testid="coupon-value" />
                </Field>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">Rules</h2></div>
            <div className="card__bd">
              <div className="field-row">
                <Field label="Minimum order value (Rs)" htmlFor="min" hint="Below this items subtotal the code is refused at checkout.">
                  <Input id="min" name="minimum_order_value" defaultValue={coupon?.minimum_order_value ?? '0'} data-testid="coupon-minimum" />
                </Field>
                <Field label="Expiry date" htmlFor="exp" hint="After this date the code stops working.">
                  <Input id="exp" name="expires_at" type="date" defaultValue={coupon?.expires_at || ''} />
                </Field>
              </div>
              <Field label="Maximum number of uses" htmlFor="max" hint="Leave this empty for no limit.">
                <Input id="max" name="max_uses" defaultValue={coupon?.max_uses ?? ''} data-testid="coupon-max-uses" />
              </Field>
              {coupon && <p className="hint">Currently {coupon.max_uses ?? 'no limit'} allowed, {coupon.used_count} used.</p>}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">What it covers</h2></div>
            <div className="card__bd">
              <label className="check check--card">
                <input type="radio" name="applies_pick" checked={appliesTo === 'all'} onChange={() => setAppliesTo('all')} />
                <span><strong>All products</strong><span className="u-small u-muted" style={{ display: 'block' }}>The discount comes off whatever is in the cart.</span></span>
              </label>
              <label className="check check--card">
                <input type="radio" name="applies_pick" checked={appliesTo === 'products'} onChange={() => setAppliesTo('products')} />
                <span><strong>Chosen products</strong><span className="u-small u-muted" style={{ display: 'block' }}>A cart holding none of them is refused, with no discount.</span></span>
              </label>
              <label className="check check--card">
                <input type="radio" name="applies_pick" checked={appliesTo === 'categories'} onChange={() => setAppliesTo('categories')} />
                <span><strong>Chosen categories</strong><span className="u-small u-muted" style={{ display: 'block' }}>Tick a department or a category inside one.</span></span>
              </label>

              {appliesTo === 'categories' && (
                <div className="u-mt3">
                  <p className="subhead">Categories <Badge tone="accent">{(coupon?.applies_to_categories || []).length} ticked</Badge></p>
                  {categories.map((category) => (
                    <label className="check" key={category.id}>
                      <input
                        type="checkbox"
                        name="applies_to_categories"
                        value={category.id}
                        defaultChecked={(coupon?.applies_to_categories || []).includes(category.id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                  <p className="hint">A ticked department covers every category inside it.</p>
                </div>
              )}

              <label className="check u-mt3">
                <input type="checkbox" name="is_active" value="1" defaultChecked={coupon ? coupon.is_active : true} />
                <span>Coupon is active — shoppers can use the code at Checkout as soon as it is saved.</span>
              </label>
            </div>
            <div className="card__ft">
              <button className="btn btn--primary" type="submit" data-testid="coupon-save">{coupon ? 'Save changes' : 'Save coupon'}</button>
            </div>
          </section>
        </div>
      </div>
    </PostForm>
  );
}
