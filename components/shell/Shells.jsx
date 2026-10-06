import Link from 'next/link';
import { Logo, Button } from '@/components/ui/index.jsx';
import { MenuToggle, SignOutButton } from '@/components/ui/client.jsx';

/**
 * The two shells, ported once from the approved prototype: a sticky storefront header with the
 * store's own name, the search box and the cart, the department strip under it, the footer from
 * Store Settings — and the management shell with its left menu and header.
 */

const STORE_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Catalogue' },
  { href: '/search', label: 'Search results' },
  { href: '/cart', label: 'Cart' },
  { href: '/track', label: 'Track order' },
];

const ACCOUNT_LINKS = [
  { href: '/account/orders', label: 'My Orders' },
  { href: '/account', label: 'My Account' },
  { href: '/account/addresses', label: 'My Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export function StorefrontHeader({ settings, cartCount = 0, viewer, account = false }) {
  const links = account ? ACCOUNT_LINKS : STORE_LINKS;
  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/">
            <Logo />
            <span>{settings?.store_name || 'DarazEA'}</span>
          </Link>
          <form className="search" action="/search" role="search">
            <label className="sr" htmlFor="site-search">Search products</label>
            <input className="search__input" id="site-search" name="q" type="search" placeholder="Search products" />
            <button className="search__btn" type="submit">Search</button>
          </form>
          <Link className="cart-link" href="/cart">
            Cart <span className="cart-link__count" data-testid="cart-count">{cartCount}</span>
          </Link>
          {viewer?.role === 'shopper' ? (
            <Link className="account-link" href="/account">Hello, {viewer.customer?.full_name?.split(' ')[0] || 'shopper'}</Link>
          ) : (
            <Link className="account-link" href="/account">My account</Link>
          )}
          {viewer?.role !== 'guest' && <SignOutButton />}
        </div>
      </header>
      <nav className="site-nav" aria-label="Store">
        <div className="container site-nav__inner">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <Link href="/shop">Catalogue</Link>
        </div>
      </nav>
    </>
  );
}

export function DeptStrip({ departments = [] }) {
  return (
    <div className="dept-strip">
      <div className="container dept-strip__inner">
        <Link href="/shop">All departments</Link>
        {departments.slice(0, 4).map((department) => (
          <Link key={department.id} href={`/shop?category=${department.slug}`}>{department.name}</Link>
        ))}
      </div>
    </div>
  );
}

export function SiteFooter({ settings }) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div>
          <span className="site-footer__brand">
            <Logo />
            {settings?.store_name || 'DarazEA'}
          </span>
          <p className="u-small" style={{ marginTop: 10, maxWidth: '32ch' }}>
            A single-seller store: every product is ours, packed and posted by our own team.
          </p>
        </div>
        <div className="site-footer__col">
          <h4>Support</h4>
          <span>{settings?.support_email}</span>
          <span>{settings?.support_phone}</span>
          <Link href="/track">Track an order</Link>
        </div>
        <div className="site-footer__col">
          <h4>Shop</h4>
          <Link href="/shop">Catalogue</Link>
          <Link href="/search">Search</Link>
          <Link href="/cart">Your cart</Link>
        </div>
        <div className="site-footer__col">
          <h4>Your account</h4>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create an account</Link>
          <Link href="/account/orders">My orders</Link>
        </div>
      </div>
      <div className="container u-xs" style={{ marginTop: 'var(--space-5)' }}>
        Prices in Sri Lankan Rupees (LKR). Delivery is charged per area at checkout and is never free.
      </div>
    </footer>
  );
}

const MANAGEMENT_LINKS = [
  { group: 'Store', items: [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/returns', label: 'Returns' },
  ] },
  { group: 'Catalogue', items: [
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/categories', label: 'Categories' },
    { href: '/admin/reviews', label: 'Reviews' },
  ] },
  { group: 'Shoppers and offers', items: [
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/coupons', label: 'Coupons' },
  ] },
  { group: 'Owner settings', owner: true, items: [
    { href: '/admin/delivery-areas', label: 'Delivery fees' },
    { href: '/admin/settings/payments', label: 'Payment settings' },
    { href: '/admin/settings', label: 'Store settings' },
    { href: '/admin/staff', label: 'Staff members' },
  ] },
];

export function AdminShell({ viewer, active, title, subtitle, actions, children }) {
  const isOwner = viewer?.role === 'store_owner';
  return (
    <div className="admin">
      <aside className="admin__aside" id="admin-side" data-testid="admin-sidebar">
        <Link className="admin-nav__brand" href="/">
          <Logo size={28} />
          DarazEA
        </Link>
        <nav className="admin-nav" aria-label="Management">
          {MANAGEMENT_LINKS.filter((group) => !group.owner || isOwner).map((group) => (
            <div key={group.group}>
              <span className="admin-nav__group">{group.group}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  className={`admin-nav__link${active === item.href ? ' is-active' : ''}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="admin__main">
        <header className="admin-head">
          <MenuToggle target="#admin-side">Menu</MenuToggle>
          <h1>{title}</h1>
          {subtitle && <span className="u-small u-muted">{subtitle}</span>}
          <span className="u-push" />
          <span className="admin-head__user">
            {viewer?.staff?.full_name || viewer?.customer?.full_name || 'Management'} ·{' '}
            {viewer?.role === 'store_owner' ? 'Store Owner' : 'Staff'}
          </span>
          <SignOutButton />
        </header>
        <main className="admin-body">{children}</main>
      </div>
    </div>
  );
}

export function Forbidden() {
  return (
    <div className="admin">
      <div className="admin__main">
        <main className="admin-body">
          <div className="alert alert--error" data-testid="forbidden" role="alert">
            <span className="alert__icon" aria-hidden="true">!</span>
            <div>
              <strong>403 — this page is not yours.</strong>
              Delivery fees, payment settings, store settings and staff accounts are kept by the
              Store Owner. Your own management pages are on the left.
            </div>
          </div>
          <p className="u-mt4"><Button variant="primary" href="/admin">Back to the Dashboard</Button></p>
        </main>
      </div>
    </div>
  );
}
