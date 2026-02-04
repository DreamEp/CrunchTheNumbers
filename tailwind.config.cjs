/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha
        base: '#1e1e2e',
        surface: '#313244',
        overlay: '#45475a',
        text: '#cdd6f4',
        subtext: '#a6adc8',
        muted: '#6c7086',
        accent: '#94e2d5',
        accentMuted: 'rgba(148, 226, 213, 0.15)',
        red: '#f38ba8',
        peach: '#fab387',
        yellow: '#f9e2af',
        green: '#a6e3a1',
        border: '#45475a',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'pulse-alert': 'pulse-alert 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-alert': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
