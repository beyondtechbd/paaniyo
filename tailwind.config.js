/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4fa',
          100: '#cce9f5',
          200: '#99d3eb',
          300: '#66bde1',
          400: '#33a7d7',
          500: '#0091cd',
          600: '#0074a4',
          700: '#00577b',
          800: '#003a52',
          900: '#001d29',
        },
        secondary: {
          50: '#e6faf8',
          100: '#b3f0e9',
          200: '#80e6da',
          300: '#4ddccb',
          400: '#26d4bf',
          500: '#00c9b0',
          600: '#00a18d',
          700: '#00796a',
          800: '#005147',
          900: '#002923',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
