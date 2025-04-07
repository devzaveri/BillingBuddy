import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { getThemedStyles } from '../theme';

// Theme context
const ThemeContext = createContext();

// Theme storage key
const THEME_STORAGE_KEY = '@billingbuddy_theme_mode';

/**
 * ThemeProvider component to manage app-wide theme state
 */
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          // Use saved theme
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Use system default
          setIsDarkMode(deviceTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to system default
        setIsDarkMode(deviceTheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [deviceTheme]);

  // Toggle theme mode
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Set specific theme mode
  const setThemeMode = async (darkMode) => {
    try {
      setIsDarkMode(darkMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Use system theme
  const useSystemTheme = async () => {
    try {
      setIsDarkMode(deviceTheme === 'dark');
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.error('Error removing theme preference:', error);
    }
  };

  // Get current theme styles
  const theme = getThemedStyles(isDarkMode);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        setThemeMode,
        useSystemTheme,
        theme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
