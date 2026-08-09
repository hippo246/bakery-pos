/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cafe-bg': '#18181B',
        'cafe-card': '#27272A',
        'cafe-border': '#3F3F46',
        'cafe-emerald': '#22C55E',
        'cafe-amber': '#F59E0B',
        'cafe-blue': '#3B82F6',
        'cafe-violet': '#8B5CF6',
        'cafe-red': '#EF4444',
      },
    },
  },
  plugins: [],
}
