// GigOS Effects — Shadows, Glow, Motion
import { ViewStyle } from 'react-native';

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 6,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.62,
    shadowRadius: 40,
    elevation: 12,
  } as ViewStyle,
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 16,
  } as ViewStyle,
};

export const Glow = {
  cyan: {
    shadowColor: '#18C8E6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,
  cyanSm: {
    shadowColor: '#18C8E6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,
  red: {
    shadowColor: '#FF4D5E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
  green: {
    shadowColor: '#2EE6A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
  amber: {
    shadowColor: '#FFB020',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
  violet: {
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
};

export const Motion = {
  microDuration: 120,
  baseDuration: 200,
  slowDuration: 320,
  pressScale: 0.97,
};

// Map status to glow style
export const StatusGlow: Record<string, ViewStyle> = {
  pending: Glow.red,
  received: Glow.green,
  due: Glow.amber,
  paid: {},
  enquiry: Glow.violet,
  requested: Glow.red,
  not_requested: Glow.amber,
  confirmed: Glow.cyan,
  advance_received: Glow.green,
  done: Glow.amber,
};
