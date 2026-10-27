// ElectroHub Color Tokens
// Premium electric-blue + amber accent palette

export const colors = {
  // ─── Primary: Electric Blue ───────────────────────────────────────────────
  primary: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // ─── Accent: Amber / Orange ───────────────────────────────────────────────
  accent: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // ─── Success: Emerald ─────────────────────────────────────────────────────
  success: {
    50:  '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // ─── Warning: Yellow ──────────────────────────────────────────────────────
  warning: {
    50:  '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },

  // ─── Danger: Red ──────────────────────────────────────────────────────────
  danger: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },

  // ─── Neutral ──────────────────────────────────────────────────────────────
  neutral: {
    0:   '#ffffff',
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
    1000:'#000000',
  },

  // ─── Special ──────────────────────────────────────────────────────────────
  special: {
    electric:   '#00d4ff',   // Neon cyan highlight
    neon:       '#7c3aed',   // Violet accent
    gold:       '#f59e0b',   // Premium gold
    silver:     '#94a3b8',   // Premium silver
    glass:      'rgba(255,255,255,0.08)',
    glassDark:  'rgba(0,0,0,0.4)',
  },
} as const;

// Semantic token map (consumed by CSS variables)
export const semanticColors = {
  light: {
    background:       colors.neutral[50],
    backgroundAlt:    colors.neutral[100],
    backgroundCard:   colors.neutral[0],
    surface:          colors.neutral[0],
    surfaceHover:     colors.neutral[100],
    border:           colors.neutral[200],
    borderStrong:     colors.neutral[300],
    text:             colors.neutral[900],
    textMuted:        colors.neutral[500],
    textSubtle:       colors.neutral[400],
    textInverse:      colors.neutral[0],
    primary:          colors.primary[600],
    primaryHover:     colors.primary[700],
    primaryFore:      colors.neutral[0],
    accent:           colors.accent[500],
    accentHover:      colors.accent[600],
    accentFore:       colors.neutral[0],
    success:          colors.success[600],
    successBg:        colors.success[50],
    warning:          colors.warning[600],
    warningBg:        colors.warning[50],
    danger:           colors.danger[600],
    dangerBg:         colors.danger[50],
    overlay:          'rgba(0,0,0,0.5)',
    shadow:           'rgba(0,0,0,0.08)',
    shadowStrong:     'rgba(0,0,0,0.16)',
    ring:             colors.primary[600],
    skeleton:         colors.neutral[200],
    skeletonHighlight:colors.neutral[100],
  },
  dark: {
    background:       colors.neutral[950],
    backgroundAlt:    colors.neutral[900],
    backgroundCard:   colors.neutral[900],
    surface:          '#1a2235',
    surfaceHover:     '#1e2a3e',
    border:           colors.neutral[800],
    borderStrong:     colors.neutral[700],
    text:             colors.neutral[50],
    textMuted:        colors.neutral[400],
    textSubtle:       colors.neutral[500],
    textInverse:      colors.neutral[900],
    primary:          colors.primary[400],
    primaryHover:     colors.primary[300],
    primaryFore:      colors.neutral[900],
    accent:           colors.accent[400],
    accentHover:      colors.accent[300],
    accentFore:       colors.neutral[900],
    success:          colors.success[400],
    successBg:        'rgba(16,185,129,0.1)',
    warning:          colors.warning[400],
    warningBg:        'rgba(234,179,8,0.1)',
    danger:           colors.danger[400],
    dangerBg:         'rgba(244,63,94,0.1)',
    overlay:          'rgba(0,0,0,0.7)',
    shadow:           'rgba(0,0,0,0.4)',
    shadowStrong:     'rgba(0,0,0,0.6)',
    ring:             colors.primary[400],
    skeleton:         colors.neutral[800],
    skeletonHighlight:colors.neutral[700],
  },
} as const;

export type ColorToken = keyof typeof semanticColors.light;
