import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';

/**
 * Custom input component with icon and error display
 * @param {string} label - Input label
 * @param {string} placeholder - Input placeholder
 * @param {string} value - Input value
 * @param {function} onChangeText - Text change handler
 * @param {boolean} secureTextEntry - Whether this is a password field
 * @param {string} error - Error message
 * @param {string} leftIcon - Material icon name for left icon
 * @param {string} rightIcon - Material icon name for right icon
 * @param {function} onRightIconPress - Handler for right icon press
 * @param {object} style - Additional styles for container
 * @param {object} inputStyle - Additional styles for input
 * @param {string} keyboardType - Keyboard type
 */
const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  keyboardType = 'default',
  isDarkMode = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secureText, setSecureText] = useState(secureTextEntry);
  
  const themeColors = isDarkMode ? colors.dark : colors.light;

  // Toggle password visibility
  const toggleSecureEntry = () => {
    setSecureText(!secureText);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: themeColors.text }]}>
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          { 
            backgroundColor: themeColors.input,
            borderColor: themeColors.border,
          },
          isFocused && { 
            borderColor: colors.primary,
            borderWidth: 1.5,
          },
          error && { 
            borderColor: themeColors.negative,
            borderWidth: 1.5,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon 
              name={leftIcon} 
              size={20} 
              color={isFocused ? colors.primary : themeColors.muted} 
            />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            { 
              color: themeColors.text,
              paddingLeft: leftIcon ? 0 : spacing.md,
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={themeColors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureText}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        
        {(secureTextEntry || rightIcon) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={secureTextEntry ? toggleSecureEntry : onRightIconPress}
          >
            <Icon
              name={secureTextEntry ? (secureText ? 'eye-off' : 'eye') : rightIcon}
              size={20}
              color={themeColors.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: themeColors.negative }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    height: 50,
    overflow: 'hidden',
  },
  leftIconContainer: {
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.fontSize.base,
  },
  rightIconContainer: {
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default Input;
