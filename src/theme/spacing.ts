// GigOS Spacing & Layout Tokens — 4px base grid

export const Space = {
  s0: 0,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
  s20: 80,
} as const;

export const Layout = {
  screenGutter: 20,
  cardGap: 16,
  stackGap: 12,
  inlineGap: 8,
} as const;

export const ControlHeight = {
  sm: 36,
  md: 44,
  lg: 52,
  tabBar: 64,
  fab: 58,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
