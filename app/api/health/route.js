import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * The one cheap route the platform and a deployment's own checks can call.
 *
 * The plain answer carries no data at all: a status, the store's name and the time it was asked,
 * so it is safe to leave public and costs nothing to call.
 *
 * `?deep=1` answers the same and then runs exactly one small read through the anon key, which is
 * the key a shopper's browser holds. That read proves two things at once on a deployed store: the
 * functions really reach the project's Supabase database, and Row Level Security still decides what
 * a signed-out caller may see. Nothing but a count comes back, and a failure says so with a 503
 * rather than pretending to be healthy.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const started = Date.now();
  const deep = new URL(request.url).searchParams.get('deep') === '1';
  const answer = { ok: true, status: 'ok', app: 'DarazEA', checkedAt: new Date().toISOString() };
  if (!deep) return NextResponse.json(answer);

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) {
    return NextResponse.json({ ...answer, ok: false, database: 'unconfigured' }, { status: 503 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'shown');

  if (error) {
    return NextResponse.json(
      { ...answer, ok: false, database: 'unreachable', reason: 'the catalogue could not be read' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ...answer,
    database: 'ok',
    visibleProducts: count ?? 0,
    ms: Date.now() - started,
  });
}
