import { Platform, Dimensions, StatusBar } from 'react-native';

/**
 * Detects if the device has a notch or not
 * @returns {boolean} true if the device has a notch, false otherwise
 */
export const hasNotch = () => {
  // For iOS devices
  if (Platform.OS === 'ios') {
    const { height, width } = Dimensions.get('window');
    return (
      // Check for iPhone X, XS, 11 Pro dimensions
      (height === 812 || width === 812) || 
      // Check for iPhone XS Max, XR, 11, 11 Pro Max dimensions
      (height === 896 || width === 896) ||
      // iPhone 12, 12 Pro
      (height === 844 || width === 844) ||
      // iPhone 12 Pro Max
      (height === 926 || width === 926) ||
      // iPhone 13, 13 Pro, 14, 14 Pro
      (height === 852 || width === 852) ||
      // iPhone 13 Pro Max, 14 Plus, 14 Pro Max
      (height === 932 || width === 932)
    );
  }
  
  // For Android devices
  if (Platform.OS === 'android') {
    // Check if the status bar height is greater than 24
    // Most notched Android devices have a status bar height > 24
    return StatusBar.currentHeight > 24;
  }
  
  return false;
};

/**
 * Gets the appropriate top padding based on whether the device has a notch
 * @returns {number} padding value
 */
export const getTopPadding = () => {
  if (hasNotch()) {
    // Return status bar height + additional padding for notched devices
    return Platform.OS === 'ios' ? 30 : StatusBar.currentHeight;
  }
  
  // Return 0 for devices without a notch
  return 0;
};
