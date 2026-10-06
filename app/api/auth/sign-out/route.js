import { ok } from '@/lib/api.js';
import { supabaseServer } from '@/lib/supabase.js';
import { signOutGuest } from '@/lib/guest.js';

export async function POST() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  await signOutGuest();
  return ok({ message: 'You are signed out.', redirect: '/' });
}
