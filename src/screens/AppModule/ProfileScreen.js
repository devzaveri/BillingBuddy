import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import { storage, db } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { setUser } from '../../redux/slices/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.isDarkMode);
  const user = useSelector(state => state.auth.user);

  const [name, setName] = useState(user?.name || '');
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
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Error',
        'Please enter your name',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }

    setLoading(true);
    try {
      let profileUrl = user?.profileUrl;
      
      if (profileImage) {
        const imageRef = ref(storage, `profiles/${user.id}`);
        const response = await fetch(profileImage.uri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        profileUrl = await getDownloadURL(imageRef);
      }

      const userData = {
        name: name.trim(),
        profileUrl,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'users', user.id), userData);
      dispatch(setUser({ ...user, ...userData }));
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon
            name="arrow-left"
            size={24}
            color={theme ? '#4ade80' : '#22c55e'}
          />
        </TouchableOpacity>
        <Text style={[
          styles.title,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Edit Profile
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleImagePick}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage.uri }}
              style={styles.profileImage}
            />
          ) : user?.profileUrl ? (
            <Image
              source={{ uri: user.profileUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[
              styles.placeholderImage,
              { backgroundColor: theme ? '#4ade80' : '#22c55e' }
            ]}>
              <Icon name="camera" size={32} color="#ffffff" />
            </View>
          )}
          <View style={styles.editBadge}>
            <Icon name="pencil" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <Text style={[
          styles.label,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Name*
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
              color: theme ? '#f1f1f1' : '#121212',
              borderColor: theme ? '#333333' : '#e5e5e5'
            }
          ]}
          placeholder="Enter your name"
          placeholderTextColor={theme ? '#666666' : '#999999'}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme ? '#4ade80' : '#22c55e' },
            loading && styles.buttonDisabled
          ]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Update Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
