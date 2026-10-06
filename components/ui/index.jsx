import Link from 'next/link';
import { formatRs, formatRs2 } from '@/lib/money.js';
import { LOGO } from '@/lib/images.js';

/**
 * The shared components, one per kind, ported once from the approved prototype's own classes.
 * Every page imports these — no page re-derives its own padding, radius or control size, so two
 * buttons of the same kind on two different pages are pixel-identical.
 */

export function Button({ href, variant = 'default', size, block, className = '', children, ...rest }) {
  const classes = [
    'btn',
    variant !== 'default' ? `btn--${variant}` : '',
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ].filter(Boolean).join(' ');
  if (href) return <Link href={href} className={classes} {...rest}>{children}</Link>;
  return <button className={classes} {...rest}>{children}</button>;
}

export function Card({ title, titleHref, aside, footer, footerStart, accent, className = '', children, bodyProps }) {
  return (
    <section className={`card${accent ? ' card--accent' : ''} ${className}`.trim()}>
      {(title || aside) && (
        <header className="card__hd">
          {title && (titleHref ? <Link href={titleHref}><h2>{title}</h2></Link> : <h2>{title}</h2>)}
          {aside}
        </header>
      )}
      <div className="card__bd" {...bodyProps}>{children}</div>
      {footer && <footer className={`card__ft${footerStart ? ' card__ft--start' : ''}`}>{footer}</footer>}
    </section>
  );
}

export function Badge({ tone = 'default', children, ...rest }) {
  const map = { ok: 'badge--ok', warn: 'badge--warn', off: 'badge--off', danger: 'badge--danger', info: 'badge--info', solid: 'badge--solid', accent: 'badge--accent', sale: 'badge--sale' };
  return <span className={`badge${map[tone] ? ` ${map[tone]}` : ''}`} {...rest}>{children}</span>;
}

export function Alert({ tone = 'info', title, children, className = '' }) {
  return (
    <div className={`alert alert--${tone} ${className}`.trim()} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="alert__icon" aria-hidden="true">{tone === 'ok' ? '✓' : tone === 'info' || tone === 'soft' ? 'i' : '!'}</span>
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
      {action}
    </div>
  );
}

export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`field${error ? ' field--invalid' : ''} ${className}`.trim()}>
      {label && <label className="field__label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error && <p className="error">{error}</p>}
      {hint && !error && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Input({ invalid, ...rest }) {
  return <input className="input" aria-invalid={invalid ? 'true' : undefined} {...rest} />;
}

export function Select({ children, ...rest }) {
  return <select className="select" {...rest}>{children}</select>;
}

export function Textarea({ children, ...rest }) {
  return <textarea className="textarea" {...rest}>{children}</textarea>;
}

export function Check({ label, sub, ...rest }) {
  return (
    <label className="check">
      <input {...rest} />
      <span>
        <strong>{label}</strong>
        {sub && <span className="u-small u-muted" style={{ display: 'block' }}>{sub}</span>}
      </span>
    </label>
  );
}

export function Price({ value, was, size, sale }) {
  return (
    <p className={`price${size === 'lg' ? ' price--lg' : ''}`}>
      {formatRs(value)}
      {was ? <span className="price__was">{formatRs(was)}</span> : null}
      {sale ? <Badge tone="sale">{sale}</Badge> : null}
    </p>
  );
}

export function Kv({ rows }) {
  return (
    <dl className="kv">
      {rows.map(([key, value]) => (
        <div key={key} style={{ display: 'contents' }}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Facts({ rows }) {
  return (
    <dl className="facts">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Stat({ value, label, children, hero, countTo }) {
  return (
    <div className={`stat${hero ? ' stat--hero' : ''}`}>
      <span className="stat__num">{countTo ?? value}</span>
      <span className="stat__label">{label}</span>
      {children}
    </div>
  );
}

export function Stars({ rating, showNumber }) {
  const full = Math.round(Number(rating) || 0);
  return (
    <span className="stars" aria-label={`Rated ${rating} out of 5`}>
      {'★'.repeat(full)}
      <span className="stars--muted">{'★'.repeat(Math.max(0, 5 - full))}</span>
      {showNumber ? <span className="u-small u-muted" style={{ letterSpacing: 0 }}> {rating} out of 5</span> : null}
    </span>
  );
}

export function Totals({ rows, grand, note }) {
  return (
    <div className="totals">
      {rows.map(([label, value]) => (
        <div className="totals__row" key={label}><span>{label}</span><span>{value}</span></div>
      ))}
      {grand && <div className="totals__row totals__grand"><span>{grand[0]}</span><span>{grand[1]}</span></div>}
      {note && <p className="hint">{note}</p>}
    </div>
  );
}

export function Media({ src, alt, size, className = '', badge, caption }) {
  const classes = ['media', size ? `media--${size}` : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {src ? <img src={src} alt={alt || ''} loading="lazy" /> : null}
      {badge}
      {caption && <span className="media__cap">{caption}</span>}
    </span>
  );
}

export function Logo({ size = 38 }) {
  return <img className="brand__logo" style={{ width: size, height: size }} src={LOGO} alt="DarazEA" />;
}

export function ProductCard({ product, href, categoryName, outOfStock }) {
  const stock = outOfStock ?? !product.in_stock;
  return (
    <Link className="pcard" href={href}>
      <span className="pcard__media media">
        {product.photos?.[0] ? <img src={`${product.photos[0]}?auto=format&fit=crop&w=600&q=70`} alt={product.name} loading="lazy" /> : null}
        {stock ? <span className="badge badge--off media__badge">Out of stock</span>
          : product.sale_price ? <span className="badge badge--sale media__badge">Sale</span> : null}
      </span>
      <span className="pcard__body">
        {categoryName && <span className="pcard__cat">{categoryName}</span>}
        <span className="pcard__name">{product.name}</span>
        <span className="pcard__foot">
          <span className="price">{formatRs(product.sale_price ?? product.price)}{product.sale_price ? <span className="price__was">{formatRs(product.price)}</span> : null}</span>
          {stock ? <span className="rating u-small">No size or colour has stock</span> : null}
        </span>
      </span>
    </Link>
  );
}

export function StepRail({ stages }) {
  return (
    <div className="step-rail">
      {stages.map((stage) => (
        <div key={stage.label} className={stage.state === 'done' ? 'is-done' : stage.state === 'now' ? 'is-now' : ''}>
          <span className="n">{stage.n}</span>
          <strong>{stage.label}</strong>
          <span className="t-meta">{stage.meta}</span>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ rows }) {
  return (
    <ol className="timeline">
      {rows.map((row) => (
        <li key={row.key} className={row.state === 'done' ? 'is-done' : row.state === 'now' ? 'is-now' : ''}>
          <span className="dot" aria-hidden="true">{row.n}</span>
          <div>
            <span className="t-title">{row.title}</span>
            {row.meta && <span className="t-meta">{row.meta}</span>}
          </div>
          {row.tag}
        </li>
      ))}
    </ol>
  );
}

export function Table({ columns, rows, stack, className = '' }) {
  return (
    <div className="table-wrap">
      <table className={`table${stack ? ' table--stack' : ''} ${className}`.trim()}>
        <thead>
          <tr>{columns.map((column) => <th key={column.key} className={column.align === 'right' ? 'num' : undefined} scope="col">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label} className={column.align === 'right' ? 'num' : undefined}>
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Chips({ children }) {
  return <div className="chips">{children}</div>;
}

export function Chip({ href, children, ghost }) {
  const className = `chip${ghost ? ' chip--ghost' : ''}`;
  return href ? <Link className={className} href={href}>{children}</Link> : <span className={className}>{children}</span>;
}

export function Pager({ page, pages, hrefFor, label }) {
  if (!pages || pages <= 1) return label ? <span className="u-small u-muted">{label}</span> : null;
  const numbers = [];
  for (let n = 1; n <= Math.min(pages, 5); n += 1) numbers.push(n);
  if (pages > 6) numbers.push('…', pages);
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <Link href={hrefFor(page - 1)}>Prev</Link> : <span>Prev</span>}
      {numbers.map((n, index) => (n === '…'
        ? <span key={`gap-${index}`}>…</span>
        : <Link key={n} className={n === page ? 'is-active' : ''} href={hrefFor(n)}>{n}</Link>))}
      {page < pages ? <Link href={hrefFor(page + 1)}>Next</Link> : <span>Next</span>}
    </nav>
  );
}

export function TotalsLine({ label, value }) {
  return <div className="totals__row"><span>{label}</span><span>{value}</span></div>;
}

export function Money({ value }) {
  return <>{formatRs2(value)}</>;
}
