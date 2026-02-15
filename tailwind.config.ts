import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 2px 10px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
