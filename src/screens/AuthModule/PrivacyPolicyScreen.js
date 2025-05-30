import React from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../../theme';
import { images } from '../../components/images';
import { getTopPadding } from '../../utils/deviceUtils';


const PrivacyPolicyScreen = ({ navigation }) => {
  const theme = useSelector(state => state.theme.isDarkMode);

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <View style={{
        height: 56,
        width: '100%',
        backgroundColor: theme ? '#121212' : '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginTop: 25,
        paddingHorizontal: 16,
      }}>
         <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log('Back button pressed');
            navigation.goBack();
          }}
        >
         <Image style={styles.backArrow} source={images.backArrow} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
      <Text style={[
        styles.title,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        Privacy Policy
      </Text>

      <Text style={[
        styles.section,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        Last updated: {new Date().toLocaleDateString()}
      </Text>

      <Text style={[
        styles.heading,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        1. Information We Collect
      </Text>
      <Text style={[
        styles.text,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        We collect information that you provide directly to us, including:
        {'\n'}- Email address
        {'\n'}- Profile picture
        {'\n'}- Group and expense information
        {'\n'}- User-generated content
      </Text>

      <Text style={[
        styles.heading,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        2. How We Use Your Information
      </Text>
      <Text style={[
        styles.text,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        We use the information we collect to:
        {'\n'}- Provide, maintain, and improve our services
        {'\n'}- Process and record expenses
        {'\n'}- Enable group creation and management
        {'\n'}- Facilitate bill splitting and payments
        {'\n'}- Send notifications about activity
      </Text>

      <Text style={[
        styles.heading,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        3. Data Storage and Security
      </Text>
      <Text style={[
        styles.text,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        Your data is stored securely on Firebase servers. We implement appropriate
        security measures to protect against unauthorized access, alteration,
        disclosure, or destruction of your information.
      </Text>

      <Text style={[
        styles.heading,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        4. Information Sharing
      </Text>
      <Text style={[
        styles.text,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        We share your information only with:
        {'\n'}- Other group members (limited to group-related data)
        {'\n'}- Service providers who assist in our operations
        {'\n'}- As required by law
      </Text>

      <Text style={[
        styles.heading,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        5. Your Rights
      </Text>
      <Text style={[
        styles.text,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        You have the right to:
        {'\n'}- Access your personal data
        {'\n'}- Correct inaccurate data
        {'\n'}- Request deletion of your data
        {'\n'}- Export your data
        {'\n'}- Opt-out of communications
      </Text>

      <Text style={[
        styles.heading,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        6. Contact Us
      </Text>
      <Text style={[
        styles.text,
        { color: theme ? '#f1f1f1' : '#121212' }
      ]}>
        If you have any questions about this Privacy Policy, please contact us at:
        support@billingbuddy.com
      </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getTopPadding(),
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: 16,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,

    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 30,
    height: 30,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    fontStyle: 'italic',
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});

export default PrivacyPolicyScreen;
