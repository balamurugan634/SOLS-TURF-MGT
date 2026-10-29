/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#064E3B',
          primary: '#166534',
          accent: '#22c55e',
          light: '#F8FAFC',
          card: '#FFFFFF',
          text: '#111827',
          border: '#E5E7EB',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
        'green-glow': '0 10px 25px -5px rgba(34, 197, 94, 0.3)',
      }
    },
  },
  plugins: [],
}
