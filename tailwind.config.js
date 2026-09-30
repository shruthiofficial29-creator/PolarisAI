/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a1628', 800: '#0f2038', 700: '#1e3a5f' },
        accent: '#22d3ee'
      }
    }
  },
  plugins: []
};
