/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plug: {
          dark: '#0a0d14',
          card: '#121826',
          border: '#1f293d',
          accent: '#00ff88',
          accentHover: '#00cc6a',
          secondary: '#6366f1',
          gold: '#f59e0b',
          muted: '#8e9bb0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
