import { fail, ok, readJson, requireManagement } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';

/** Taking a review off the store, or putting it back. */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireManagement();
  if (error) return error;

  const visibility = String(body.visibility || '');
  if (!['shown', 'hidden'].includes(visibility)) {
    return fail(422, 'Choose whether the review is on the store or hidden.', { field: 'visibility' });
  }

  const admin = supabaseAdmin();
  const { data: review } = await admin.from('reviews').select('id, shopper_name').eq('id', body.id).maybeSingle();
  if (!review) return fail(404, 'That review is not on the list.');

  await admin.from('reviews').update({ visibility }).eq('id', review.id);
  return ok({
    message: visibility === 'hidden'
      ? 'Review taken off the store — it stopped showing on the product page, and you can put it back at any time.'
      : 'The review is back on the store.',
  });
}
