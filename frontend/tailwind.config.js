/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#171717',
          hover: '#262626',
          text: '#ededed',
          dim: '#a3a3a3',
        },
        surface: '#fafaf8',
        'surface-warm': '#f7f6f3',
        user: '#e5e3df',
        assistant: '#ffffff',
        accent: '#c45c26',
        'accent-hover': '#a84d1f',
      },
      boxShadow: {
        'message': '0 1px 2px rgba(0,0,0,0.04)',
        'message-assistant': '0 1px 3px rgba(0,0,0,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'typing': 'typing 1.4s ease-in-out infinite both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
}
