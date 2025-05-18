import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getTopPadding } from '../../utils/deviceUtils';

const SplashScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useSelector(state => state.auth);
  const theme = useSelector(state => state.theme.isDarkMode);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      navigation.replace(isAuthenticated ? 'Home' : 'Auth');
    });
  }, []);

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={[
          styles.title,
          { color: theme ? '#4ade80' : '#22c55e' }
        ]}>
          BillingBuddy
        </Text>
        <Text style={[
          styles.tagline,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Split bills, not friendships
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: getTopPadding(),
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SplashScreen;
