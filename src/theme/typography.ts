// GigOS Typography Tokens
// Display/headings: Saira | Body: IBM Plex Sans | Labels: IBM Plex Mono

import { TextStyle } from 'react-native';

// Font family names as registered by expo-google-fonts
export const FontFamily = {
  sairaBold: 'Saira_700Bold',
  sairaSemiBold: 'Saira_600SemiBold',
  sairaRegular: 'Saira_400Regular',
  plexRegular: 'IBMPlexSans_400Regular',
  plexMedium: 'IBMPlexSans_500Medium',
  plexSemiBold: 'IBMPlexSans_600SemiBold',
  plexBold: 'IBMPlexSans_700Bold',
  monoRegular: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const TypeScale: Record<string, TextStyle> = {
  displayXL: {
    fontFamily: FontFamily.sairaBold,
    fontSize: 56,
    lineHeight: 56 * 1.05,
    letterSpacing: -0.02 * 56,
  },
  displayL: {
    fontFamily: FontFamily.sairaBold,
    fontSize: 40,
    lineHeight: 40 * 1.05,
    letterSpacing: -0.02 * 40,
  },
  displayM: {
    fontFamily: FontFamily.sairaBold,
    fontSize: 32,
    lineHeight: 32 * 1.05,
    letterSpacing: -0.02 * 32,
  },
  h1: {
    fontFamily: FontFamily.sairaBold,
    fontSize: 26,
    lineHeight: 26 * 1.25,
  },
  h2: {
    fontFamily: FontFamily.sairaBold,
    fontSize: 21,
    lineHeight: 21 * 1.25,
  },
  h3: {
    fontFamily: FontFamily.sairaSemiBold,
    fontSize: 17,
    lineHeight: 17 * 1.25,
  },
  body: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 15,
    lineHeight: 15 * 1.5,
  },
  bodySmall: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 13,
    lineHeight: 13 * 1.5,
  },
  label: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.14 * 10,
    textTransform: 'uppercase',
  },
  labelLg: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 11,
    lineHeight: 13.2,
    letterSpacing: 0.1 * 11,
    textTransform: 'uppercase',
  },
} as const;
