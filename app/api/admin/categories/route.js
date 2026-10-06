import { fail, ok, readJson, requireManagement } from '@/lib/api.js';
import { supabaseAdmin } from '@/lib/supabase.js';

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Keeping the departments shoppers browse by in order, including what sits inside what. */
export async function POST(request) {
  const body = await readJson(request);
  const { error } = await requireManagement();
  if (error) return error;
  const admin = supabaseAdmin();
  const action = String(body.action || 'save');

  if (action === 'delete') {
    const { count } = await admin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', body.id);
    if (count) return fail(409, `${count} product${count === 1 ? '' : 's'} still use that category — move them first.`);
    const { error: deleteError } = await admin.from('categories').delete().eq('id', body.id);
    if (deleteError) return fail(409, deleteError.message);
    return ok({ message: 'That category came off the storefront list.' });
  }

  const name = String(body.name || '').trim();
  if (!name) return fail(422, 'Enter the category name.', { field: 'name' });
  const row = {
    name,
    slug: body.slug || slugify(name),
    description: String(body.description || '').trim() || null,
    image_url: String(body.image_url || '').trim() || null,
    parent_category_id: body.parent_category_id || null,
  };

  if (body.id) {
    const { error: updateError } = await admin.from('categories').update(row).eq('id', body.id);
    if (updateError) return fail(500, updateError.message);
    return ok({ message: `${name} is saved.` });
  }

  const { error: insertError } = await admin.from('categories').insert(row);
  if (insertError) return fail(409, insertError.message);
  return ok({ message: `${name} is saved${row.parent_category_id ? ' and now sits inside its parent category' : ''}.` });
}
