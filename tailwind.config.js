/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
  extend: {
    colors: {
      metildaRed: '#d46a6a',
      metildaDarkRed: '#b55656',
      metildaGold: '#d4af37',
      metildaText: '#6b2020',
      metildaHeading: '#a12222',
      metildaBg: '#fffaf8',
    },
    fontFamily: {
      // Modern, clean default
      sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "Noto Sans", "Liberation Sans", "sans-serif"],
    },
    boxShadow: {
      soft: "0 10px 30px rgba(161,34,34,0.10)",
    },
  },
},
  plugins: [],
}
