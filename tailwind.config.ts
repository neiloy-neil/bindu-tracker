import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        // Brand tokens
        brand: {
          DEFAULT: '#0B132B', // Deep Ink/Navy
          mid:     '#1C2541', // Secondary Navy
          dim:     '#3A506B', // Lighter Navy
          light:   '#5BC0BE', // Electric accent
          slate:   '#EAEAEA', // Off-white/slate
        },
        status: {
          success: '#10B981', // Refined Emerald
          warning: '#F59E0B', // Refined Amber
          error:   '#EF4444', // Refined Red
          info:    '#3B82F6', // Refined Blue
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0,0,0,0.03)',
        'sm': '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.03)',
        'card': '0 2px 8px -2px rgba(11, 19, 43, 0.08), 0 1px 4px -2px rgba(11, 19, 43, 0.04)',
        'card-hover': '0 8px 16px -4px rgba(11, 19, 43, 0.12), 0 4px 8px -4px rgba(11, 19, 43, 0.08)',
        'elevation': '0 12px 24px -8px rgba(11, 19, 43, 0.15), 0 8px 12px -6px rgba(11, 19, 43, 0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-up': 'fade-up 0.3s ease-out',
        'count': 'count 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
