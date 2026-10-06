import Link from 'next/link';
import { Logo, Button, Field, Input, Card, Alert } from '@/components/ui/index.jsx';
import { PostForm } from '@/components/ui/client.jsx';
import { GoogleSignIn } from '@/components/auth/AuthBits.jsx';
import { getSettings } from '@/lib/queries.js';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sign in — DarazEA' };

export default async function LoginPage() {
  const settings = await getSettings();
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/"><Logo /><span>{settings.store_name}</span></Link>
          <Button href="/shop" variant="ghost">Continue shopping</Button>
        </div>
      </header>

      <main className="auth" id="main">
        <div className="auth__layout">
          <section className="auth__hero" aria-label="Welcome">
            <span className="auth__brand"><Logo /><span>{settings.store_name}</span></span>
            <h2>Welcome back to {settings.store_name}</h2>
            <p>Your orders, your wishlist and your saved delivery addresses, all in one place — with an email at every stage of every parcel.</p>
            <ul className="u-small" style={{ color: '#d8eef8' }}>
              <li>Follow each order from placed to delivered</li>
              <li>Save addresses and reuse them at checkout</li>
              <li>Rate and review what you have bought</li>
            </ul>
          </section>

          <div className="auth__panel">
            <h1 className="auth__title">Sign in</h1>
            <p className="u-muted">Sign in to your {settings.store_name} account to follow your orders, your wishlist and your saved addresses.</p>

            <PostForm action="/api/auth/sign-in" submitLabel="Sign in" submitVariant="primary" testId="sign-in" footer={null}>
              <Field label="Email address" htmlFor="email">
                <Input id="email" name="email" type="email" autoComplete="username" required data-testid="email" />
              </Field>
              <div className="field">
                <div className="u-between">
                  <label className="field__label u-mb0" htmlFor="password">Password</label>
                  <Link className="u-small" href="/forgot-password">Forgot password?</Link>
                </div>
                <Input id="password" name="password" type="password" autoComplete="current-password" required data-testid="password" />
              </div>
              <button className="btn btn--primary btn--block" type="submit" data-testid="sign-in-submit">Sign in</button>
            </PostForm>

            <div className="divider">or</div>
            <GoogleSignIn />

            <p className="auth__foot">New to {settings.store_name}? <Link href="/register">Create an account</Link></p>
          </div>
        </div>

        <div className="container auth-states">
          <Card title="Signing in">
            <p className="u-small u-muted">Checking your email address and password, then taking you to your account.</p>
          </Card>
          <Card title="The email address or password is not correct">
            <Alert tone="error">Check them and try again. Nothing has been signed in.</Alert>
          </Card>
          <Card title="This account has been switched off">
            <Alert tone="error">Email {settings.support_email} if you think that is wrong.</Alert>
          </Card>
        </div>
      </main>

      <nav className="site-nav auth-nav" aria-label="Account">
        <div className="container site-nav__inner">
          <Link href="/login" className="is-active">Sign in</Link>
          <Link href="/register">Create account</Link>
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/admin/login">Management sign in</Link>
        </div>
      </nav>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div>
            <span className="site-footer__brand"><Logo />{settings.store_name}</span>
          </div>
          <div className="site-footer__col">
            <h4>Support</h4>
            <span>{settings.support_email}</span>
            <span>{settings.support_phone}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
