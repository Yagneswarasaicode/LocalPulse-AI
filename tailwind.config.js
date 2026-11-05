/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4FA',
          100: '#E1E9F4',
          200: '#C2D3EA',
          300: '#94B2DA',
          400: '#5F8DC2',
          500: '#3A6BA3',
          600: '#285184',
          700: '#1D3B62',
          800: '#142947',
          900: '#10213A', // Primary Deep Navy
          950: '#0A1526',
        },
        emerald: {
          50: '#EDFCF8',
          100: '#D2F8EE',
          200: '#ABF0DC',
          300: '#75E2C4',
          400: '#3CCBA8',
          500: '#008F80', // Primary Emerald
          600: '#007A6E',
          700: '#006159',
          800: '#024C46',
          900: '#043E3A',
        },
        surface: {
          bg: '#F7F9FC', // Light Background
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(16, 33, 58, 0.05), 0 1px 2px -1px rgba(16, 33, 58, 0.05)',
        'card': '0 4px 6px -1px rgba(16, 33, 58, 0.06), 0 2px 4px -2px rgba(16, 33, 58, 0.06)',
        'elevated': '0 10px 15px -3px rgba(16, 33, 58, 0.08), 0 4px 6px -4px rgba(16, 33, 58, 0.05)',
      }
    },
  },
  plugins: [],
}
