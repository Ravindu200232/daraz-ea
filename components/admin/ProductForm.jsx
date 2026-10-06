'use client';

import { useState } from 'react';
import { PostForm, SmartImage } from '@/components/ui/client.jsx';
import { Field, Input, Select, Textarea, Badge, Button } from '@/components/ui/index.jsx';

/**
 * The product form, used by New Product and Edit Product: details, photos, price and a sale price,
 * and one row per size or colour combination with its own stock count.
 */
export function ProductForm({ product, categories, variants = [] }) {
  const [rows, setRows] = useState(variants.map((variant) => ({ ...variant, key: variant.id || `${variant.size}-${variant.colour}` })));
  const [removed, setRemoved] = useState([]);
  const [photos, setPhotos] = useState(product?.photos || []);

  const update = (key, patch) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const addRow = () => setRows((current) => [...current, { key: `new-${Date.now()}`, size: '', colour: '', stock_count: 0 }]);
  const removeRow = (row) => {
    if (row.id) setRemoved((current) => [...current, row.id]);
    setRows((current) => current.filter((entry) => entry.key !== row.key));
  };

  return (
    <PostForm
      action="/api/admin/products"
      hidden={{
        id: product?.id,
        variants: rows.map((row) => ({ id: row.id, size: row.size, colour: row.colour, stock_count: row.stock_count })),
        removed_variant_ids: removed,
        photos,
      }}
      submitLabel="Save product"
      submitVariant="primary"
      testId="product-form"
      footer={null}
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">Name, category, description and photos</h2></div>
            <div className="card__bd">
              <div className="u-flex">
                {photos.map((photo, index) => (
                  <span key={photo} className="media" style={{ width: 96, height: 96 }}>
                    <SmartImage src={`${photo}?auto=format&fit=crop&w=400&q=70`} alt={`Product photo ${index + 1}`} />
                  </span>
                ))}
                <Button type="button" variant="ghost" onClick={() => setPhotos((current) => [...current, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b'])}>
                  + Add photo
                </Button>
              </div>
              <p className="hint">The first photo is the one shoppers see in the catalogue. JPG or PNG, up to 5 MB each.</p>

              <Field label="Product name" htmlFor="p-name" hint="As it should read in the catalogue and on the storefront." className="u-mt4">
                <Input id="p-name" name="name" defaultValue={product?.name || ''} required data-testid="product-name" />
              </Field>
              <Field label="Category" htmlFor="p-cat" hint="Departments and categories are kept in Categories.">
                <Select id="p-cat" name="category_id" defaultValue={product?.category_id || categories[0]?.id} data-testid="product-category">
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Field>
              <Field label="Description" htmlFor="p-desc" hint="Shoppers read this under the photos on the product page.">
                <Textarea id="p-desc" name="description" rows="4" defaultValue={product?.description || ''} />
              </Field>
            </div>
          </section>

          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">Price and sale price</h2></div>
            <div className="card__bd">
              <div className="field-row">
                <Field label="Price" htmlFor="p-price">
                  <div className="money"><span className="money__mark">Rs</span>
                    <input className="input" id="p-price" name="price" inputMode="decimal" defaultValue={product?.price ?? ''} required data-testid="product-price" />
                  </div>
                </Field>
                <Field label="Sale price" htmlFor="p-sale" hint="Leave this empty when the product is not on sale.">
                  <div className="money"><span className="money__mark">Rs</span>
                    <input className="input" id="p-sale" name="sale_price" inputMode="decimal" defaultValue={product?.sale_price ?? ''} data-testid="product-sale-price" />
                  </div>
                </Field>
              </div>
              <p className="u-small">Amounts are in Sri Lankan Rupees.</p>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">Show on the store</h2></div>
            <div className="card__bd">
              <label className="check check--card">
                <input type="radio" name="status" value="shown" defaultChecked={(product?.status || 'shown') === 'shown'} />
                <span><strong>Shown on the store</strong><span className="u-small u-muted" style={{ display: 'block' }}>Shoppers find it in the catalogue and can buy it.</span></span>
              </label>
              <label className="check check--card">
                <input type="radio" name="status" value="hidden" defaultChecked={product?.status === 'hidden'} />
                <span><strong>Hidden</strong><span className="u-small u-muted" style={{ display: 'block' }}>It stays in Products but shoppers never see it.</span></span>
              </label>
            </div>
          </section>

          <section className="card">
            <div className="card__hd"><h2 className="u-mb0">Size and colour combinations</h2><span className="u-small u-muted">Each carries its own stock count</span></div>
            <div className="card__bd">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Size</th><th>Colour</th><th>Stock count</th><th>Stock state</th><th /></tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key}>
                        <td><Input aria-label={`Size ${row.key}`} value={row.size} onChange={(event) => update(row.key, { size: event.target.value })} /></td>
                        <td><Input aria-label={`Colour ${row.key}`} value={row.colour} onChange={(event) => update(row.key, { colour: event.target.value })} /></td>
                        <td><Input type="number" min="0" aria-label={`Stock count ${row.key}`} value={row.stock_count} onChange={(event) => update(row.key, { stock_count: event.target.value })} /></td>
                        <td><Badge tone={Number(row.stock_count) > 0 ? 'ok' : 'off'}>{Number(row.stock_count) > 0 ? 'In stock' : 'Out of stock'}</Badge></td>
                        <td><Button type="button" variant="danger" size="sm" onClick={() => removeRow(row)}>Remove</Button></td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr><td colSpan="5" className="u-small u-muted">A product with no combinations shows as out of stock on the storefront and cannot be added to a cart.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="u-flex u-mt3">
                <Button type="button" variant="default" onClick={addRow} data-testid="add-combination">Add combination</Button>
                <span className="u-small u-muted">{rows.length} combinations, {rows.reduce((sum, row) => sum + Number(row.stock_count || 0), 0)} in stock.</span>
              </div>
            </div>
            <div className="card__ft">
              <button className="btn btn--primary" type="submit" data-testid="product-save">Save product</button>
            </div>
          </section>
        </div>
      </div>
    </PostForm>
  );
}
