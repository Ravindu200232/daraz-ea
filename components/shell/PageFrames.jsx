import { getViewer } from '@/lib/auth.js';
import { getSettings, getDepartments, getCartLines } from '@/lib/queries.js';
import { readGuestId } from '@/lib/guest.js';
import { StorefrontHeader, DeptStrip, SiteFooter, AdminShell, Forbidden } from './Shells.jsx';

/**
 * The two page frames: the storefront shell around a shop page, and the management shell around a
 * management page. Both are server components, so the store's own settings, the cart count and the
 * viewer's role are read once per request.
 */

export async function cartCountFor(viewer, guestId) {
  try {
    if (viewer?.role === 'shopper') {
      const lines = await getCartLines({ customerId: viewer.user.id });
      return lines.reduce((sum, line) => sum + Number(line.quantity), 0);
    }
    const id = guestId ?? (await readGuestId());
    if (!id) return 0;
    const lines = await getCartLines({ guestId: id });
    return lines.reduce((sum, line) => sum + Number(line.quantity), 0);
  } catch {
    return 0;
  }
}

export async function StorefrontPage({ children, account = false, tight = false }) {
  const viewer = await getViewer();
  const [settings, departments, cartCount] = await Promise.all([
    getSettings(),
    getDepartments(),
    cartCountFor(viewer),
  ]);
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <StorefrontHeader settings={settings} cartCount={cartCount} viewer={viewer} account={account} />
      {!account && <DeptStrip departments={departments} />}
      <main className={`page${tight ? ' page--tight' : ''}`} id="main">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}

export async function AdminPage({ viewer, active, title, subtitle, actions, children }) {
  if (viewer?.forbidden) return <Forbidden />;
  return (
    <AdminShell viewer={viewer} active={active} title={title} subtitle={subtitle} actions={actions}>
      {children}
    </AdminShell>
  );
}
