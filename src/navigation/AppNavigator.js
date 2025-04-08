import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

// Import screens (we'll create these next)
import SplashScreen from '../screens/AuthModule/SplashScreen';
import AuthScreen from '../screens/AuthModule/AuthScreen';
import PrivacyPolicyScreen from '../screens/AuthModule/PrivacyPolicyScreen';
import GroupsScreen from '../screens/AppModule/GroupsScreen';
import SummaryScreen from '../screens/AppModule/SummaryScreen';
import SettingsScreen from '../screens/AppModule/SettingsScreen';
import GroupDetailScreen from '../screens/AppModule/GroupDetailScreen';
import AddExpenseScreen from '../screens/AppModule/AddExpenseScreen';
import AddGroupScreen from '../screens/AppModule/AddGroupScreen';
import ProfileScreen from '../screens/AppModule/ProfileScreen';
import { images } from '../components/images';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CustomHeader = ({ title, onBack, theme }) => (
  <View style={[
    styles.header,
    { backgroundColor: theme ? '#121212' : '#ffffff' }
  ]}>
    {onBack && (
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Icon name="arrow-left" size={24} color={theme ? '#4ade80' : '#22c55e'} />
      </TouchableOpacity>
    )}
    <Text style={[
      styles.headerTitle,
      { color: theme ? '#f1f1f1' : '#121212' }
    ]}>{title}</Text>
  </View>
);

const HomeTabs = () => {
  const theme = useSelector(state => state.theme.isDarkMode);
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme ? '#4ade80' : '#22c55e',
        tabBarInactiveTintColor: theme ? '#666666' : '#999999',
        tabBarStyle: {
          backgroundColor: theme ? '#121212' : '#ffffff',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color, size }) => (
            <Image source={images.accountGroup} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          tabBarLabel: 'Summary',
          tabBarIcon: ({ color, size }) => (
            <Image source={images.summaryLogo} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Image source={images.settingsLogo} style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const theme = useSelector(state => state.theme.isDarkMode);
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        {!isAuthenticated ? (
          <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={({ navigation }) => ({
                // header: () => (
                //   <CustomHeader
                //     title="Privacy Policy"
                //     onBack={() => navigation.goBack()}
                //     theme={theme}
                //   />
                // )
              })}
            />
          </>
          
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeTabs} />
            <Stack.Screen 
              name="GroupDetail" 
              component={GroupDetailScreen}
              options={({ navigation }) => ({
                header: ({ scene }) => (
                  <CustomHeader
                    title={scene.route.params?.groupName || 'Group Details'}
                    onBack={() => navigation.goBack()}
                    theme={theme}
                  />
                )
              })}
            />
            <Stack.Screen 
              name="AddExpense" 
              component={AddExpenseScreen}
              options={({ navigation }) => ({
                header: () => (
                  <CustomHeader
                    title="Add Expense"
                    onBack={() => navigation.goBack()}
                    theme={theme}
                  />
                ),
                presentation: 'modal'
              })}
            />
            <Stack.Screen 
              name="AddGroupScreen" 
              component={AddGroupScreen}
              options={({ navigation }) => ({
                header: () => (
                  <CustomHeader
                    title="Create or Join Group"
                    onBack={() => navigation.goBack()}
                    theme={theme}
                  />
                ),
                presentation: 'modal'
              })}
            />
            <Stack.Screen 
              name="ProfileScreen" 
              component={ProfileScreen}
              options={({ navigation }) => ({
                header: () => (
                  <CustomHeader
                    title="Profile"
                    onBack={() => navigation.goBack()}
                    theme={theme}
                  />
                ),
                presentation: 'modal'
              })}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={({ navigation }) => ({
                header: () => (
                  <CustomHeader
                    title="Privacy Policy"
                    onBack={() => navigation.goBack()}
                    theme={theme}
                  />
                )
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
});

export default AppNavigator;
