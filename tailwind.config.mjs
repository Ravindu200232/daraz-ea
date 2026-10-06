/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    // The design contract owns these custom properties in app/globals.css; reading them here is
    // what makes a Tailwind class and a ported token the same decision. The prototype's spacing
    // scale, radii and type sizes are exposed so no page re-derives its own numbers.
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-700': 'var(--color-primary-700)',
        'primary-800': 'var(--color-primary-800)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-3': 'var(--color-surface-3)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        'line-strong': 'var(--color-line-strong)',
        ok: 'var(--color-ok)',
        warn: 'var(--color-warn)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
        background: 'var(--background)',
        foreground: 'var(--text)',
        border: 'var(--border)',
        'primary-foreground': 'var(--on-primary)',
      },
      borderColor: { DEFAULT: 'var(--color-line)' },
      spacing: {
        1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)', 4: 'var(--space-4)',
        5: 'var(--space-5)', 6: 'var(--space-6)', 7: 'var(--space-7)', 8: 'var(--space-8)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)', DEFAULT: 'var(--radius)', lg: 'var(--radius-lg)',
        xl: 'var(--radius)', pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)', DEFAULT: 'var(--shadow)', lg: 'var(--shadow-lg)',
      },
      fontSize: {
        xs: 'var(--fs-xs)', sm: 'var(--fs-sm)', base: 'var(--fs-base)', md: 'var(--fs-md)',
        lg: 'var(--fs-lg)', xl: 'var(--fs-xl)', '2xl': 'var(--fs-2xl)', '3xl': 'var(--fs-3xl)',
        '4xl': 'var(--fs-4xl)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        heading: ['var(--font-heading)'],
        display: ['var(--font-heading)'],
      },
    },
  },
  plugins: [],
};
