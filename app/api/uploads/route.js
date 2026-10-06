import { fail, ok } from '@/lib/api.js';
import { getViewer } from '@/lib/auth.js';
import { supabaseAdmin } from '@/lib/supabase.js';
import { randomUUID } from 'node:crypto';

const BUCKETS = {
  'product-photos': { public: true, roles: ['staff', 'store_owner'] },
  'payment-proof': { public: false, roles: ['staff', 'store_owner', 'shopper'] },
};

/**
 * Uploads go to the project's own Supabase Storage: a public bucket for product photos and a
 * private one for a shopper's bank transfer slip.
 */
export async function POST(request) {
  const viewer = await getViewer();
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Send the file as form data.');

  const bucket = String(form.get('bucket') || 'product-photos');
  const rule = BUCKETS[bucket];
  if (!rule) return fail(400, 'Unknown upload kind.');
  if (!rule.roles.includes(viewer.role)) return fail(403, 'You cannot upload that kind of file.');

  const file = form.get('file');
  if (!file || typeof file === 'string') return fail(422, 'Choose a file first.');
  if (file.size > 5 * 1024 * 1024) return fail(422, 'Each photo can be up to 5 MB.');

  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${viewer.user?.id || 'guest'}/${randomUUID()}.${extension}`;
  const admin = supabaseAdmin();
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) return fail(500, error.message);

  if (rule.public) {
    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return ok({ path, url: data.publicUrl, message: 'Photo uploaded.' });
  }
  return ok({ path, message: 'Proof attached to the order.' });
}
