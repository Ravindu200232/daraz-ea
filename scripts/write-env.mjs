/**
 * Write `.env.local` from the environment the Studio already provides for this project's connected
 * Supabase project. Nothing is invented here: SUPABASE_URL, SUPABASE_ANON_KEY and
 * SUPABASE_SERVICE_ROLE_KEY are the project's own values, and the two NEXT_PUBLIC_* names are the
 * aliases `lib/supabase.js` needs at build time. The file is git-ignored.
 */
import { writeFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error('❌ SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are all required.');
  process.exit(1);
}

const body = [
  `NEXT_PUBLIC_SUPABASE_URL=${url}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_URL=${url}`,
  `SUPABASE_SERVICE_ROLE_KEY=${service}`,
  '',
].join('\n');

await writeFile('.env.local', body, 'utf8');
console.log('✅ .env.local written from the connected project values');
