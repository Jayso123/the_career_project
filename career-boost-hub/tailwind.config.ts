import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

// Derived from the live site's compiled CSS (.superpowers/ref/site.css)
const hsl = (v: string) => `hsl(var(--${v}))`
const pair = (v: string) => ({ DEFAULT: hsl(v), foreground: hsl(`${v}-foreground`) })

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: hsl('border'),
        input: hsl('input'),
        ring: hsl('ring'),
        background: hsl('background'),
        foreground: hsl('foreground'),
        primary: pair('primary'),
        secondary: pair('secondary'),
        destructive: pair('destructive'),
        muted: pair('muted'),
        accent: pair('accent'),
        highlight: pair('highlight'),
        popover: pair('popover'),
        card: pair('card'),
        sidebar: {
          DEFAULT: hsl('sidebar-background'),
          foreground: hsl('sidebar-foreground'),
          primary: hsl('sidebar-primary'),
          'primary-foreground': hsl('sidebar-primary-foreground'),
          accent: hsl('sidebar-accent'),
          'accent-foreground': hsl('sidebar-accent-foreground'),
          border: hsl('sidebar-border'),
          ring: hsl('sidebar-ring'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config
