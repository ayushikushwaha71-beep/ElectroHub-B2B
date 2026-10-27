// ElectroHub Shadow Tokens

export const shadows = {
  none: 'none',

  // Standard elevation shadows
  xs:   '0 1px 2px 0 rgba(0,0,0,0.05)',
  sm:   '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  md:   '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg:   '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl:   '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  '2xl':'0 25px 50px -12px rgba(0,0,0,0.25)',
  inner:'inset 0 2px 4px 0 rgba(0,0,0,0.06)',

  // Glow / neon variants
  glowPrimary:  '0 0 20px rgba(59,130,246,0.35), 0 0 40px rgba(59,130,246,0.15)',
  glowAccent:   '0 0 20px rgba(245,158,11,0.35), 0 0 40px rgba(245,158,11,0.15)',
  glowSuccess:  '0 0 20px rgba(16,185,129,0.35)',
  glowDanger:   '0 0 20px rgba(244,63,94,0.35)',
  glowElectric: '0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.15)',

  // Dark-mode optimized (uses dark bg)
  darkSm:  '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
  darkMd:  '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.4)',
  darkLg:  '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.5)',
  darkXl:  '0 20px 25px -5px rgba(0,0,0,0.6), 0 8px 10px -6px rgba(0,0,0,0.6)',

  // Product card hover
  cardHover:  '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  cardHoverDark: '0 8px 30px rgba(0,0,0,0.5), 0 2px 8px rgba(59,130,246,0.1)',

  // Glass morphism
  glass: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
  glassDark: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
} as const;

export type ShadowToken = keyof typeof shadows;
