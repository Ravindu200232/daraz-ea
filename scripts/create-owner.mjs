/**
 * Create — or adopt — the Store Owner account this deployment was given, idempotently.
 *
 * The store has no "create the first administrator" screen, so an empty or new production project
 * would have nobody who could open the management side. This script is that missing first step, and
 * it is the same shape as `scripts/seed.mjs`: create the Supabase Auth user through the service-role
 * admin API (the anon key cannot create users), then upsert the staff_members row keyed on the Auth
 * user's own id, which is what the row's primary key references.
 *
 * It is safe to run more than once: an existing Auth user is adopted rather than recreated, and its
 * password is left exactly as it is — this script never resets a credential. Nothing it reads is
 * printed, written to a file or put in a command: the email, the name and the password arrive in the
 * environment under ADMIN_EMAIL, ADMIN_FULL_NAME and ADMIN_PASSWORD and stay there.
 */
import { createClient } from '@supabase/supabase-js';

const url = (process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const fullName = (process.env.ADMIN_FULL_NAME || '').trim();
const password = process.env.ADMIN_PASSWORD || '';

if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}
if (!email) {
  console.error('ADMIN_EMAIL is not set, so there is no account to create.');
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Auth users are listed in pages; the store has few staff, but this walks them rather than guessing. */
async function findUserByEmail(address) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === address);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
}

const existing = await findUserByEmail(email);
let userId;
let created = false;

if (existing) {
  userId = existing.id;
} else {
  if (!password) {
    console.error(`There is no account for ADMIN_EMAIL yet, and ADMIN_PASSWORD is not set, so it cannot be created.`);
    process.exit(1);
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error) throw error;
  userId = data.user.id;
  created = true;
}

const { error: staffError } = await admin.from('staff_members').upsert(
  {
    id: userId,
    email,
    full_name: fullName || 'Store Owner',
    role: 'store_owner',
    status: 'active',
  },
  { onConflict: 'id' },
);
if (staffError) throw staffError;

const { data: row } = await admin
  .from('staff_members')
  .select('role, status')
  .eq('id', userId)
  .maybeSingle();

console.log(created
  ? 'The Store Owner account was created and its staff row written.'
  : 'The Store Owner account already existed: its staff row is ensured and its password was left alone.');
console.log(`Management row: ${row ? `${row.role} / ${row.status}` : 'missing'}`);
