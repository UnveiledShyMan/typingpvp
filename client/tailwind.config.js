/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary, #0a0e1a)', // Deep dark background with slight blue tint
        'bg-secondary': 'var(--bg-secondary, #131825)', // Slightly lighter dark background
        'bg-tertiary': 'var(--bg-tertiary, #1a1f2e)', // Even lighter dark background for hover states
        'bg-card': 'var(--bg-card, #151a27)', // Card background
        'text-primary': 'var(--text-primary, #e8ecf3)', // Light text with subtle blue tint
        'text-secondary': 'var(--text-secondary, #9ca3b8)', // Muted text for secondary info
        'text-muted': 'var(--text-muted, #6b7280)', // More muted text
        'accent-primary': 'var(--accent-primary, #8b5cf6)', // Vibrant purple/violet accent
        'accent-hover': 'var(--accent-hover, #a78bfa)', // Lighter purple for hover
        'accent-text': 'var(--accent-text, #ffffff)', // Text color on accent buttons
        'accent-secondary': 'var(--accent-secondary, #06b6d4)', // Cyan accent for variety
        'accent-glow': 'var(--accent-glow, #8b5cf6)', // Glow color
        'correct-char': 'var(--correct-char, #10b981)', // Vibrant emerald green for correct characters
        'incorrect-char': 'var(--incorrect-char, #f472b6)', // Pink/magenta for incorrect characters
        'text-error': 'var(--text-error, #f472b6)', // Pink for errors
        'current-char-bg': 'var(--current-char-bg, #fbbf24)', // Warm amber/yellow background for current character
        'current-char-text': 'var(--current-char-text, #0a0e1a)', // Dark text for current character
        'border-primary': 'var(--border-primary, rgba(139, 92, 246, 0.2))', // Purple border
        'border-secondary': 'var(--border-secondary, rgba(156, 163, 184, 0.1))', // Subtle border
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
