'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { passwordChecks } from '@/lib/validation.js';

/** Google sign-in, and the live password checklist the sign-up form shows. */

function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function GoogleSignIn({ label = 'Sign in with Google', next = '/account' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <button
        className="gbtn"
        type="button"
        data-testid="google-sign-in"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          const supabase = browserClient();
          const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
          if (authError) {
            setBusy(false);
            setError('Google sign-in is not available right now. Use your email address and password.');
          }
        }}
      >
        <span className="gbtn__mark" aria-hidden="true">G</span> {busy ? 'Opening Google…' : label}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}

export function PasswordRules({ inputId, level = 'register' }) {
  const [value, setValue] = useState('');
  const rules = passwordChecks(value, level);
  return (
    <>
      <input
        className="input"
        id={inputId}
        name="password"
        type="password"
        autoComplete={level === 'register' ? 'new-password' : 'new-password'}
        required
        onChange={(event) => setValue(event.target.value)}
      />
      <ul className="rulelist">
        {rules.map((rule) => (
          <li key={rule.key} className={value ? (rule.ok ? 'is-ok' : 'is-no') : ''}>
            <span aria-hidden="true">{value ? (rule.ok ? '✓' : '✗') : '•'}</span> {rule.label}
          </li>
        ))}
      </ul>
    </>
  );
}
