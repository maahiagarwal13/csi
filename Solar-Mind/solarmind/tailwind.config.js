/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 Inspired Palette for Solar Web App
        primary: '#D97706',         // Amber 600 - Main action color (warm, solar energy)
        'on-primary': '#FFFFFF',
        'primary-container': '#FEF3C7',
        'on-primary-container': '#78350F',
        
        secondary: '#0EA5E9',       // Sky 500 - Secondary accents (clear sky, clean tech)
        'on-secondary': '#FFFFFF',
        
        tertiary: '#10B981',        // Emerald 500 - Eco/savings highlights
        'on-tertiary': '#FFFFFF',
        
        surface: '#FAFAF9',         // Warm off-white
        'on-surface': '#1C1917',
        'on-surface-variant': '#57534E',
        
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F5F5F4',
        'surface-container': '#E7E5E4',
        'surface-container-high': '#D6D3D1',
        'surface-container-highest': '#A8A29E',
        
        outline: '#78716C',
        'outline-variant': '#D6D3D1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
