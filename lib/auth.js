import { redirect } from 'next/navigation';
import { supabaseAdmin, supabaseServer } from './supabase.js';
import { OWNER_ONLY_ROUTES } from './constants.js';

/**
 * Who is looking at the page, decided on the server from the Supabase session, never from anything
 * the browser sends. A visitor with no session is a guest; a signed-in user is a shopper, a Staff
 * member or the Store Owner, read from their own row under Row Level Security.
 */

export async function getAuthUser() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}

export async function getViewer() {
  const user = await getAuthUser();
  if (!user) return { role: 'guest', user: null, customer: null, staff: null };

  const supabase = await supabaseServer();
  const { data: staff } = await supabase
    .from('staff_members')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (staff && staff.status === 'active') {
    return { role: staff.role, user, staff, customer: null };
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (customer) {
    return {
      role: customer.account_status === 'active' ? 'shopper' : 'switched_off',
      user,
      customer,
      staff: null,
    };
  }
  return { role: 'shopper', user, customer: null, staff: null };
}

/** A page only its own shopper may open. Signed out goes to sign-in; management reaches its own side. */
export async function requireShopper(next = '/account') {
  const viewer = await getViewer();
  if (viewer.role === 'guest') redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.role === 'staff' || viewer.role === 'store_owner') redirect('/admin');
  if (viewer.role === 'switched_off') redirect('/login?switched=1');
  return viewer;
}

/** A management page: Staff or Store Owner only. */
export async function requireManagement(next = '/admin') {
  const viewer = await getViewer();
  if (viewer.role === 'guest') redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  if (viewer.role !== 'staff' && viewer.role !== 'store_owner') redirect(`/login?next=${encodeURIComponent('/account')}`);
  return viewer;
}

/**
 * The four screens only the Store Owner may open. A Staff account is refused on the server: the
 * page renders the 403 notice and every write behind it is refused too.
 */
export async function requireOwner(next = '/admin') {
  const viewer = await requireManagement(next);
  if (viewer.role !== 'store_owner') return { ...viewer, forbidden: true };
  return viewer;
}

export function isOwnerOnlyRoute(pathname) {
  return OWNER_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function canManage(viewer) {
  return viewer?.role === 'staff' || viewer?.role === 'store_owner';
}

export function canOwn(viewer) {
  return viewer?.role === 'store_owner';
}

/** Server-only client for the rows no session may reach: guest carts, tracking lookups, seeds. */
export function adminDb() {
  return supabaseAdmin();
}
