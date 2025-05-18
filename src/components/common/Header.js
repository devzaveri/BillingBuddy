import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';

/**
 * Header component for screens
 * @param {string} title - Screen title
 * @param {boolean} showBack - Whether to show back button
 * @param {ReactNode} rightComponent - Component to display on the right side
 * @param {function} onBackPress - Custom back button handler
 * @param {object} style - Additional styles
 */
const Header = ({
  title,
  showBack = false,
  rightComponent,
  onBackPress,
  style,
  isDarkMode = false,
}) => {
  const navigation = useNavigation();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar
        backgroundColor={isDarkMode ? colors.dark.background : colors.light.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: themeColors.background },
          style,
        ]}
      >
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name="arrow-left"
                size={24}
                color={themeColors.text}
              />
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.title,
              { color: themeColors.text },
              showBack && styles.titleWithBack,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        
        {rightComponent && (
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop:"10%",
    
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  titleWithBack: {
    marginLeft: spacing.xs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Header;
