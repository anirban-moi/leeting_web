/** @type {import('tailwindcss').Config} */
export default {
  content: ['./entrypoints/**/*.{html,js,jsx}'],
  theme: {
    extend: {
      colors: {
        leetcode: {
          orange: '#ffa116',
          dark: '#1a1a1a',
          card: '#262626',
          border: '#383838',
          easy: '#00b8a3',
          medium: '#ffc01e',
          hard: '#ff375f'
        }
      }
    },
  },
  plugins: [],
};
