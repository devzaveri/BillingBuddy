import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, doc, runTransaction } from 'firebase/firestore';

const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useSelector(state => state.theme.isDarkMode);
  const { currentGroup } = useSelector(state => state.groups);
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(
    currentGroup.members.reduce((acc, member) => {
      acc[member.id] = true;
      return acc;
    }, {})
  );

  const handleSubmit = async () => {
    try {
      if (!title || !amount) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to add an expense');
        return;
      }

      const sharedBy = currentGroup.members.filter(
        member => selectedMembers[member.id]
      );

      if (sharedBy.length === 0) {
        Alert.alert('Error', 'Please select at least one member to split with');
        return;
      }

      const expenseAmount = parseFloat(amount);
      if (isNaN(expenseAmount) || expenseAmount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      setLoading(true);
      const splitAmount = expenseAmount / sharedBy.length;

      try {
        // Use a transaction to ensure data consistency
        await runTransaction(db, async (transaction) => {
          // Create expense document
          const expenseRef = doc(collection(db, 'expenses'));
          const expenseData = {
            id: expenseRef.id,
            groupId: currentGroup.id,
            title,
            amount: expenseAmount,
            paidBy: {
              id: user.id,
              name: user.name || user.email,
              profileUrl: user.profileUrl,
            },
            sharedBy: sharedBy.map(member => ({
              id: member.id,
              name: member.name,
              profileUrl: member.profileUrl,
              amount: splitAmount,
            })),
            date: new Date().toISOString(),
          };

          // Get the current group data
          const groupRef = doc(db, 'groups', currentGroup.id);
          
          // Update member balances
          const updatedMembers = currentGroup.members.map(member => {
            const currentBalance = Number(member.balance) || 0;
            
            if (member.id === user.id) {
              // The person who paid gets credit for the full amount minus their share
              return {
                ...member,
                balance: currentBalance + expenseAmount - (selectedMembers[member.id] ? splitAmount : 0),
              };
            }
            // Others who are part of the split have their balance reduced by their share
            return {
              ...member,
              balance: currentBalance - (selectedMembers[member.id] ? splitAmount : 0),
            };
          });
          
          // Ensure totalBalance is a number
          const currentTotalBalance = Number(currentGroup.totalBalance) || 0;
          const currentTotalExpenses = Number(currentGroup.totalExpenses || 0);
          
          // Set the expense data
          transaction.set(expenseRef, expenseData);
          
          // Update the group data
          transaction.update(groupRef, {
            members: updatedMembers,
            totalExpenses: currentTotalExpenses + expenseAmount,
            totalBalance: currentTotalBalance + expenseAmount,
            updatedAt: new Date().toISOString(),
          });
        });

        Alert.alert(
          'Success',
          'Expense added successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        console.error('Transaction failed:', error);
        Alert.alert('Error', 'Failed to add expense. Please try again.');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set navigation options
    navigation.setOptions({
      title: 'Add Expense',
      headerStyle: {
        backgroundColor: theme ? '#121212' : '#ffffff',
      },
      headerTintColor: theme ? '#ffffff' : '#000000',
    });
  }, [navigation, theme]);

  if (!currentGroup) {
    return (
      <View style={[styles.container, { backgroundColor: theme ? '#121212' : '#ffffff' }]}>
        <ActivityIndicator size="large" color={theme ? '#4ade80' : '#22c55e'} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme ? '#121212' : '#ffffff' }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[
          styles.label,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Title
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
              color: theme ? '#f1f1f1' : '#121212'
            }
          ]}
          placeholder="What's this expense for?"
          placeholderTextColor={theme ? '#666666' : '#999999'}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[
          styles.label,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Amount
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme ? '#1e1e1e' : '#f9f9f9',
              color: theme ? '#f1f1f1' : '#121212'
            }
          ]}
          placeholder="0.00"
          placeholderTextColor={theme ? '#666666' : '#999999'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={[
          styles.label,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Split with
        </Text>
        <View style={styles.membersList}>
          {currentGroup.members.map(member => (
            <View key={member.id} style={styles.memberItem}>
              <Text style={[
                styles.memberName,
                { color: theme ? '#f1f1f1' : '#121212' }
              ]}>
                {member.name}
              </Text>
              <Switch
                value={selectedMembers[member.id]}
                onValueChange={(value) => 
                  setSelectedMembers(prev => ({
                    ...prev,
                    [member.id]: value
                  }))
                }
                trackColor={{
                  false: theme ? '#666666' : '#d1d5db',
                  true: theme ? '#4ade80' : '#22c55e'
                }}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor: theme ? '#4ade80' : '#22c55e' },
            loading && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Add Expense</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  membersList: {
    marginBottom: 24,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2f2f2f',
  },
  memberName: {
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddExpenseScreen;
