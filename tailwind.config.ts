import type {Config} from 'tailwindcss';

export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                bg: 'hsl(var(--bg) / <alpha-value>)',
                surface: 'hsl(var(--surface) / <alpha-value>)',
                'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
                border: 'hsl(var(--border) / <alpha-value>)',
                text: 'hsl(var(--text) / <alpha-value>)',
                muted: 'hsl(var(--muted) / <alpha-value>)',
                primary: 'hsl(var(--primary) / <alpha-value>)',
                positive: 'hsl(var(--positive) / <alpha-value>)',
                negative: 'hsl(var(--negative) / <alpha-value>)',
                warning: 'hsl(var(--warning) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['Vazirmatn', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
            },
            boxShadow: {
                card: '0 6px 24px -10px rgba(15, 23, 42, 0.18)',
                glow: '0 0 0 1px rgba(16, 185, 129, 0.08), 0 8px 24px -12px rgba(16, 185, 129, 0.45)',
            },
            keyframes: {
                'toast-in': {
                    '0%': {opacity: '0', transform: 'translateY(18px) scale(0.96)'},
                    '100%': {opacity: '1', transform: 'translateY(0) scale(1)'},
                },
                'success-pop': {
                    '0%': {opacity: '0', transform: 'scale(0.82)'},
                    '65%': {transform: 'scale(1.04)'},
                    '100%': {opacity: '1', transform: 'scale(1)'},
                },
                'success-check': {
                    '0%': {opacity: '0', transform: 'scale(0.4)'},
                    '70%': {transform: 'scale(1.12)'},
                    '100%': {opacity: '1', transform: 'scale(1)'},
                },
            },
            animation: {
                'toast-in': 'toast-in 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
                'success-pop': 'success-pop 0.48s cubic-bezier(0.22, 1, 0.36, 1)',
                'success-check': 'success-check 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both',
            },
        },
    },
    plugins: [],
} satisfies Config;
