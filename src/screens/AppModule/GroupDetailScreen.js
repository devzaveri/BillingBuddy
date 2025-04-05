import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { setCurrentGroup, setExpenses } from '../../redux/slices/groupSlice';
import ExpenseCard from '../../components/ExpenseCard';

const GroupDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.isDarkMode);
  const { currentGroup, expenses } = useSelector(state => state.groups);
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const isMember = currentGroup?.memberIds?.includes(user?.id);

  useEffect(() => {
    loadGroupDetails();
    return () => {
      dispatch(setCurrentGroup(null));
      dispatch(setExpenses([]));
    };
  }, []);

  const loadGroupDetails = async () => {
    if (!route.params?.groupId) {
      Alert.alert(
        'Error',
        'Invalid group ID. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }

    try {
      const groupRef = doc(db, 'groups', route.params.groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (groupDoc.exists()) {
        dispatch(setCurrentGroup({ id: groupDoc.id, ...groupDoc.data() }));
        
        // Set up real-time listener for expenses
        const q = query(
          collection(db, 'expenses'),
          where('groupId', '==', route.params.groupId)
        );
        
        onSnapshot(q, (snapshot) => {
          const expensesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          dispatch(setExpenses(expensesData));
          setLoading(false);
        });
      } else {
        Alert.alert(
          'Error',
          'Group not found. It may have been deleted.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
        );
      }
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert(
        'Error',
        'Failed to load group details. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: loadGroupDetails }, { text: 'Cancel' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      setLoading(false);
    }
  };

  if (loading || !currentGroup) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: theme ? '#121212' : '#ffffff' }
      ]}>
        <ActivityIndicator
          size="large"
          color={theme ? '#4ade80' : '#22c55e'}
        />
      </View>
    );
  }

  const handleJoinGroup = async () => {
    if (!user?.id) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to join this group',
        [{ text: 'OK' }],
        { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
      );
      return;
    }

    setJoining(true);
    try {
      const groupRef = doc(db, 'groups', route.params.groupId);
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
        [{ text: 'OK' }],
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
      setJoining(false);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme ? '#121212' : '#ffffff' }
    ]}>
      <View style={[
        styles.header,
        { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
      ]}>
        <Text style={[
          styles.groupName,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          {currentGroup.name}
        </Text>

        {currentGroup.description ? (
          <Text style={[
            styles.description,
            { color: theme ? '#a1a1aa' : '#71717a' }
          ]}>
            {currentGroup.description}
          </Text>
        ) : null}

        {!isMember ? (
          <TouchableOpacity
            style={[
              styles.joinButton,
              { backgroundColor: theme ? '#4ade80' : '#22c55e' },
              joining && styles.buttonDisabled
            ]}
            onPress={handleJoinGroup}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.joinButtonText}>Join Group</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={[
              styles.totalBalance,
              { color: theme ? '#4ade80' : '#22c55e' }
            ]}>
              Total Balance: ${currentGroup.totalBalance?.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={styles.members}>
          {currentGroup.members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <Image
                source={{ uri: member.profileUrl }}
                style={styles.memberAvatar}
              />
              <Text style={[
                styles.memberName,
                { color: theme ? '#f1f1f1' : '#121212' }
              ]}>
                {member.name}
              </Text>
              <Text style={[
                styles.memberBalance,
                { 
                  color: member.balance >= 0 
                    ? theme ? '#4ade80' : '#22c55e'
                    : '#ef4444'
                }
              ]}>
                ${member.balance?.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <FlatList
        data={expenses}
        renderItem={({ item }) => <ExpenseCard expense={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <Text style={[
            styles.emptyText,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            No expenses yet
          </Text>
        )}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: theme ? '#4ade80' : '#22c55e' }
        ]}
        onPress={() => navigation.navigate('AddExpense', { groupId: currentGroup.id })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  joinButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalBalance: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  members: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
  },
  memberBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default GroupDetailScreen;
