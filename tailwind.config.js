/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#1ed760',
        'accent-press': '#1aa34a',
      },
    },
  },
  plugins: [],
};
