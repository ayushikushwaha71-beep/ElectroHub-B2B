// ElectroHub Spacing Tokens
// 4px base grid system

// Base unit: 4px
const BASE = 4;
const px = (n: number) => `${n * BASE}px`;

export const spacing = {
  px:    '1px',
  0:     '0px',
  0.5:   px(0.5),   // 2px
  1:     px(1),     // 4px
  1.5:   px(1.5),   // 6px
  2:     px(2),     // 8px
  2.5:   px(2.5),   // 10px
  3:     px(3),     // 12px
  3.5:   px(3.5),   // 14px
  4:     px(4),     // 16px
  5:     px(5),     // 20px
  6:     px(6),     // 24px
  7:     px(7),     // 28px
  8:     px(8),     // 32px
  9:     px(9),     // 36px
  10:    px(10),    // 40px
  11:    px(11),    // 44px
  12:    px(12),    // 48px
  14:    px(14),    // 56px
  16:    px(16),    // 64px
  18:    px(18),    // 72px
  20:    px(20),    // 80px
  24:    px(24),    // 96px
  28:    px(28),    // 112px
  32:    px(32),    // 128px
  36:    px(36),    // 144px
  40:    px(40),    // 160px
  44:    px(44),    // 176px
  48:    px(48),    // 192px
  52:    px(52),    // 208px
  56:    px(56),    // 224px
  60:    px(60),    // 240px
  64:    px(64),    // 256px
  72:    px(72),    // 288px
  80:    px(80),    // 320px
  96:    px(96),    // 384px
} as const;

// Semantic spacing for components
export const componentSpacing = {
  // Padding
  buttonSm:     { x: spacing[3],  y: spacing[1.5] },
  buttonMd:     { x: spacing[4],  y: spacing[2]   },
  buttonLg:     { x: spacing[6],  y: spacing[3]   },
  buttonXl:     { x: spacing[8],  y: spacing[4]   },

  inputSm:      { x: spacing[3],  y: spacing[1.5] },
  inputMd:      { x: spacing[4],  y: spacing[2.5] },
  inputLg:      { x: spacing[4],  y: spacing[3]   },

  cardSm:       { x: spacing[4],  y: spacing[4]   },
  cardMd:       { x: spacing[6],  y: spacing[6]   },
  cardLg:       { x: spacing[8],  y: spacing[8]   },

  sectionSm:    { y: spacing[12] },
  sectionMd:    { y: spacing[16] },
  sectionLg:    { y: spacing[24] },

  // Gap
  gapXs:  spacing[2],
  gapSm:  spacing[3],
  gapMd:  spacing[4],
  gapLg:  spacing[6],
  gapXl:  spacing[8],
  gap2xl: spacing[12],

  // Container
  containerPadding: {
    mobile:  spacing[4],
    tablet:  spacing[6],
    desktop: spacing[8],
    wide:    spacing[12],
  },
} as const;
