import { fail, ok, readJson, requireManagement } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { parseMoney } from '@/lib/money.js';

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function readPhotos(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '').split(/[\s,]+/).map((line) => line.trim()).filter(Boolean);
}

/** Creating and editing a product with its own per-size/colour stock. */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireManagement();
  if (error) return error;

  const action = String(body.action || 'save');
  const admin = supabaseAdmin();

  if (action === 'visibility') {
    const status = body.status === 'hidden' ? 'hidden' : 'shown';
    await admin.from('products').update({ status, updated_at: new Date().toISOString() }).eq('id', body.id);
    return ok({ message: status === 'hidden' ? 'That product is hidden from the store.' : 'That product is shown on the store again.' });
  }

  const name = String(body.name || '').trim();
  if (!name) return fail(422, 'Enter the product name.', { field: 'name' });
  const price = parseMoney(body.price);
  const salePrice = String(body.sale_price || '').trim() ? parseMoney(body.sale_price) : null;
  if (!(price > 0)) return fail(422, 'Enter a price above zero.', { field: 'price' });
  if (salePrice !== null && salePrice >= price) {
    return fail(422, 'The sale price has to be below the usual price.', { field: 'sale_price' });
  }
  if (!body.category_id) return fail(422, 'Choose the category this product belongs to.', { field: 'category_id' });

  const row = {
    name,
    category_id: body.category_id,
    description: String(body.description || '').trim() || null,
    photos: readPhotos(body.photos),
    price,
    sale_price: salePrice,
    status: body.status === 'hidden' ? 'hidden' : 'shown',
    updated_at: new Date().toISOString(),
  };

  let productId = body.id;
  if (body.id) {
    const { error: updateError } = await admin.from('products').update(row).eq('id', body.id);
    if (updateError) return fail(500, updateError.message);
  } else {
    const slug = slugify(name);
    const { data: clash } = await admin.from('products').select('id').eq('slug', slug).maybeSingle();
    const { data: created, error: insertError } = await admin
      .from('products')
      .insert({ ...row, slug: clash ? `${slug}-${Date.now().toString().slice(-4)}` : slug })
      .select()
      .single();
    if (insertError) return fail(500, insertError.message);
    productId = created.id;
  }

  const variants = Array.isArray(body.variants) ? body.variants : [];
  for (const variant of variants) {
    const size = String(variant.size || '').trim() || null;
    const colour = String(variant.colour || '').trim() || null;
    const stock = Math.max(0, Number(variant.stock_count) || 0);
    if (variant.id) {
      await admin.from('product_variants').update({ size, colour, stock_count: stock }).eq('id', variant.id).eq('product_id', productId);
    } else {
      await admin.from('product_variants').upsert(
        { product_id: productId, size, colour, stock_count: stock },
        { onConflict: 'product_id,size,colour' },
      );
    }
  }

  for (const removed of Array.isArray(body.removed_variant_ids) ? body.removed_variant_ids : []) {
    await admin.from('product_variants').delete().eq('id', removed).eq('product_id', productId);
  }

  return ok({
    message: `${name} is saved. It is ${row.status === 'hidden' ? 'hidden from' : 'shown on'} the store.`,
    productId,
    redirect: `/admin/products/${productId}`,
    staff: viewer.role,
  });
}
