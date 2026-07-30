/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#e6f7ff',
          100: '#b3ecff',
          200: '#80e0ff',
          300: '#4dd4ff',
          400: '#1ac8ff',
          500: '#00b8e6',
          600: '#0099bf',
          700: '#007a99',
          800: '#005c73',
          900: '#003d4d',
        },
        navy: {
          50: '#eef2f7',
          100: '#d4dde9',
          200: '#a9bcd3',
          300: '#7e9bbd',
          400: '#4f6f95',
          500: '#2c4a6e',
          600: '#1f3a5a',
          700: '#162b45',
          800: '#0f1f33',
          900: '#0a1626',
          950: '#050d1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
