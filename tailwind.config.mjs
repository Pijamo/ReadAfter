/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9ee',
          100: '#fdf0d3',
          200: '#faddA5',
          300: '#f6c46d',
          400: '#f2a633',
          500: '#ef8e0e',
          600: '#d97209',
          700: '#b4560a',
          800: '#92440f',
          900: '#783910',
        },
      },
    },
  },
  plugins: [],
};
