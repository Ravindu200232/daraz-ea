import { fileURLToPath } from 'node:url';

const production = process.env.NODE_ENV === 'production';

/**
 * Response headers every page and API answer carries. A ZAP baseline reports each of these
 * as missing, and each one is a one-line default rather than a per-page decision.
 *
 * The Content-Security-Policy is production-only (the dev server evaluates code for hot
 * reload). `'unsafe-inline'` scripts are what Next's own bootstrap needs without a
 * per-request nonce. `connect-src` always includes this project's own Supabase project (the
 * browser client calls it directly for Auth, the Data API and Storage). When another integration
 * loads a third-party script, frame or API (a payment widget, analytics, a map), add its origin to
 * `script-src`, `frame-src` or `connect-src` here too, or the browser will block it.
 *
 * Nobody may frame the app unless `FRAME_ANCESTORS` names who when you BUILD (Next bakes these
 * headers into the build). Keep it strict: the AgentForge Studio's preview process lifts the rule
 * for its own iframe, so the app never has to weaken it. `X-Frame-Options` cannot name another
 * origin, so it is sent only when nobody may frame the app.
 */
const frameAncestors = process.env.FRAME_ANCESTORS?.trim() || "'none'";
// Trimmed: a value set from a pipe can carry a trailing newline, and an origin with whitespace on
// the end would be refused by the browser's connect-src without saying so.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseWs = supabaseUrl.replace(/^https?:/, 'wss:');
const securityHeaders = [
  ...(frameAncestors === "'none'" ? [{ key: 'X-Frame-Options', value: 'DENY' }] : []),
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(production ? [{
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      // The design's own typefaces (Poppins + Ubuntu) are served by Google Fonts, so those two
      // origins belong here alongside this project's Supabase project.
      `connect-src 'self' ${supabaseUrl} ${supabaseWs} https://fonts.googleapis.com https://fonts.gstatic.com`.trim(),
      `frame-ancestors ${frameAncestors}`,
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The application owns its tracing root.  AgentForge keeps each generated
  // project under a shared workspaces directory, which also has lockfiles.
  // Without this, Next infers the parent as the root and logs a warning on
  // every preview start.
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  // `X-Powered-By: Next.js` tells a scanner which framework to attack.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
