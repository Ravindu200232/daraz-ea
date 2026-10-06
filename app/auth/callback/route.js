import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase.js';

/** The Google sign-in return leg: exchange the code for a session, then land the viewer. */
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/account';
  if (!code) return NextResponse.redirect(new URL('/login?error=google', url.origin));

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/login?error=google', url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
