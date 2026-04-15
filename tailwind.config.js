/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jarvis-bg': '#000000',
        'jarvis-cyan': '#00d4ff',
        'jarvis-teal': '#00ff88',
        'jarvis-blue': '#0084ff',
        'jarvis-dark': '#001026',
      },
      fontFamily: {
        'share': ['"Share Tech Mono"', 'monospace'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 212, 255, 0.4)',
        'teal-glow': '0 0 15px rgba(0, 255, 136, 0.4)',
      },
      dropShadow: {
        'cyan': '0 0 10px rgba(0, 212, 255, 0.8)',
        'teal': '0 0 10px rgba(0, 255, 136, 0.8)',
      },
      animation: {
        'scanline': 'scanline 10s linear infinite',
        'scanning': 'scanning 3s ease-in-out infinite',
        'scanHoriz': 'scanHoriz 4s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { top: '-100%' },
          '100%': { top: '100%' },
        },
        scanning: {
          '0%': { transform: 'translateX(-100%)', width: '20%' },
          '50%': { transform: 'translateX(400%)', width: '40%' },
          '100%': { transform: 'translateX(-100%)', width: '20%' },
        },
        scanHoriz: {
          '0%': { width: '0', left: '0', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { width: '100%', left: '0', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
