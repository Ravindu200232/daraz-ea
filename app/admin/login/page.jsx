import Link from 'next/link';
import { Logo, Button, Card, Field, Input, Badge, Alert } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { GoogleSignIn } from '@/components/auth/AuthBits.jsx';
import { getSettings } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Management sign in — DarazEA' };

export default async function AdminLoginPage() {
  const settings = await getSettings();
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/"><Logo /><span>{settings.store_name}</span></Link>
          <Button href="/" variant="ghost">Back to the store</Button>
        </div>
      </header>

      <main className="auth" id="main">
        <div className="container">
          <div className="grid grid--2" style={{ alignItems: 'start' }}>
            <section className="auth__panel" aria-labelledby="m-step1">
              <div className="u-between">
                <h1 className="auth__title u-mb0" id="m-step1">Management sign in</h1>
                <Badge>Step 1 of 2</Badge>
              </div>
              <p className="u-muted">Products, orders, returns and store settings are behind this sign-in.</p>
              <PostForm action="/api/auth/management" submitLabel="Send my one-time code" submitVariant="primary" testId="management-step1" footer={null}>
                <Field label="Work email" htmlFor="m-email">
                  <Input id="m-email" name="email" type="email" autoComplete="username" required data-testid="mgmt-email" />
                </Field>
                <Field label="Password" htmlFor="m-password" hint="The code goes to the phone number and the email address registered on this account.">
                  <Input id="m-password" name="password" type="password" autoComplete="current-password" required data-testid="mgmt-password" />
                </Field>
                <button className="btn btn--primary btn--block" type="submit" data-testid="mgmt-send-code">Send my one-time code</button>
              </PostForm>
              <div className="divider">or</div>
              <GoogleSignIn label="Continue with Google" next="/admin" />
            </section>

            <section className="auth__panel" aria-labelledby="m-step2">
              <div className="u-between">
                <h2 className="auth__title u-mb0" id="m-step2">One-time code</h2>
                <Badge>Step 2 of 2</Badge>
              </div>
              <p className="u-muted">After your password is accepted, the six-digit code opens the management side. Codes expire ten minutes after they are sent, and a code can be used once.</p>
              <PostForm action="/api/auth/management/verify" submitLabel="Verify and open management" submitVariant="primary" testId="management-step2" footer={null}>
                <Field label="Six-digit code" htmlFor="m-code" hint="Codes are single use; ask for a new one if it has expired.">
                  <Input id="m-code" name="code" inputMode="numeric" maxLength="7" autoComplete="one-time-code" required data-testid="mgmt-code" />
                </Field>
                <button className="btn btn--primary" type="submit" data-testid="mgmt-verify">Verify and open management</button>
              </PostForm>
              <p className="u-small u-mt4">Not your account? <Link href="/admin/login">Use a different email address</Link></p>

              <Card title="Account switched off" className="u-mt4">
                <Alert tone="error">
                  A switched-off management account cannot be sent a code and no management page will open. Ask the store owner to switch the account back on.
                </Alert>
              </Card>
            </section>
          </div>
        </div>
      </main>

      <nav className="site-nav auth-nav" aria-label="Account">
        <div className="container site-nav__inner">
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/admin/login" className="is-active">Management sign in</Link>
        </div>
      </nav>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div><span className="site-footer__brand"><Logo />{settings.store_name}</span></div>
          <div className="site-footer__col"><h4>Support</h4><span>{settings.support_email}</span><span>{settings.support_phone}</span></div>
        </div>
      </footer>
    </div>
  );
}
