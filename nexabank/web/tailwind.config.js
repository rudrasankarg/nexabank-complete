/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-clash)', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#e8edf5', 100: '#c5d0e6', 200: '#9fb0d3', 300: '#7890bf',
          400: '#5c77b0', 500: '#3f5da1', 600: '#2d4a8e', 700: '#1e3575',
          800: '#112259', 900: '#060f2e', 950: '#020817',
        },
        gold: {
          50: '#fdf8ed', 100: '#faeec9', 200: '#f6df93', 300: '#f1c94d',
          400: '#ecb422', 500: '#d49a10', 600: '#a87610', 700: '#7e5511',
          800: '#6a4715', 900: '#5a3b17',
        },
        emerald: {
          400: '#34d399', 500: '#10b981', 600: '#059669',
        },
        brand: {
          50: '#e8edf5', 100: '#c5d0e6', 200: '#9fb0d3', 300: '#7890bf',
          400: '#5c77b0', 500: '#3f5da1', 600: '#2d4a8e', 700: '#1e3575',
          800: '#112259', 900: '#060f2e', 950: '#020817',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 20% 50%, rgba(30,53,117,0.6) 0, transparent 50%), radial-gradient(at 80% 20%, rgba(6,15,46,0.8) 0, transparent 50%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      boxShadow: {
        'card': '0 4px 24px -4px rgba(6,15,46,0.4)',
        'card-hover': '0 8px 40px -4px rgba(6,15,46,0.6)',
        'glow-gold': '0 0 30px rgba(212,154,16,0.25)',
        'glow-blue': '0 0 30px rgba(30,53,117,0.4)',
        'inner-glow': 'inset 0 0 30px rgba(30,53,117,0.2)',
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};
