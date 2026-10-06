import Link from 'next/link';
import { Logo, Button, Card, Field, Input, Alert } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { getSettings } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reset your password — DarazEA' };

export default async function ForgotPasswordPage() {
  const settings = await getSettings();
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/"><Logo /><span>{settings.store_name}</span></Link>
          <Button href="/login" variant="ghost">Back to sign in</Button>
        </div>
      </header>

      <main className="auth" id="main">
        <div className="container">
          <div className="auth__layout">
            <section className="auth__hero" aria-label="DarazEA">
              <span className="auth__brand"><Logo /><span>{settings.store_name}</span></span>
              <h2>Shop, pay and track your orders</h2>
              <p>A single-use link gets you back into the account your order emails go to. It works once and stops after an hour.</p>
            </section>

            <div className="auth__panel">
              <h1 className="auth__title">Reset your password</h1>
              <p className="u-muted">{settings.store_name} emails a single-use link to the address on your account. Open the link and choose a new password.</p>

              <ol className="u-flex u-mb4" style={{ listStyle: 'none', padding: 0, gap: 8 }}>
                <li className="badge badge--solid">1 Email</li>
                <li className="badge">2 Check your inbox</li>
                <li className="badge">3 New password</li>
              </ol>

              <section aria-labelledby="step1">
                <h2 className="subhead" id="step1">Step 1 · Enter your email</h2>
                <PostForm action="/api/auth/password-reset" submitLabel="Send reset link" submitVariant="primary" testId="password-reset" footer={null}>
                  <Field label="Email address" htmlFor="reset-email" hint={`Sent from ${settings.support_email} to whatever address you type — the same message is shown either way.`}>
                    <Input id="reset-email" name="email" type="email" autoComplete="email" required data-testid="reset-email" />
                  </Field>
                  <button className="btn btn--primary" type="submit" data-testid="reset-submit">Send reset link</button>
                </PostForm>
              </section>

              <section className="u-mt6" aria-labelledby="step2">
                <h2 className="subhead" id="step2">Step 2 · After the form is sent</h2>
                <Card title="Check your email">
                  <p className="u-small">If that address belongs to a {settings.store_name} account, a single-use link to set a new password is on its way.</p>
                  <p className="u-small u-muted">The same message is shown for every address, so nothing here tells anyone whether an email is registered.</p>
                  <p className="u-small">Nothing in the inbox? Look in the spam folder, then ask for another link.</p>
                </Card>
              </section>

              <section className="u-mt6" aria-labelledby="step3">
                <h2 className="subhead" id="step3">Step 3 · From the emailed link</h2>
                <p className="u-small u-muted">The link opens this page with a short-lived token. Choose the new password there and it is set on your account.</p>
                <Alert tone="soft" title="This link no longer works.">
                  It has already been used, or its hour has passed. <Link href="/forgot-password">Ask for a new one</Link>.
                </Alert>
              </section>
            </div>
          </div>
        </div>
      </main>

      <nav className="site-nav auth-nav" aria-label="Account">
        <div className="container site-nav__inner">
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/forgot-password" className="is-active">Forgot password</Link>
          <Link href="/admin/login">Management sign in</Link>
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
