import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { setGroups, setLoading } from '../../redux/slices/groupSlice';
import GroupCard from '../../components/GroupCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.isDarkMode);
  const { groups, loading } = useSelector(state => state.groups);
  const { user } = useSelector(state => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.headerTitle, { color: theme ? '#f1f1f1' : '#121212' }]}>
            BillingBuddy
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          {user?.profileUrl ? (
            <Image
              source={{ uri: user.profileUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[
              styles.profilePlaceholder,
              { backgroundColor: theme ? '#4ade80' : '#22c55e' }
            ]}>
              <Text style={styles.profileInitials}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, user, theme]);

  useEffect(() => {
    if (user?.id) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = () => {
    if (!user?.id) {
      Alert.alert(
        'Error',
        'Please sign in to view your groups',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }

    dispatch(setLoading(true));
    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch(setGroups(groupsData));
      dispatch(setLoading(false));
      setRefreshing(false);
    }, (error) => {
      console.error('Error loading groups:', error);
      Alert.alert(
        'Error',
        'Failed to load your groups. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: loadGroups }, { text: 'Cancel' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      dispatch(setLoading(false));
      setRefreshing(false);
    });

    return unsubscribe;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleCreateGroup = () => {
    if (!user?.id) {
      Alert.alert(
        'Error',
        'Please sign in to create a group',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }
    navigation.navigate('AddGroupScreen');
  };

  if (loading && !refreshing) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: theme ? '#121212' : '#ffffff' }
      ]}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme ? '#4ade80' : '#22c55e'}
            />
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={({ item }) => (
              <GroupCard
                group={item}
                onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon 
                  name="account-group" 
                  size={64} 
                  color={theme ? '#333333' : '#e5e5e5'} 
                />
                <Text style={[
                  styles.emptyText,
                  { color: theme ? '#f1f1f1' : '#121212' }
                ]}>
                  You don't have any groups yet
                </Text>
                <Text style={[
                  styles.emptySubtext,
                  { color: theme ? '#a1a1aa' : '#71717a' }
                ]}>
                  Create a new group to get started
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: theme ? '#4ade80' : '#22c55e' }
          ]}
          onPress={() => navigation.navigate('AddGroupScreen')}
        >
          <Icon name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <FlatList
        data={groups}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon 
              name="account-group" 
              size={64} 
              color={theme ? '#333333' : '#e5e5e5'} 
            />
            <Text style={[
              styles.emptyText,
              { color: theme ? '#f1f1f1' : '#121212' }
            ]}>
              You don't have any groups yet
            </Text>
            <Text style={[
              styles.emptySubtext,
              { color: theme ? '#a1a1aa' : '#71717a' }
            ]}>
              Create a new group to get started
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: theme ? '#4ade80' : '#22c55e' }
        ]}
        onPress={() => navigation.navigate('AddGroupScreen')}
      >
        <Icon name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileButton: {
    marginRight: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInitials: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GroupsScreen;
