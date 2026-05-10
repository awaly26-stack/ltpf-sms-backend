/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },

      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },

        'glow-pulse': {
          '0%, 100%': {
            opacity: 0.8,
            filter: 'brightness(1)',
          },

          '50%': {
            opacity: 1,
            filter: 'brightness(1.5)',
          },
        },

        'slide-up': {
          '0%': {
            transform: 'translateY(20px)',
            opacity: 0,
          },

          '100%': {
            transform: 'translateY(0)',
            opacity: 1,
          },
        },
      },
    },
  },

  plugins: [],
};