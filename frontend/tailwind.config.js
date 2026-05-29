/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        surface: {
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
          3: 'var(--color-surface-3)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        info: 'var(--color-info)',
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: '48px', fontWeight: 'var(--font-display)' }],
        h1: ['var(--text-h1)', { lineHeight: '36px', fontWeight: 'var(--font-h1)' }],
        h2: ['var(--text-h2)', { lineHeight: '28px', fontWeight: 'var(--font-h2)' }],
        h3: ['var(--text-h3)', { lineHeight: '24px', fontWeight: 'var(--font-h3)' }],
        body: ['var(--text-body)', { lineHeight: '24px', fontWeight: 'var(--font-body)' }],
        caption: ['var(--text-caption)', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: 'var(--font-caption)' }],
      },
      spacing: {
        1: 'var(--spacing-1)',
        2: 'var(--spacing-2)',
        3: 'var(--spacing-3)',
        4: 'var(--spacing-4)',
        6: 'var(--spacing-6)',
        8: 'var(--spacing-8)',
        12: 'var(--spacing-12)',
        card: 'var(--spacing-card)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-md)',
        '2xl': 'var(--radius-md)',
        '3xl': 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      maxWidth: {
        '10xl': '112rem',
      },
      boxShadow: {
        panel: '0 38px 110px -56px rgba(2, 6, 23, 0.92), 0 22px 44px -26px rgba(15, 23, 42, 0.82)',
      },
    },
  },
  plugins: [],
}
