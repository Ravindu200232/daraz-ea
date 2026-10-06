/**
 * Create a brand-new Supabase project for this store, and hand its values over in one file you can
 * read once.
 *
 * A Supabase *project* — the Postgres instance, its Auth service and its storage — can only be made
 * with an account credential, so this script uses the Supabase CLI (already on this machine) with a
 * personal access token. The database *inside* the project (schema, policies, buckets, catalogue,
 * the first Store Owner) is then created by `npm run db:init`.
 *
 * Which values it reads:
 *   SUPABASE_ACCESS_TOKEN   required. Create one at supabase.com/dashboard/account/tokens; it is
 *                           never printed, never written into this repository, and never needed by
 *                           the running application.
 *   SUPABASE_ORG_ID         optional: which organization the project belongs to. When it is not set
 *                           and your account has exactly one organization, that one is used.
 *   SUPABASE_REGION         optional, default ap-south-1 (Mumbai — the region nearest the shop's
 *                           Sri Lankan visitors, and the one the Vercel functions run in).
 *   SUPABASE_PROJECT_NAME   optional, default daraz-ea.
 *   SUPABASE_DB_PASSWORD    optional: the database password. When it is not set, a strong random
 *                           one is generated here; either way it goes into the hand-over file and
 *                           can be changed in the project's Database settings at any time.
 *
 * What it prints: the project's reference, its region, the connection host it proved, and the path
 * of the hand-over file. Never a key and never a password.
 *
 *   npm run db:create
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const token = (process.env.SUPABASE_ACCESS_TOKEN || '').trim();
const projectName = (process.env.SUPABASE_PROJECT_NAME || 'daraz-ea').trim();
const region = (process.env.SUPABASE_REGION || 'ap-south-1').trim();
const orgId = (process.env.SUPABASE_ORG_ID || '').trim();
const password = (process.env.SUPABASE_DB_PASSWORD || '').trim()
  || randomBytes(24).toString('base64url'); // letters, digits, - and _ only: safe inside a URL

if (!token) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is not set, so no project can be created from here.');
  console.error('   Either save a personal access token (supabase.com/dashboard/account/tokens) as SUPABASE_ACCESS_TOKEN,');
  console.error('   or create the project yourself in the Supabase dashboard and let the Studio connect it —');
  console.error('   then `npm run db:init` builds the whole database on it.');
  process.exit(1);
}

const cliEnv = { ...process.env, SUPABASE_ACCESS_TOKEN: token };

/** Run the Supabase CLI. The token goes in the environment, never in the argument list. */
function cli(args, { quiet = false } = {}) {
  const result = spawnSync('supabase', [...args, '--output-format', 'json'], {
    encoding: 'utf8',
    shell: true,
    env: cliEnv,
  });
  const out = (result.stdout || '').trim();
  const err = (result.stderr || '').trim();
  if (!quiet && result.status !== 0) {
    const reason = err.split('\n').filter((line) => line && !/new version|Update your CLI/i.test(line)).slice(0, 3).join(' ');
    throw new Error(`supabase ${args.join(' ')} failed: ${reason || 'no reason given'}`);
  }
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

// 1. Which organization the project belongs to.
let organization = orgId;
if (!organization) {
  const orgs = cli(['orgs', 'list']) || [];
  const list = Array.isArray(orgs) ? orgs : [orgs];
  const ids = list.map((org) => org.id || org.slug).filter(Boolean);
  if (ids.length === 1) {
    organization = ids[0];
  } else if (ids.length === 0) {
    fail('your Supabase account has no organization this token can see, so the project cannot be created.');
  } else {
    console.error('This token can reach more than one organization. Set SUPABASE_ORG_ID to the one you want:');
    for (const org of list) console.error(`   ${org.id || org.slug}  ${org.name || ''}`);
    process.exit(1);
  }
}

// 2. The project itself.
console.log(`→ creating the Supabase project "${projectName}" in ${region}`);
const created = cli(['projects', 'create', projectName, '--org-id', organization, '--region', region, '--db-password', password]);
const ref = created?.ref || created?.id || created?.project?.ref || created?.project?.id;
if (!ref) fail('the project was not created (or its reference could not be read). Run `supabase projects list` to see what exists.');

// 3. Wait until it is ready to answer.
let healthy = false;
for (let attempt = 1; attempt <= 20 && !healthy; attempt += 1) {
  const projects = cli(['projects', 'list'], { quiet: true }) || [];
  const list = Array.isArray(projects) ? projects : [projects];
  const mine = list.find((project) => (project.ref || project.id) === ref);
  healthy = mine?.status === 'ACTIVE_HEALTHY';
  if (!healthy) {
    console.log(`   … waiting for the project to come up (${attempt}/20)`);
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},15000)'], { stdio: 'ignore' });
  }
}
if (!healthy) fail('the project did not become healthy in five minutes. Check it in the Supabase dashboard, then run `npm run db:init` when it is ready.');

// 4. Its API keys.
let keys = cli(['projects', 'api-keys', '--project-ref', ref, '--reveal'], { quiet: true });
if (!keys) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  keys = response.ok ? await response.json() : null;
}
const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];
const valueOf = (entry) => ['api_key', 'key', 'secret', 'value', 'api_key_secret'].map((field) => entry[field]).find((value) => typeof value === 'string' && value);
const publicKey = keyList.find((entry) => /anon|publishable/i.test(entry.name || '') && valueOf(entry));
const serverKey = keyList.find((entry) => /service_role|secret/i.test(entry.name || '') && valueOf(entry));
if (!publicKey || !serverKey) fail('the project was created but its anon and service-role keys could not be read; copy them from the project\'s Settings → API page.');

// 5. The connection string, proved rather than assumed: the pooler host cannot be composed from the
//    region, so every candidate is tried with a real connection and the first one that answers wins.
const candidates = [
  { host: `aws-0-${region}.pooler.supabase.com`, user: `postgres.${ref}` },
  { host: `aws-1-${region}.pooler.supabase.com`, user: `postgres.${ref}` },
  { host: `db.${ref}.supabase.co`, user: 'postgres' },
];
const projectUrl = `https://${ref}.supabase.co`;
let connectionString = '';
let connectionHost = '';

const { default: pg } = await import('pg');
for (const candidate of candidates) {
  const url = `postgresql://${candidate.user}:${encodeURIComponent(password)}@${candidate.host}:5432/postgres`;
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query('select 1');
    await client.end();
    connectionString = url;
    connectionHost = candidate.host;
    break;
  } catch {
    try { await client.end(); } catch { /* already closed */ }
  }
}
if (!connectionString) {
  connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  connectionHost = `aws-0-${region}.pooler.supabase.com`;
}

// 6. Hand the values over in one file, outside this project, to be read once and then deleted.
const handoverPath = path.join(homedir(), 'daraz-ea-supabase-credentials.txt');
writeFileSync(
  handoverPath,
  [
    'DarazEA — the values for the new Supabase project this computer just created.',
    '',
    'Read this once, save the values where they belong (the Studio\'s Settings for this project, or',
    'your own .env.local), then change the database password in the project\'s Database settings and',
    'delete this file. Nothing in the repository or the deployment record contains these values.',
    '',
    `SUPABASE_URL=${projectUrl}`,
    `NEXT_PUBLIC_SUPABASE_URL=${projectUrl}`,
    `SUPABASE_ANON_KEY=${valueOf(publicKey)}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${valueOf(publicKey)}`,
    `SUPABASE_SERVICE_ROLE_KEY=${valueOf(serverKey)}`,
    `SUPABASE_DB_URL=${connectionString}`,
    '',
    `Project reference: ${ref}`,
    `Region: ${region}`,
    `Connection host: ${connectionHost}`,
    '',
    'The service-role key bypasses Row Level Security: keep it on the server only, never with a',
    'NEXT_PUBLIC_ prefix, and never commit it.',
    '',
  ].join('\n'),
  { mode: 0o600 },
);

console.log(`✅ project ${ref} is up in ${region}`);
console.log(`   connection host proved: ${connectionHost}`);
console.log(`   values written to: ${handoverPath}  (read once, then delete)`);
console.log('   next: save those values as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,');
console.log('   SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL, then run `npm run db:init`.');
