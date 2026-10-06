/**
 * Apply supabase/migrations/*.sql to the project's own connected database.
 *
 * `pg` is already a dev dependency, and the Studio sets SUPABASE_DB_URL for every command, so the
 * schema can be applied without linking a CLI session. Every statement in these migrations is
 * idempotent (`if not exists`), so re-running is safe and never drops data.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('❌ SUPABASE_DB_URL is not set (AgentForge sets it for every command).');
  process.exit(1);
}

const dir = path.join(process.cwd(), 'supabase', 'migrations');
const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();

const client = new pg.Client({
  connectionString: url,
  ssl: /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
} catch (error) {
  console.error(`❌ could not reach the database named by SUPABASE_DB_URL (${error.code || error.message}).`);
  console.error('   Use that project\'s Session pooler string from Connect → Session pooler: the pooler answers over');
  console.error('   IPv4, while the direct db.[ref].supabase.co host is IPv6-only on the free plan and cannot be');
  console.error('   reached from every machine. A paused project has to be resumed in the Supabase dashboard first.');
  process.exit(1);
}
let failed = 0;
for (const file of files) {
  const sql = await readFile(path.join(dir, file), 'utf8');
  try {
    await client.query(sql);
    console.log(`✅ applied ${file}`);
  } catch (error) {
    // A re-run of a migration whose tables and policies already exist is not a failure: every
    // statement in these files is written to be safe to repeat.
    if (/already exists/i.test(error.message)) {
      console.log(`↺ ${file}: ${error.message}`);
      continue;
    }
    failed += 1;
    console.error(`❌ ${file}: ${error.message}`);
  }
}
await client.end();

if (failed) {
  console.error(`❌ ${failed} migration file(s) failed`);
  process.exit(1);
}
console.log(`✅ ${files.length} migration file(s) applied`);
