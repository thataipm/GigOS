// GigOS Color Tokens — Pioneer CDJ-inspired dark palette

export const Colors = {
  // Base neutrals
  black: '#050608',
  graphite900: '#0A0C10', // app background
  graphite850: '#0E1015',
  graphite800: '#14171E', // raised surface
  graphite700: '#1B1F28', // card
  graphite600: '#232834', // input / elevated
  graphite500: '#2E3441', // divider
  graphite400: '#3A414F',
  graphite300: '#545C6B',
  graphite200: '#7B8494',
  graphite100: '#AEB6C2',
  white: '#F4F7FA',

  // Brand accent — electric cyan
  cyanBright: '#34E7FF',
  cyan: '#18C8E6',
  cyanDeep: '#0E9BB5',
  cyanDim: '#0C5C6B',

  // Status raw
  red: '#FF4D5E',
  redDim: '#5C1F26',
  green: '#2EE6A0',
  greenDim: '#14513A',
  amber: '#FFB020',
  amberDim: '#5C3F0E',
  slate: '#6B7280',
  slateDim: '#2A2F38',
  violet: '#A78BFA',
  violetDim: '#322B5C',

  // Semantic surfaces
  surfaceApp: '#0A0C10',
  surfaceRaised: '#14171E',
  surfaceCard: '#1B1F28',
  surfaceInput: '#232834',
  surfaceOverlay: 'rgba(5,6,8,0.72)',

  // Text
  textPrimary: '#F4F7FA',
  textSecondary: '#7B8494',
  textTertiary: '#545C6B',
  textDisabled: '#3A414F',
  textOnAccent: '#04161A',

  // Integrations — WhatsApp
  whatsApp: '#25D366',
  whatsAppBubbleBg: '#1A3A1A',
  whatsAppBubbleBorder: '#2A5A2A',
  whatsAppBubbleLabel: '#4AC96A',
  whatsAppBubbleText: '#E8F5E9',

  // Borders
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderDefault: 'rgba(255,255,255,0.10)',
  borderStrong: '#2E3441',
  borderFocus: '#18C8E6',
} as const;

// Status color map
export const StatusColors = {
  pending: {
    fg: '#FF4D5E',
    bg: 'rgba(255,77,94,0.12)',
    border: 'rgba(255,77,94,0.34)',
  },
  received: {
    fg: '#2EE6A0',
    bg: 'rgba(46,230,160,0.12)',
    border: 'rgba(46,230,160,0.34)',
  },
  due: {
    fg: '#FFB020',
    bg: 'rgba(255,176,32,0.12)',
    border: 'rgba(255,176,32,0.32)',
  },
  paid: {
    fg: '#6B7280',
    bg: 'rgba(123,132,148,0.10)',
    border: 'rgba(123,132,148,0.26)',
  },
  enquiry: {
    fg: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.32)',
  },
  // Pipeline status aliases
  not_requested: {
    fg: '#FFB020',
    bg: 'rgba(255,176,32,0.12)',
    border: 'rgba(255,176,32,0.32)',
  },
  requested: {
    fg: '#FF4D5E',
    bg: 'rgba(255,77,94,0.12)',
    border: 'rgba(255,77,94,0.34)',
  },
  waived: {
    fg: '#6B7280',
    bg: 'rgba(123,132,148,0.10)',
    border: 'rgba(123,132,148,0.26)',
  },
  confirmed: {
    fg: '#18C8E6',
    bg: 'rgba(24,200,230,0.12)',
    border: 'rgba(24,200,230,0.32)',
  },
  advance_received: {
    fg: '#2EE6A0',
    bg: 'rgba(46,230,160,0.12)',
    border: 'rgba(46,230,160,0.34)',
  },
  done: {
    fg: '#FFB020',
    bg: 'rgba(255,176,32,0.12)',
    border: 'rgba(255,176,32,0.32)',
  },
} as const;

export type StatusKey = keyof typeof StatusColors;
