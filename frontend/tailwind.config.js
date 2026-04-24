/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
