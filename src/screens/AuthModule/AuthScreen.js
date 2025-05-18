import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import { auth, storage, db } from '../../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { setUser, persistAuth } from '../../redux/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { images } from '../../components/images';
import theme from '../../theme';
import { getTopPadding } from '../../utils/deviceUtils';

const AuthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.isDarkMode);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.assets && result.assets[0]) {
        setProfileImage(result.assets[0]);
        setError('');
      }
    } catch (error) {
      setError('Failed to select image. Please try again.');
    }
  };

  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!isLogin && !name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    console.log("Signup=====>");
    setError('');
    if (!validateInputs()) return;

    setLoading(true);
    try {
      let userCredential;
      
      
      if (isLogin) {
        console.log("isLogin==>" , isLogin);
        
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("userCredential=====>" , userCredential);
        
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        console.log("userDoc===>" , userDoc);
        
        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), id: userCredential.user.uid };
          dispatch(setUser(userData));
          dispatch(persistAuth(userData));
        }
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        let profileUrl = null;
        if (profileImage) {
          const imageRef = ref(storage, `profiles/${userCredential.user.uid}`);
          const response = await fetch(profileImage.uri);
          const blob = await response.blob();
          await uploadBytes(imageRef, blob);
          profileUrl = await getDownloadURL(imageRef);
        }

        const userData = {
          name,
          email,
          profileUrl,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        const userDataWithId = { ...userData, id: userCredential.user.uid };
        dispatch(setUser(userDataWithId));
        dispatch(persistAuth(userDataWithId));
      }
    } catch (error) {
      let errorMessage = 'An error occurred';
      console.log("error=======>" , error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          {/* <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          /> */}
          <Text style={[
            styles.title,
            { color: theme ? '#4ade80' : '#22c55e' }
          ]}>
            BillingBuddy
          </Text>
          <Text style={[
            styles.subtitle,
            { color: theme ? '#f1f1f1' : '#666666' }
          ]}>
            Split bills, not friendships
          </Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isLogin && (
            <>
              <TouchableOpacity
                style={[styles.imageContainer, { borderColor: theme ? '#4ade80' : '#22c55e' }]}
                onPress={handleImagePick}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }]}>
                    <Image resizeMode="contain" source={images.user} style={styles.userImage} />
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
                    color: theme ? '#f1f1f1' : '#121212'
                  }
                ]}
                placeholder="Your Name"
                placeholderTextColor={theme ? '#666666' : '#999999'}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </>
          )}

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
                color: theme ? '#f1f1f1' : '#121212'
              }
            ]}
            placeholder="Email"
            placeholderTextColor={theme ? '#666666' : '#999999'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
                color: theme ? '#f1f1f1' : '#121212'
              }
            ]}
            placeholder="Password"
            placeholderTextColor={theme ? '#666666' : '#999999'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme ? '#4ade80' : '#22c55e' },
              loading && styles.buttonDisabled
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Login' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
              setEmail('');
              setPassword('');
              setName('');
              setProfileImage(null);
            }}
          >
            <Text style={{ color: theme ? '#4ade80' : '#22c55e' }}>
              {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={[
              styles.privacyText,
              { color: theme ? '#f1f1f1' : '#666666' }
            ]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getTopPadding(),
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  privacyText: {
    fontSize: 14,
  },
  userImage: {
    width: 40,
    height: 40,
    tintColor: "#4ade80",
  }
});

export default AuthScreen;
