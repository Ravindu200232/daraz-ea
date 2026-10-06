/**
 * Create the whole database on a Supabase project, from nothing, in one command.
 *
 * The store needs five things before it can serve anybody, and every one of them is created here
 * rather than pasted in by hand:
 *
 *   1. the schema — all twenty tables, their indexes and a Row Level Security policy on each;
 *   2. the storage buckets `product-photos` (public) and `payment-proof` (management only) with
 *      their policies on `storage.objects`;
 *   3. the management one-time-code table and the role helpers the policies call;
 *   4. the catalogue, the delivery areas, the payment switches, the coupons and the demo cast, from
 *      `scripts/seed.mjs` — additive only, so running it twice changes nothing;
 *   5. the first Store Owner, from `scripts/create-owner.mjs`, so somebody can open /admin/login.
 *
 * Every step is idempotent, so this is safe on an empty project and on one already in use: it never
 * drops a table and never deletes a row. It is what turns a new Supabase project into DarazEA's
 * database.
 *
 * Which values it reads (never printed, never written to a file):
 *   SUPABASE_DB_URL            the Postgres connection string for the project (steps 1-3). Use the
 *                              project's Session pooler string: the direct `db.<ref>.supabase.co`
 *                              host is IPv6-only on the free plan and will not connect from every
 *                              machine.
 *   SUPABASE_URL               the project URL (steps 4-5)
 *   SUPABASE_SERVICE_ROLE_KEY  the server key that bypasses RLS (steps 4-5)
 *   ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_PASSWORD   the first Store Owner (step 5, optional: without
 *                              ADMIN_EMAIL the owner step is skipped and reported)
 *
 *   npm run db:init
 */
import { spawnSync } from 'node:child_process';

const steps = [
  {
    name: 'schema, buckets and policies',
    script: 'scripts/apply-schema.mjs',
    needs: ['SUPABASE_DB_URL'],
  },
  {
    name: 'catalogue, settings and the demo cast',
    script: 'scripts/seed.mjs',
    needs: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  },
  {
    name: 'the first Store Owner',
    script: 'scripts/create-owner.mjs',
    needs: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL'],
    optional: true,
    skipWhenMissing: 'ADMIN_EMAIL',
  },
];

let failed = 0;
let skipped = 0;

for (const step of steps) {
  const missing = step.needs.filter((name) => !(process.env[name] || '').trim());
  if (missing.length && step.optional && missing.includes(step.skipWhenMissing)) {
    skipped += 1;
    console.log(`↷ ${step.name}: skipped, ${step.skipWhenMissing} is not set`);
    continue;
  }
  if (missing.length) {
    failed += 1;
    console.error(`❌ ${step.name}: ${missing.join(', ')} must be set`);
    continue;
  }

  console.log(`→ ${step.name} (${step.script})`);
  const result = spawnSync(process.execPath, [step.script], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`❌ ${step.name}: ${step.script} exited ${result.status}`);
  }
}

if (failed) {
  console.error(`❌ the database is not ready: ${failed} step(s) failed. Fix the first failure above and run this again — every step is safe to repeat.`);
  process.exit(1);
}

console.log(`✅ database ready${skipped ? ` (${skipped} optional step skipped)` : ''}: the store can sign in, read its catalogue and take an order.`);
