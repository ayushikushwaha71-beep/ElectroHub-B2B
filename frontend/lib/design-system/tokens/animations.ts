// ElectroHub Animation Tokens
// Framer Motion presets + CSS transition values

// ─── Duration ─────────────────────────────────────────────────────────────────
export const duration = {
  instant:  0,
  fastest:  0.1,
  faster:   0.15,
  fast:     0.2,
  normal:   0.3,
  slow:     0.4,
  slower:   0.5,
  slowest:  0.7,
  // CSS values
  css: {
    fastest: '100ms',
    faster:  '150ms',
    fast:    '200ms',
    normal:  '300ms',
    slow:    '400ms',
    slower:  '500ms',
  },
} as const;

// ─── Easing ───────────────────────────────────────────────────────────────────
export const easing = {
  // Framer Motion
  linear:       [0, 0, 1, 1] as [number,number,number,number],
  ease:         [0.25, 0.1, 0.25, 1] as [number,number,number,number],
  easeIn:       [0.4, 0, 1, 1] as [number,number,number,number],
  easeOut:      [0, 0, 0.2, 1] as [number,number,number,number],
  easeInOut:    [0.4, 0, 0.2, 1] as [number,number,number,number],
  spring:       { type: 'spring' as const, stiffness: 300, damping: 30 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 20 },
  springStiff:  { type: 'spring' as const, stiffness: 600, damping: 40 },
  // CSS values
  css: {
    linear:    'linear',
    ease:      'ease',
    easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
    easeOut:   'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ─── Framer Motion Variants ───────────────────────────────────────────────────
export const variants = {
  // Fade
  fadeIn: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: duration.normal, ease: easing.easeOut } },
    exit:    { opacity: 0, transition: { duration: duration.fast,   ease: easing.easeIn  } },
  },

  // Slide up (cards, list items)
  slideUp: {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
    exit:    { opacity: 0, y: -10, transition: { duration: duration.fast } },
  },

  // Slide down (dropdowns, toasts)
  slideDown: {
    hidden:  { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.easeOut } },
    exit:    { opacity: 0, y: -10, transition: { duration: duration.faster } },
  },

  // Scale (modals, dialogs)
  scale: {
    hidden:  { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: duration.normal, ease: easing.easeOut } },
    exit:    { opacity: 0, scale: 0.95, transition: { duration: duration.fast } },
  },

  // Scale bounce (buttons, badges)
  scaleBounce: {
    hidden:  { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: easing.springBouncy },
    exit:    { opacity: 0, scale: 0.8, transition: { duration: duration.fast } },
  },

  // Slide from right (drawer)
  slideRight: {
    hidden:  { opacity: 0, x: '100%' },
    visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
    exit:    { opacity: 0, x: '100%', transition: { duration: duration.fast, ease: easing.easeIn } },
  },

  // Slide from left (drawer)
  slideLeft: {
    hidden:  { opacity: 0, x: '-100%' },
    visible: { opacity: 1, x: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
    exit:    { opacity: 0, x: '-100%', transition: { duration: duration.fast, ease: easing.easeIn } },
  },

  // Slide from bottom (mobile sheet)
  slideBottom: {
    hidden:  { opacity: 0, y: '100%' },
    visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
    exit:    { opacity: 0, y: '100%', transition: { duration: duration.fast, ease: easing.easeIn } },
  },

  // Stagger container
  staggerContainer: {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  },

  // Stagger item
  staggerItem: {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.easeOut } },
  },

  // Overlay backdrop
  overlay: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: duration.normal } },
    exit:    { opacity: 0, transition: { duration: duration.fast } },
  },
} as const;

// ─── CSS Keyframe references (used in globals.css) ────────────────────────────
export const keyframes = {
  shimmer:     'shimmer 2s linear infinite',
  pulse:       'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  spin:        'spin 1s linear infinite',
  bounce:      'bounce 1s infinite',
  ping:        'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  float:       'float 3s ease-in-out infinite',
  gradientX:   'gradient-x 3s ease infinite',
  heartbeat:   'heartbeat 0.6s ease-in-out',
} as const;
