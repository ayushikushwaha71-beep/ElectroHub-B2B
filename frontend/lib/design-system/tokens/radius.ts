// ElectroHub Border Radius Tokens

export const radius = {
  none:  '0px',
  xs:    '2px',
  sm:    '4px',
  md:    '6px',
  lg:    '8px',
  xl:    '12px',
  '2xl': '16px',
  '3xl': '20px',
  '4xl': '24px',
  full:  '9999px',
} as const;

// Semantic radius
export const componentRadius = {
  button:     radius.lg,
  buttonPill: radius.full,
  input:      radius.lg,
  card:       radius.xl,
  cardLg:     radius['2xl'],
  badge:      radius.full,
  badgeSquare:radius.sm,
  dialog:     radius['2xl'],
  drawer:     radius['2xl'],
  tooltip:    radius.md,
  avatar:     radius.full,
  avatarSq:   radius.lg,
  tag:        radius.md,
  image:      radius.xl,
  imageLg:    radius['2xl'],
  chip:       radius.full,
} as const;

export type RadiusToken = keyof typeof radius;
