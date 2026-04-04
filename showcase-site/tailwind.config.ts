import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'noir-black': '#000000',
        'noir-near-black': '#0A0A0A',
        'noir-charcoal': '#1A1A1A',
        'noir-platinum': '#C0C0C0',
        'noir-silver': '#E5E5E5',
        'noir-white': '#FFFFFF',
        'gold-base': '#B8860B',
        'gold-light': '#D4A017',
        'gold-dark': '#8B6914',
        'gold-dim': '#6B4E0A',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'implode': 'implode 0.3s ease-in forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        implode: {
          to: {
            transform: 'scale(0)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
