// ElectroHub Typography Tokens
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';

// Font configurations (used in layout.tsx)
export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Type scale (rem)
export const fontSize = {
  '2xs':  ['0.625rem',  { lineHeight: '0.875rem', letterSpacing: '0.025em' }],
  xs:     ['0.75rem',   { lineHeight: '1rem',     letterSpacing: '0.015em' }],
  sm:     ['0.875rem',  { lineHeight: '1.25rem',  letterSpacing: '0.01em'  }],
  base:   ['1rem',      { lineHeight: '1.5rem',   letterSpacing: '0'       }],
  lg:     ['1.125rem',  { lineHeight: '1.75rem',  letterSpacing: '-0.005em'}],
  xl:     ['1.25rem',   { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }],
  '2xl':  ['1.5rem',    { lineHeight: '2rem',     letterSpacing: '-0.015em'}],
  '3xl':  ['1.875rem',  { lineHeight: '2.25rem',  letterSpacing: '-0.02em' }],
  '4xl':  ['2.25rem',   { lineHeight: '2.5rem',   letterSpacing: '-0.025em'}],
  '5xl':  ['3rem',      { lineHeight: '3.25rem',  letterSpacing: '-0.03em' }],
  '6xl':  ['3.75rem',   { lineHeight: '4rem',     letterSpacing: '-0.035em'}],
  '7xl':  ['4.5rem',    { lineHeight: '4.75rem',  letterSpacing: '-0.04em' }],
} as const;

// Font weights
export const fontWeight = {
  thin:       '100',
  extralight: '200',
  light:      '300',
  regular:    '400',
  medium:     '500',
  semibold:   '600',
  bold:       '700',
  extrabold:  '800',
  black:      '900',
} as const;

// Font families (CSS variable references)
export const fontFamily = {
  sans:    'var(--font-sans), system-ui, sans-serif',
  mono:    'var(--font-mono), "Courier New", monospace',
  display: 'var(--font-display), var(--font-sans), system-ui, sans-serif',
} as const;

// Letter spacing presets
export const letterSpacing = {
  tighter: '-0.04em',
  tight:   '-0.02em',
  normal:  '0em',
  wide:    '0.025em',
  wider:   '0.05em',
  widest:  '0.1em',
} as const;

// Line heights
export const lineHeight = {
  none:     '1',
  tight:    '1.25',
  snug:     '1.375',
  normal:   '1.5',
  relaxed:  '1.625',
  loose:    '2',
} as const;

// Semantic text styles
export const textStyles = {
  displayLarge:  { fontFamily: 'display', size: '5xl',  weight: 'bold',     tracking: 'tight'   },
  displayMedium: { fontFamily: 'display', size: '4xl',  weight: 'bold',     tracking: 'tight'   },
  displaySmall:  { fontFamily: 'display', size: '3xl',  weight: 'semibold', tracking: 'tight'   },
  headingLarge:  { fontFamily: 'sans',    size: '2xl',  weight: 'semibold', tracking: 'tight'   },
  headingMedium: { fontFamily: 'sans',    size: 'xl',   weight: 'semibold', tracking: 'normal'  },
  headingSmall:  { fontFamily: 'sans',    size: 'lg',   weight: 'semibold', tracking: 'normal'  },
  bodyLarge:     { fontFamily: 'sans',    size: 'lg',   weight: 'regular',  tracking: 'normal'  },
  bodyMedium:    { fontFamily: 'sans',    size: 'base', weight: 'regular',  tracking: 'normal'  },
  bodySmall:     { fontFamily: 'sans',    size: 'sm',   weight: 'regular',  tracking: 'normal'  },
  labelLarge:    { fontFamily: 'sans',    size: 'sm',   weight: 'medium',   tracking: 'wide'    },
  labelMedium:   { fontFamily: 'sans',    size: 'xs',   weight: 'medium',   tracking: 'wide'    },
  labelSmall:    { fontFamily: 'sans',    size: '2xs',  weight: 'semibold', tracking: 'widest'  },
  codeLarge:     { fontFamily: 'mono',    size: 'base', weight: 'regular',  tracking: 'normal'  },
  codeSmall:     { fontFamily: 'mono',    size: 'sm',   weight: 'regular',  tracking: 'normal'  },
  price:         { fontFamily: 'display', size: '2xl',  weight: 'bold',     tracking: 'tight'   },
  priceLarge:    { fontFamily: 'display', size: '3xl',  weight: 'bold',     tracking: 'tight'   },
} as const;
