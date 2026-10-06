'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** The interactive pieces of the interface, shared by every page that needs them. */

export function MenuToggle({ target, children, className = 'hamburger', expanded }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-expanded={expanded ?? open}
      onClick={() => {
        const node = document.querySelector(target);
        if (!node) return;
        const next = !node.classList.contains('is-open');
        node.classList.toggle('is-open', next);
        setOpen(next);
      }}
    >
      {children}
    </button>
  );
}

export function SubmitOnChange({ children }) {
  return <span onChange={(event) => event.currentTarget.form?.requestSubmit()}>{children}</span>;
}

export function Dialog({ id, label, trigger, children, actions, triggerClassName = 'btn' }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    box.current?.querySelector('button, input, select, textarea, a')?.focus();
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)} aria-haspopup="dialog">{trigger}</button>
      {open && (
        <div className="dialog" role="dialog" aria-modal="true" aria-label={label} data-testid={id} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="dialog__box" ref={box}>
            <div className="dialog__hd">{label}</div>
            <div className="dialog__bd">{children}</div>
            <div className="dialog__ft">
              <button className="btn" type="button" onClick={() => setOpen(false)}>Close</button>
              {actions ? actions(() => setOpen(false)) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Tabs({ tabs, panels, initial }) {
  const [active, setActive] = useState(initial || tabs[0]?.key);
  return (
    <>
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={active === tab.key ? 'is-active' : ''}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined && <span className="count">{tab.count}</span>}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.key} role="tabpanel" hidden={active !== tab.key}>
          {panels[tab.key]}
        </div>
      ))}
    </>
  );
}

export function Stepper({ name, value, min = 1, max = 99, onChange, label }) {
  const [count, setCount] = useState(value ?? min);
  useEffect(() => { onChange?.(count); }, [count, onChange]);
  const atMax = count >= max;
  const atMin = count <= min;
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => setCount((c) => Math.max(min, c - 1))} disabled={atMin} aria-label="Decrease quantity">−</button>
      <span className="stepper__value" data-testid={`stepper-${name}`}>{count}</span>
      <button type="button" onClick={() => setCount((c) => Math.min(max, c + 1))} disabled={atMax} aria-label="Increase quantity">+</button>
      <input type="hidden" name={name} value={count} />
    </div>
  );
}

export function Switch({ name, defaultChecked, label, value = '1' }) {
  const [checked, setChecked] = useState(Boolean(defaultChecked));
  return (
    <label className="switch">
      <input type="checkbox" name={name} value={value} checked={checked} onChange={(event) => setChecked(event.target.checked)} aria-label={label} />
      <span className="switch__track" />
    </label>
  );
}

export function SmartImage({ src, alt, className, ...rest }) {
  const [missing, setMissing] = useState(false);
  if (!src || missing) return <span className={className} aria-hidden="true" />;
  return <img src={src} alt={alt || ''} className={className} loading="lazy" onError={() => setMissing(true)} {...rest} />;
}

function usePost(action) {
  const router = useRouter();
  const [state, setState] = useState({ status: 'idle', message: '' });
  const send = async (payload) => {
    setState({ status: 'sending', message: '' });
    try {
      const response = await fetch(action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState({ status: 'error', message: body.message || 'That did not go through. Please try again.' });
        return false;
      }
      setState({ status: 'ok', message: body.message || 'Saved.' });
      // One navigation per post: a redirect when the server names a destination, otherwise a
      // refresh of the current page — never both, which is what makes a page re-render mid-flight.
      if (body.redirect) router.push(body.redirect);
      else router.refresh();
      return true;
    } catch (error) {
      setState({ status: 'error', message: error.message || 'That did not go through. Please try again.' });
      return false;
    }
  };
  return { state, send };
}

export function PostForm({ action, hidden = {}, children, submitLabel = 'Save', submitVariant = 'primary', successMessage, footer, resetOnSuccess, testId, className = '' }) {
  const { state, send } = usePost(action);
  const form = useRef(null);
  const busy = state.status === 'sending';
  return (
    <form
      ref={form}
      className={className}
      data-testid={testId}
      onSubmit={async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const ok = await send({ ...hidden, ...data });
        if (ok && resetOnSuccess) form.current?.reset();
      }}
    >
      {children}
      {state.status === 'error' && (
        <div className="alert alert--error u-mt3" role="alert" data-testid="post-error">
          <span className="alert__icon" aria-hidden="true">!</span>
          <div>{state.message}</div>
        </div>
      )}
      {state.status === 'ok' && (
        <div className="alert alert--ok u-mt3" role="status" data-testid="post-ok">
          <span className="alert__icon" aria-hidden="true">✓</span>
          <div>{state.message || successMessage || 'Saved.'}</div>
        </div>
      )}
      {footer === null ? null : (
        footer || (
          <div className="u-flex u-mt3">
            <button className={`btn btn--${submitVariant}`} type="submit" disabled={busy}>
              {busy ? 'Saving…' : submitLabel}
            </button>
          </div>
        )
      )}
    </form>
  );
}

export function PostButton({ action, payload = {}, children, variant = 'default', size, confirm, testId, message }) {
  const { state, send } = usePost(action);
  return (
    <span className="u-flex" style={{ gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        className={`btn${variant !== 'default' ? ` btn--${variant}` : ''}${size === 'sm' ? ' btn--sm' : ''}`}
        data-testid={testId}
        disabled={state.status === 'sending'}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          await send({ ...payload, message });
        }}
      >
        {state.status === 'sending' ? 'Working…' : children}
      </button>
      {state.status === 'ok' && (
        <span className="u-small" role="status" data-testid="post-ok" style={{ color: 'var(--color-ok)', fontWeight: 700 }}>
          {state.message}
        </span>
      )}
      {state.status === 'error' && (
        <span className="u-small" role="alert" data-testid="post-error" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
          {state.message}
        </span>
      )}
    </span>
  );
}

export function SignOutButton({ children = 'Sign out' }) {
  const { send } = usePost('/api/auth/sign-out');
  return (
    <button className="btn btn--sm btn--ghost" type="button" onClick={() => send({})} data-testid="sign-out">
      {children}
    </button>
  );
}
