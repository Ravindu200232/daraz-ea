import { fail, ok, readJson, requireShopper } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { validateReview } from '@/lib/reviews.js';

/**
 * A review appears on the product as soon as it is written; Staff can take it off the store and
 * put it back. Only a signed-in shopper may write one.
 */
export async function POST(request) {
  const body = await readJson(request);
  const { viewer, error } = await requireShopper();
  if (error) return error;

  const checked = validateReview({ rating: body.rating, text: body.review_text });
  if (!checked.ok) return fail(422, checked.message, { field: checked.reason });

  const admin = supabaseAdmin();
  const { data: product } = await admin
    .from('products')
    .select('id, slug')
    .eq('slug', body.slug)
    .maybeSingle();
  if (!product) return fail(404, 'That product is no longer on the store.');

  const { error: insertError } = await admin.from('reviews').insert({
    product_id: product.id,
    customer_id: viewer.user.id,
    shopper_name: viewer.customer?.full_name || 'DarazEA shopper',
    rating: checked.rating,
    review_text: checked.review_text,
    visibility: 'shown',
  });
  if (insertError) return fail(500, insertError.message);

  return ok({ message: 'Thank you — your review is on the product now.', redirect: `/product/${product.slug}` });
}
