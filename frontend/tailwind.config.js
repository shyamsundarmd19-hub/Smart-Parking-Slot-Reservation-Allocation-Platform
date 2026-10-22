/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        peach: {
          50: '#fff9f5',
          100: '#ffede3',
          200: '#ffd8c2',
          300: '#ffbc96',
          400: '#ff9464',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(249, 115, 22, 0.12)',
        'warm-lg': '0 10px 25px -3px rgba(249, 115, 22, 0.18)',
      },
    },
  },
  plugins: [],
}
