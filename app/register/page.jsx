import Link from 'next/link';
import { Logo, Button, Card, Field, Input, Alert, Badge } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { GoogleSignIn, PasswordRules } from '@/components/auth/AuthBits.jsx';
import { getSettings } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create your account — DarazEA' };

export default async function RegisterPage() {
  const settings = await getSettings();
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/"><Logo /><span>{settings.store_name}</span></Link>
          <Button href="/login" variant="ghost">Sign in</Button>
        </div>
      </header>

      <main className="auth" id="main">
        <div className="container">
          <div className="auth__layout">
            <section className="auth__hero" aria-label="Welcome to DarazEA">
              <span className="auth__brand"><Logo /><span>{settings.store_name}</span></span>
              <h2>One account, every parcel</h2>
              <p>Keep your orders, your wishlist and your saved delivery addresses together, and follow every order from placed to delivered.</p>
              <ul className="u-small" style={{ color: '#d8eef8' }}>
                <li>An email at placed, confirmed, shipped and delivered</li>
                <li>Saved addresses ready at checkout</li>
                <li>Reviews kept with the account that wrote them</li>
              </ul>
            </section>

            <div className="auth__panel">
              <p><Badge tone="accent">Shopper account</Badge></p>
              <h1 className="auth__title">Create your account</h1>
              <p className="u-muted">Keep your orders, your wishlist and your saved delivery addresses together, and follow every order from placed to delivered.</p>

              <GoogleSignIn label="Continue with Google" />
              <div className="divider">or sign up with your email</div>

              <PostForm action="/api/auth/register" submitLabel="Create account" submitVariant="primary" testId="register" footer={null}>
                <Field label="Full name" htmlFor="full-name" hint="As it should appear on the delivery.">
                  <Input id="full-name" name="full_name" type="text" autoComplete="name" required data-testid="full-name" />
                </Field>
                <Field label="Email address" htmlFor="email">
                  <Input id="email" name="email" type="email" autoComplete="email" required data-testid="reg-email" />
                </Field>
                <Field label="Phone number" htmlFor="phone" hint="The number we reach you on about a delivery.">
                  <Input id="phone" name="phone" type="tel" autoComplete="tel" required data-testid="reg-phone" />
                </Field>
                <div className="field">
                  <label className="field__label" htmlFor="password">Create password</label>
                  <PasswordRules inputId="password" level="register" />
                  <p className="hint">A shopper account is all this can create — staff accounts are added by the store owner.</p>
                </div>
                <button className="btn btn--primary btn--block" type="submit" data-testid="register-submit">Create account</button>
                <p className="hint">When your account is ready you go straight into the store, with your account signed in.</p>
              </PostForm>

              <p className="auth__foot">Already have an account? <Link href="/login">Sign in</Link></p>
            </div>
          </div>
        </div>
      </main>

      <nav className="site-nav auth-nav" aria-label="Account">
        <div className="container site-nav__inner">
          <Link href="/login">Sign in</Link>
          <Link href="/register" className="is-active">Create account</Link>
          <Link href="/forgot-password">Forgot password</Link>
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
