import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

/**
 * Card component for displaying content in a contained, elevated surface
 * @param {ReactNode} children - Card content
 * @param {boolean} onPress - Card press handler (makes card touchable)
 * @param {object} style - Additional styles for the card
 * @param {boolean} elevated - Whether to show shadow
 */
const Card = ({
  children,
  onPress,
  style,
  elevated = true,
  isDarkMode = false,
}) => {
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const themeShadows = isDarkMode ? shadows.dark.md : shadows.light.md;
  
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[
        styles.card,
        { 
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
        elevated && themeShadows,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
});

export default Card;
