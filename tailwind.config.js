/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf6f1',
          100: '#f1e8de',
          200: '#e2d1bf',
          300: '#cdb298',
          400: '#b58f6f',
          500: '#9c7350',
          600: '#825c3e',
          700: '#684833',
          800: '#4e3526',
          900: '#37251a',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf5ec',
          200: '#f3ebdd',
          300: '#eaddcc',
        },
        ink: {
          900: '#2b211a',
          700: '#453729',
          500: '#6b5a4a',
          400: '#8a7a6d',
        },
        leaf: {
          300: '#a3c98a',
          400: '#7fb069',
          500: '#5f9e4d',
          600: '#4a7d3c',
          700: '#3b6330',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Songti SC', 'Noto Serif SC', 'serif'],
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      animation: {
        'fade-slide': 'fade-slide 0.35s ease both',
      },
      keyframes: {
        'fade-slide': {
          from: {
            opacity: '0',
            transform: 'translateY(8px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}
