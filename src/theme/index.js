/**
 * BillingBuddy Theme Configuration
 * This file defines the color palette, typography, and spacing used throughout the app
 */

// Color definitions
export const colors = {
  // Primary brand colors
  primary: '#6C63FF', // Purple
  accent: '#FF9F1C', // Orange
  
  // Light theme
  light: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1A1A1A',
    border: '#E5E7EB',
    input: '#F3F4F6',
    placeholder: '#9CA3AF',
    divider: '#E5E7EB',
    positive: '#10B981', // Green for positive balances
    negative: '#EF4444', // Red for negative balances
    muted: '#6B7280', // Gray for less important text
  },
  
  // Dark theme
  dark: {
    background: '#0A0A0A',
    card: '#1F1F1F',
    text: '#F5F5F5',
    border: '#333333',
    input: '#2D2D2D',
    placeholder: '#6B7280',
    divider: '#333333',
    positive: '#10B981', // Green for positive balances
    negative: '#EF4444', // Red for negative balances
    muted: '#9CA3AF', // Gray for less important text
  }
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const shadows = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
  },
};

// Get themed styles based on current theme mode
export const getThemedStyles = (isDarkMode) => {
  const themeColors = isDarkMode ? colors.dark : colors.light;
  
  return {
    colors: {
      ...colors,
      ...themeColors,
    },
    shadows: isDarkMode ? shadows.dark : shadows.light,
  };
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  getThemedStyles,
};
