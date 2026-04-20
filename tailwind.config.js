/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Core surfaces — deep, warm low-light bar palette
          dark: '#0A0A0C',          // page background
          card: '#14141A',          // base card
          elevated: '#1C1C24',      // elevated card / modal
          border: 'rgba(255,255,255,0.08)',

          // Accents
          purple: '#8B5CF6',        // primary
          'purple-light': '#B794F6',
          'purple-deep': '#5B21B6',
          gold: '#F5B82E',          // warm bar glow
          'gold-deep': '#B7791F',
          amber: '#FBBF24',
          orange: '#F97066',        // owe / negative
          green: '#10B981',         // settle / positive
          'green-light': '#34D399',
          yellow: '#F5B82E',
          coral: '#FB7185',
        },
        ink: {
          50: '#FAFAFA',
          100: '#E5E5EA',
          200: '#C7C7CC',
          300: '#8E8E93',
          400: '#6B6B73',
          500: '#52525B',
          600: '#3A3A41',
          700: '#27272E',
          800: '#1C1C24',
          900: '#0A0A0C',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'Segoe UI', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 40px -8px rgba(139, 92, 246, 0.5)',
        'glow-gold': '0 0 48px -10px rgba(245, 184, 46, 0.45)',
        'glow-green': '0 0 32px -8px rgba(16, 185, 129, 0.45)',
        'card': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 40px -12px rgba(0,0,0,0.6)',
        'card-hover': '0 1px 0 0 rgba(255,255,255,0.08) inset, 0 18px 60px -16px rgba(139, 92, 246, 0.25)',
        'pill': '0 10px 40px -12px rgba(0,0,0,0.7), 0 1px 0 0 rgba(255,255,255,0.06) inset',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at var(--x,50%) var(--y,0%), var(--tw-gradient-stops))',
        'surface': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'surface-warm': 'linear-gradient(180deg, rgba(245,184,46,0.06) 0%, rgba(139,92,246,0.02) 100%)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
