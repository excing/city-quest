/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A2332',
        'ink-secondary': '#5C6570',
        'ink-muted': '#8B939E',
        paper: '#F5F7F6',
        surface: '#FFFFFF',
        line: '#E2E6EA',
        fill: '#E8EEF2',
        primary: {
          DEFAULT: '#2B4C7E',
          pressed: '#1F3A63',
          soft: '#E7EEF6',
        },
        danger: {
          DEFAULT: '#C23B3B',
          soft: '#FCECEC',
        },
      },
    },
  },
  plugins: [],
}
