/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // Banking light theme
        navy:         '#003087',
        'bank-blue':  '#0072CE',
        'bank-green': '#1A7A4A',
        'bank-red':   '#C0392B',
        'bank-amber': '#B8860B',
        // Dark theme (Login / Landing)
        surface:      '#0f0f13',
        'surface-2':  '#16161d',
        'surface-3':  '#1c1c26',
        // Accent = banking blue
        accent:       '#0072CE',
        'accent-2':   '#60a5fa',
        success:      '#10b981',
        danger:       '#ef4444',
        warning:      '#f59e0b',
      },
      boxShadow: {
        card:      '0 1px 4px rgba(0,0,0,0.08)',
        'card-md': '0 4px 16px rgba(0,0,0,0.10)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-up':       'fadeUp 0.35s ease both',
        'fade-in':       'fadeIn 0.2s ease both',
        'slide-in':      'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slideInLeft 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':       'shimmer 1.5s infinite',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp:      { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:     { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
