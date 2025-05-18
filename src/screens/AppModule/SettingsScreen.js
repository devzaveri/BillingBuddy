import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { storage, auth, db } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { toggleTheme } from '../../redux/slices/themeSlice';
import { setProfileUrl, logout, updateUserName, clearAuth, persistAuth } from '../../redux/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { images } from '../../components/images';
import theme from '../../theme';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.isDarkMode);
  const { user, profileUrl } = useSelector(state => state.auth);
  const [userName, setUserName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      // Check if user is authenticated
      if (!user || !user.id) {
        Alert.alert('Error', 'You must be logged in to update your profile picture');
        return;
      }

      setLoading(true);
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.assets && result.assets[0]) {
        // Delete the old profile image if it exists
        if (profileUrl) {
          try {
            // Get the old image reference from the URL
            const oldImagePath = profileUrl.split('profiles%2F')[1]?.split('?')[0];
            if (oldImagePath) {
              const oldImageRef = ref(storage, `profiles/${oldImagePath}`);
              await deleteObject(oldImageRef);
            }
          } catch (deleteError) {
            console.log('Old image not found or already deleted:', deleteError);
            // Continue with upload even if delete fails
          }
        }

        // Get current auth state
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Authentication required. Please log in again.');
        }

        // Create a reference to the profile image with timestamp to ensure uniqueness
        const timestamp = new Date().getTime();
        const fileName = `${user.id}_${timestamp}`;
        const imageRef = ref(storage, `profiles/${fileName}`);

        // Upload the new image
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        
        // Upload with metadata to ensure proper permissions
        const metadata = {
          contentType: 'image/jpeg',
          customMetadata: {
            'userId': user.id,
            'uploadedAt': new Date().toISOString()
          }
        };
        
        await uploadBytes(imageRef, blob, metadata);
        const downloadURL = await getDownloadURL(imageRef);

        // Update Firestore first
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { profileUrl: downloadURL });

        // Create updated user data
        const updatedUserData = {
          ...user,
          profileUrl: downloadURL
        };

        // Update Redux state and persist to AsyncStorage
        dispatch(setProfileUrl(downloadURL));
        await dispatch(persistAuth(updatedUserData));

        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', `Failed to update profile picture: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out BillingBuddy - Split bills, not friendships! Download now!',
        title: 'BillingBuddy',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    setLoading(true);
    try {
      const trimmedName = userName.trim();
      
      // Update Firestore first
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { name: trimmedName });
      
      // Create updated user data with new name
      const updatedUserData = {
        ...user,
        name: trimmedName
      };
      
      // Update Redux state and persist to AsyncStorage
      dispatch(updateUserName(trimmedName));
      await dispatch(persistAuth(updatedUserData));
      
      Alert.alert('Success', 'Name updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await auth.signOut();
              // Clear AsyncStorage and Redux state
              await dispatch(clearAuth()).unwrap();
              dispatch(logout());
              setLoading(false);
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleImagePick}>
          {profileUrl ? (
            <Image
              source={{ uri: profileUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[
              styles.profilePlaceholder,
              { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
            ]}>
              <Text style={[
                styles.profilePlaceholderText,
                { color: theme ? '#f1f1f1' : '#121212' }
              ]}>
                {user?.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[
          styles.email,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          {user?.email}
        </Text>

        <View style={styles.nameContainer}>
          {isEditing ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={[
                  styles.nameInput,
                  { 
                    color: theme ? '#f1f1f1' : '#121212',
                    backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
                    borderColor: theme ? '#333333' : '#e5e5e5',
                    textAlign: 'center',
                  }
                ]}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor={theme ? '#666666' : '#999999'}
                autoFocus
              />
              <View style={styles.nameEditButtons}>
                <TouchableOpacity 
                  style={[
                    styles.nameEditSaveButton,
                    { backgroundColor: theme ? '#4ade80' : '#22c55e' }
                  ]}
                  onPress={handleUpdateName}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.nameEditButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.nameEditButton,
                    { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
                  ]}
                  onPress={() => {
                    setIsEditing(false);
                    setUserName(user?.name || '');
                  }}
                  disabled={loading}
                >
                  <Text style={[
                    styles.nameEditButtonText,
                    { color: theme ? '#f1f1f1' : '#121212' }
                  ]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.nameDisplay}
              onPress={() => setIsEditing(true)}
            >
              <Text style={[
                styles.nameText,
                { color: theme ? '#f1f1f1' : '#121212' }
              ]}>
                {user?.name || 'Add your name'}
              </Text>
              <Image resizeMode='contain' source={images.edit} style={styles.pencilIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
          ]}
          onPress={handleShare}
        >
          <Text style={[
            styles.settingText,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            Share App
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
          ]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={[
            styles.settingText,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          { backgroundColor: theme ? '#ef4444' : '#dc2626' }
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  nameContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  nameEditContainer: {
    gap: 8,
  },
  nameInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    alignItems: 'center',
  },
  nameEditButtons: {
    flexDirection: 'row',
  },
  nameEditButton: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameEditSaveButton: {
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  nameEditButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingText: {
    fontSize: 16,
  },
  toggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    padding: 2,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  logoutButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pencilIcon: {
    width: 15,
    height: 15,
    marginLeft: 8
  },
});

export default SettingsScreen;
