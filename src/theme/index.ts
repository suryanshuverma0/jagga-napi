import type { TextStyle } from 'react-native';

export interface Palette {
  scheme: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  accent: string;
  border: string;
  error: string;
  errorSoft: string;
  onErrorSoft: string;
  plotFill: string;
  plotStroke: string;
}

export const light: Palette = {
  scheme: 'light',
  bg: '#F7F5EF',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF1EA',
  text: '#16201A',
  textMuted: '#4F5D55',
  primary: '#1B6B4A',
  onPrimary: '#FFFFFF',
  primarySoft: '#D9EEE2',
  onPrimarySoft: '#0E3B28',
  accent: '#B5701A',
  border: '#CBD3CA',
  error: '#B3261E',
  errorSoft: '#FCE8E6',
  onErrorSoft: '#601410',
  plotFill: 'rgba(27,107,74,0.12)',
  plotStroke: '#1B6B4A',
};

export const dark: Palette = {
  scheme: 'dark',
  bg: '#0F1412',
  surface: '#18201C',
  surfaceAlt: '#212C26',
  text: '#E7EEE9',
  textMuted: '#A6B3AB',
  primary: '#63C99A',
  onPrimary: '#04261A',
  primarySoft: '#1E3B2D',
  onPrimarySoft: '#CDEEDD',
  accent: '#F0B45A',
  border: '#34423A',
  error: '#F2B8B5',
  errorSoft: '#3C1F1D',
  onErrorSoft: '#F9DEDC',
  plotFill: 'rgba(99,201,154,0.16)',
  plotStroke: '#63C99A',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
/** Minimum touch target (dp). */
export const TOUCH = 48;

const family = 'Mukta';

export const type = {
  display: { fontFamily: family, fontWeight: '700', fontSize: 28, lineHeight: 38 },
  title: { fontFamily: family, fontWeight: '700', fontSize: 20, lineHeight: 30 },
  heading: { fontFamily: family, fontWeight: '600', fontSize: 17, lineHeight: 26 },
  body: { fontFamily: family, fontWeight: '400', fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: family, fontWeight: '600', fontSize: 16, lineHeight: 24 },
  value: { fontFamily: family, fontWeight: '700', fontSize: 20, lineHeight: 30 },
  input: { fontFamily: family, fontWeight: '600', fontSize: 22, lineHeight: 32 },
  small: { fontFamily: family, fontWeight: '400', fontSize: 14, lineHeight: 21 },
  label: { fontFamily: family, fontWeight: '500', fontSize: 14, lineHeight: 21 },
} as const satisfies Record<string, TextStyle>;
