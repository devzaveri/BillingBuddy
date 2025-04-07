import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../theme';

/**
 * Button component with different variants
 * @param {string} variant - 'primary', 'secondary', 'outline', 'text'
 * @param {boolean} loading - Show loading indicator
 * @param {boolean} disabled - Disable the button
 * @param {function} onPress - Button press handler
 * @param {string} label - Button text
 * @param {object} style - Additional styles for the button
 * @param {object} labelStyle - Additional styles for the label
 * @param {ReactNode} icon - Icon component to show before the label
 */
const Button = ({
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  label,
  style,
  labelStyle,
  icon,
  isDarkMode = false,
}) => {
  // Determine button colors based on variant and theme
  const getButtonStyles = () => {
    const themeColors = isDarkMode ? colors.dark : colors.light;
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          color: '#FFFFFF',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          color: colors.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: colors.dark.negative,
          borderColor: colors.dark.negative,
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          color: '#FFFFFF',
        };
    }
  };

  const buttonStyles = getButtonStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: buttonStyles.backgroundColor,
          borderColor: buttonStyles.borderColor,
        },
        variant === 'outline' && styles.outlineButton,
        variant === 'text' && styles.textButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <Text
            style={[
              styles.label,
              { color: buttonStyles.color },
              isDisabled && styles.disabledLabel,
              icon && styles.labelWithIcon,
              labelStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  outlineButton: {
    backgroundColor: 'transparent',
  },
  textButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: spacing.sm,
  },
  disabledButton: {
    opacity: 0.6,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledLabel: {
    opacity: 0.8,
  },
  labelWithIcon: {
    marginLeft: spacing.sm,
  },
});

export default Button;
