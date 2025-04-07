import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AddGroupScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useSelector(state => state.theme.isDarkMode);
  const user = useSelector(state => state.auth.user);

  const validateInputs = () => {
    if (!user?.id) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to create a group',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return false;
    }

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Alert.alert(
        'Validation Error',
        'Please enter a group name',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return false;
    }

    if (trimmedName.length < 3) {
      Alert.alert(
        'Validation Error',
        'Group name must be at least 3 characters long',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return false;
    }

    if (trimmedName.length > 50) {
      Alert.alert(
        'Validation Error',
        'Group name cannot exceed 50 characters',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return false;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 200) {
      Alert.alert(
        'Validation Error',
        'Description cannot exceed 200 characters',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return false;
    }

    return true;
  };

  const handleAddGroup = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        createdBy: user.id,
        memberIds: [user.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalExpenses: 0,
        totalBalance: 0,
        members: [{
          id: user.id,
          name: user.name || 'Unknown',
          profileUrl: user.profileUrl,
          balance: 0
        }]
      };

      await addDoc(collection(db, 'groups'), groupData);
      Alert.alert(
        'Success',
        'Group created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert(
        'Error',
        'Failed to create group. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: handleAddGroup },
          { text: 'Cancel' }
        ],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user?.id) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to join a group',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }

    if (!groupId.trim()) {
      Alert.alert(
        'Validation Error',
        'Please enter a group ID',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }

    setLoading(true);
    try {
      const groupRef = doc(db, 'groups', groupId.trim());
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        Alert.alert(
          'Error',
          'Group not found. Please check the ID and try again.',
          [{ text: 'OK' }],
          { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
        );
        return;
      }

      const groupData = groupDoc.data();
      if (groupData.memberIds.includes(user.id)) {
        Alert.alert(
          'Error',
          'You are already a member of this group',
          [{ text: 'OK' }],
          { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
        );
        return;
      }

      await updateDoc(groupRef, {
        memberIds: arrayUnion(user.id),
        members: arrayUnion({
          id: user.id,
          name: user.name || 'Unknown',
          profileUrl: user.profileUrl,
          balance: 0
        })
      });

      Alert.alert(
        'Success',
        'You have successfully joined the group!',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert(
        'Error',
        'Failed to join group. Please try again.',
        [{ text: 'Retry', onPress: handleJoinGroup }, { text: 'Cancel' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme ? '#121212' : '#ffffff' }]}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'create' && styles.activeTabButton,
            { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
          ]}
          onPress={() => setActiveTab('create')}
        >
          <Icon
            name="plus-circle"
            size={24}
            color={activeTab === 'create' ? (theme ? '#4ade80' : '#22c55e') : (theme ? '#666666' : '#999999')}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'create' ? (theme ? '#4ade80' : '#22c55e') : (theme ? '#666666' : '#999999') }
          ]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'join' && styles.activeTabButton,
            { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
          ]}
          onPress={() => setActiveTab('join')}
        >
          <Icon
            name="account-group"
            size={24}
            color={activeTab === 'join' ? (theme ? '#4ade80' : '#22c55e') : (theme ? '#666666' : '#999999')}
          />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'join' ? (theme ? '#4ade80' : '#22c55e') : (theme ? '#666666' : '#999999') }
          ]}>Join</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <View style={styles.form}>
        <Text style={[
          styles.label,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Group Name*
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
          placeholder="Enter group name (3-50 characters)"
          placeholderTextColor={theme ? '#666666' : '#999999'}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />

        <Text style={[
          styles.label,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Description (Optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { 
              backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
              color: theme ? '#f1f1f1' : '#121212',
              borderColor: theme ? '#333333' : '#e5e5e5'
            }
          ]}
          placeholder="Add a description for your group (optional, max 200 characters)"
          placeholderTextColor={theme ? '#666666' : '#999999'}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={200}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme ? '#4ade80' : '#22c55e' },
            loading && styles.buttonDisabled
          ]}
          onPress={handleAddGroup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
      ) : (
        <View style={styles.form}>
          <Text style={[
            styles.label,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            Group ID*
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
            placeholder="Enter group ID to join"
            placeholderTextColor={theme ? '#666666' : '#999999'}
            value={groupId}
            onChangeText={setGroupId}
          />
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme ? '#4ade80' : '#22c55e' },
              loading && styles.buttonDisabled
            ]}
            onPress={handleJoinGroup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Join Group</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ade80',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
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
  form: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 12,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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

export default AddGroupScreen;
