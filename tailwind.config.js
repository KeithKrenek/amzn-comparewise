/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007BFF',
          50: '#E6F0FF',
          100: '#CCE0FF',
          200: '#99C2FF',
          300: '#66A3FF',
          400: '#3385FF',
          500: '#007BFF',
          600: '#0062CC',
          700: '#004A99',
          800: '#003166',
          900: '#001933',
        },
        secondary: {
          DEFAULT: '#00C8A2',
          50: '#E6FAF6',
          100: '#CCF5ED',
          200: '#99EBDB',
          300: '#66E0C9',
          400: '#33D6B7',
          500: '#00C8A2',
          600: '#00A082',
          700: '#007861',
          800: '#005041',
          900: '#002820',
        },
      },
    },
  },
  plugins: [],
};