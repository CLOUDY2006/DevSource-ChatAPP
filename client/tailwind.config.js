/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Ultramarine accent used for buttons, sent bubbles, focus rings
        brand: {
          50: '#eef1ff',
          100: '#dfe5ff',
          200: '#c3ccff',
          400: '#7b8cff',
          500: '#5566f0',
          600: '#4152dc',
          700: '#3541b8',
        },
      },
      keyframes: {
        dot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-3px)', opacity: '1' },
        },
      },
      animation: { dot: 'dot 1.2s infinite ease-in-out' },
    },
  },
  plugins: [],
};
