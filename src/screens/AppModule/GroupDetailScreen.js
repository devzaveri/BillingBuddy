import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Clipboard,
  ToastAndroid,
  Platform,
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
  getDocs,
  updateDoc,
  arrayUnion,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';
import { setCurrentGroup, setExpenses } from '../../redux/slices/groupSlice';
import ExpenseCard from '../../components/ExpenseCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.isDarkMode);
  const { currentGroup, expenses } = useSelector(state => state.groups);
  const user = useSelector(state => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const isMember = currentGroup?.memberIds?.includes(user?.id);
  
  const getUserBalance = () => {
    if (!currentGroup || !user) return 0;
    const member = currentGroup.members.find(m => m.id === user.id);
    return member ? Number(member.balance) || 0 : 0;
  };

  useEffect(() => {
    let unsubscribers = [];
    
    const setupListeners = async () => {
      const listeners = await loadGroupDetails();
      if (listeners) {
        unsubscribers = listeners;
      }
    };
    
    setupListeners();
    
    return () => {
      // Clean up listeners
      unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      dispatch(setCurrentGroup(null));
      dispatch(setExpenses([]));
    };
  }, [route.params?.groupId]);

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
      // Set up real-time listener for group data
      const groupRef = doc(db, 'groups', route.params.groupId);
      
      // First check if the group exists
      const groupDoc = await getDoc(groupRef);
      if (!groupDoc.exists()) {
        Alert.alert(
          'Error',
          'Group not found. It may have been deleted.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { backgroundColor: theme ? '#1e1e1e' : '#ffffff' }
        );
        return;
      }
      
      // Set up real-time listener for group document
      const unsubscribeGroup = onSnapshot(groupRef, (doc) => {
        if (doc.exists()) {
          const groupData = { id: doc.id, ...doc.data() };
          dispatch(setCurrentGroup(groupData));
          
          // Update navigation title with group name
          navigation.setOptions({
            title: groupData.name
          });
        }
      }, (error) => {
        console.error('Error in group listener:', error);
      });
      
      // Set up real-time listener for expenses
      const q = query(
        collection(db, 'expenses'),
        where('groupId', '==', route.params.groupId)
      );
      
      const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        dispatch(setExpenses(expensesData));
        setLoading(false);
      }, (error) => {
        console.error('Error in expenses listener:', error);
        setLoading(false);
      });
      
      // Return array of unsubscribe functions
      return [unsubscribeGroup, unsubscribeExpenses];
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

  const copyGroupId = () => {
    if (currentGroup?.id) {
      Clipboard.setString(currentGroup.id);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Group ID copied to clipboard', ToastAndroid.SHORT);
      } else {
        Alert.alert('Copied', 'Group ID copied to clipboard');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup || !user || currentGroup.createdBy !== user.id) {
      Alert.alert('Error', 'Only the group creator can delete the group');
      return;
    }
    
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Delete all expenses for this group
              const expensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', currentGroup.id)
              );
              
              const expensesSnapshot = await getDocs(expensesQuery);
              const deletePromises = [];
              
              expensesSnapshot.forEach(doc => {
                deletePromises.push(deleteDoc(doc.ref));
              });
              
              await Promise.all(deletePromises);
              
              // Delete the group
              await deleteDoc(doc(db, 'groups', currentGroup.id));
              
              Alert.alert(
                'Success', 
                'Group deleted successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const handleDeleteExpense = async (expense) => {
    if (!expense || !user || expense.paidBy.id !== user.id) {
      Alert.alert('Error', 'You can only delete expenses you created');
      return;
    }
    
    setDeleting(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Get the expense document
        const expenseRef = doc(db, 'expenses', expense.id);
        
        // Get the group document
        const groupRef = doc(db, 'groups', currentGroup.id);
        
        // Calculate updated member balances
        const updatedMembers = currentGroup.members.map(member => {
          const currentBalance = Number(member.balance) || 0;
          
          // Find if this member was part of the expense
          const memberShare = expense.sharedBy.find(m => m.id === member.id);
          const shareAmount = memberShare ? Number(memberShare.amount) || 0 : 0;
          
          if (member.id === expense.paidBy.id) {
            // The person who paid gets their money back minus their share
            return {
              ...member,
              balance: currentBalance - expense.amount + shareAmount
            };
          }
          // Others who were part of the split get their share back
          if (memberShare) {
            return {
              ...member,
              balance: currentBalance + shareAmount
            };
          }
          return member;
        });
        
        // Update the group with new balances and total
        const currentTotalExpenses = Number(currentGroup.totalExpenses || 0);
        const currentTotalBalance = Number(currentGroup.totalBalance || 0);
        
        transaction.update(groupRef, {
          members: updatedMembers,
          totalExpenses: Math.max(0, currentTotalExpenses - expense.amount),
          totalBalance: Math.max(0, currentTotalBalance - expense.amount),
          updatedAt: new Date().toISOString()
        });
        
        // Delete the expense
        transaction.delete(expenseRef);
      });
      
      Alert.alert('Success', 'Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', 'Failed to delete expense. Please try again.');
    } finally {
      setDeleting(false);
      setSelectedExpense(null);
    }
  };

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
        
        <View style={styles.groupIdContainer}>
          <Text style={[
            styles.groupIdLabel,
            { color: theme ? '#a1a1aa' : '#71717a' }
          ]}>
            Group ID:
          </Text>
          <View style={styles.groupIdWrapper}>
            <Text style={[
              styles.groupId,
              { color: theme ? '#f1f1f1' : '#121212' }
            ]}>
              {currentGroup.id}
            </Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={copyGroupId}
            >
              <Icon name="content-copy" size={18} color={theme ? '#4ade80' : '#22c55e'} />
            </TouchableOpacity>
          </View>
        </View>

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
          <View style={styles.balanceContainer}>
            <View style={styles.balanceRow}>
              <Text style={[
                styles.balanceLabel,
                { color: theme ? '#a1a1aa' : '#71717a' }
              ]}>
                Total Expenses:
              </Text>
              <Text style={[
                styles.balanceValue,
                { color: theme ? '#f1f1f1' : '#121212' }
              ]}>
                ${(currentGroup.totalExpenses || 0).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.balanceRow}>
              <Text style={[
                styles.balanceLabel,
                { color: theme ? '#a1a1aa' : '#71717a' }
              ]}>
                Your Balance:
              </Text>
              <Text style={[
                styles.balanceValue,
                { 
                  color: getUserBalance() >= 0 
                    ? theme ? '#4ade80' : '#22c55e'
                    : '#ef4444'
                }
              ]}>
                {getUserBalance() >= 0 ? '+' : ''}
                ${Math.abs(getUserBalance()).toFixed(2)}
              </Text>
            </View>
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

      <View style={styles.expensesContainer}>
        <View style={styles.expensesHeader}>
          <Text style={[
            styles.sectionTitle,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            Expenses
          </Text>
          {isMember ? (
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: theme ? '#4ade80' : '#22c55e' }
              ]}
              onPress={() => navigation.navigate('AddExpense', { groupId: currentGroup.id })}
            >
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {expenses.length === 0 ? (
          <Text style={[
            styles.emptyText,
            { color: theme ? '#a1a1aa' : '#71717a' }
          ]}>
            No expenses yet
          </Text>
        ) : (
          <FlatList
            data={expenses}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onLongPress={() => {
                  if (item.paidBy.id === user?.id) {
                    setSelectedExpense(item);
                    Alert.alert(
                      'Expense Options',
                      `${item.title} - $${item.amount.toFixed(2)}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => handleDeleteExpense(item)
                        }
                      ]
                    );
                  }
                }}
              >
                <ExpenseCard expense={item} theme={theme} />
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.expensesList}
          />
        )}
      </View>

      {isMember && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.addExpenseButton,
              { backgroundColor: theme ? '#4ade80' : '#22c55e' }
            ]}
            onPress={() => navigation.navigate('AddExpense', { groupId: currentGroup.id })}
          >
            <Text style={styles.addExpenseButtonText}>Add Expense</Text>
          </TouchableOpacity>
          
          {currentGroup.createdBy === user?.id && (
            <TouchableOpacity
              style={[
                styles.deleteGroupButton,
                { backgroundColor: theme ? '#333333' : '#f1f1f1' }
              ]}
              onPress={handleDeleteGroup}
            >
              <Text style={[
                styles.deleteGroupButtonText,
                { color: '#ef4444' }
              ]}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceContainer: {
    marginVertical: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  expensesContainer: {
    flex: 1,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  groupIdContainer: {
    marginVertical: 8,
  },
  groupIdLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  groupIdWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupId: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    padding: 4,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  addExpenseButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addExpenseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteGroupButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    elevation: 1,
  },
  deleteGroupButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
