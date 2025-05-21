import { Platform } from 'react-native';

export const FONT_FAMILY = {
  REGULAR: Platform.OS === 'ios' ? 'System' : 'Roboto',
  MEDIUM: Platform.OS === 'ios' ? 'System' : 'Roboto',
  SEMIBOLD: Platform.OS === 'ios' ? 'System' : 'Roboto',
  BOLD: Platform.OS === 'ios' ? 'System' : 'Roboto',
  
  HEADING: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

export const FONT_SIZE = {
  XS: 12,
  SM: 14,
  BASE: 16,
  LG: 18,
  XL: 20,
  '2XL': 24,
  '3XL': 30,
};

export const FONT_WEIGHT = {
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
};

export const createTextStyle = (size, weight, family = 'REGULAR') => {
  return {
    fontSize: size,
    fontFamily: FONT_FAMILY[family],
    fontWeight: weight,
  };
};

export const TEXT_VARIANT = {
  headingLarge: createTextStyle(FONT_SIZE['3XL'], FONT_WEIGHT.BOLD, 'HEADING'),
  headingMedium: createTextStyle(FONT_SIZE['2XL'], FONT_WEIGHT.BOLD, 'HEADING'),
  headingSmall: createTextStyle(FONT_SIZE.XL, FONT_WEIGHT.BOLD, 'HEADING'),
  
  bodyLarge: createTextStyle(FONT_SIZE.LG, FONT_WEIGHT.REGULAR),
  bodyDefault: createTextStyle(FONT_SIZE.BASE, FONT_WEIGHT.REGULAR),
  bodySmall: createTextStyle(FONT_SIZE.SM, FONT_WEIGHT.REGULAR),
  
  labelLarge: createTextStyle(FONT_SIZE.BASE, FONT_WEIGHT.MEDIUM),
  labelDefault: createTextStyle(FONT_SIZE.SM, FONT_WEIGHT.MEDIUM),
  labelSmall: createTextStyle(FONT_SIZE.XS, FONT_WEIGHT.MEDIUM),
};

export default {
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  TEXT_VARIANT,
  createTextStyle,
}; 