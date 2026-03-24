/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Forvis Mazars Red — couleur primaire
        brand: {
          50:  '#fdf3f4',
          100: '#fce8ea',
          200: '#f8c5cb',
          300: '#f3929d',
          400: '#ec5568',
          500: '#e12340',
          600: '#C8102E', // FM Red primary
          700: '#aa0e27',
          800: '#8e0f23',
          900: '#7a1021',
          950: '#43050f',
        },
        // Forvis Mazars Navy — sidebar & accents sombres
        navy: {
          700: '#243454',
          800: '#1C2B4A', // FM Navy
          900: '#162240',
          950: '#0e1729',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
