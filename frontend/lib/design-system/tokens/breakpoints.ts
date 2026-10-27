// ElectroHub Responsive Breakpoints

export const breakpoints = {
  xs:   '375px',
  sm:   '640px',
  md:   '768px',
  lg:   '1024px',
  xl:   '1280px',
  '2xl':'1440px',
  '3xl':'1920px',
} as const;

// Tailwind-style min-width media queries
export const mediaQueries = {
  xs:   `@media (min-width: 375px)`,
  sm:   `@media (min-width: 640px)`,
  md:   `@media (min-width: 768px)`,
  lg:   `@media (min-width: 1024px)`,
  xl:   `@media (min-width: 1280px)`,
  '2xl':`@media (min-width: 1440px)`,
  '3xl':`@media (min-width: 1920px)`,
} as const;

// Container max-widths per breakpoint
export const containerWidths = {
  sm:   '640px',
  md:   '768px',
  lg:   '1024px',
  xl:   '1280px',
  '2xl':'1440px',
  DEFAULT: '1280px',
} as const;

// Grid column counts per breakpoint
export const gridCols = {
  productGrid: {
    xs:  1,
    sm:  2,
    md:  3,
    lg:  4,
    xl:  5,
    '2xl': 6,
  },
  categoryGrid: {
    xs:  2,
    sm:  3,
    md:  4,
    lg:  6,
    xl:  8,
  },
  brandGrid: {
    xs:  3,
    sm:  4,
    md:  6,
    lg:  8,
  },
} as const;

export type Breakpoint = keyof typeof breakpoints;
