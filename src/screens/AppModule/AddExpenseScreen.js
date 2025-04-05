import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../services/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useSelector(state => state.theme.isDarkMode);
  const { currentGroup } = useSelector(state => state.groups);
  const { user } = useSelector(state => state.auth);

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

      const sharedBy = currentGroup.members.filter(
        member => selectedMembers[member.id]
      );

      if (sharedBy.length === 0) {
        Alert.alert('Error', 'Please select at least one member to split with');
        return;
      }

      const expenseAmount = parseFloat(amount);
      const splitAmount = expenseAmount / sharedBy.length;

      // Create expense document
      const expenseData = {
        groupId: currentGroup.id,
        title,
        amount: expenseAmount,
        paidBy: {
          id: user.uid,
          name: user.displayName || user.email,
          profileUrl: user.photoURL,
        },
        sharedBy: sharedBy.map(member => ({
          id: member.id,
          name: member.name,
          profileUrl: member.profileUrl,
          amount: splitAmount,
        })),
        date: new Date().toISOString(),
      };

      await addDoc(collection(db, 'expenses'), expenseData);

      // Update group total and member balances
      const groupRef = doc(db, 'groups', currentGroup.id);
      const updatedMembers = currentGroup.members.map(member => {
        if (member.id === user.uid) {
          return {
            ...member,
            balance: member.balance + expenseAmount - (selectedMembers[member.id] ? splitAmount : 0),
          };
        }
        return {
          ...member,
          balance: member.balance - (selectedMembers[member.id] ? splitAmount : 0),
        };
      });

      await updateDoc(groupRef, {
        members: updatedMembers,
        totalBalance: currentGroup.totalBalance + expenseAmount,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme ? '#121212' : '#ffffff' }
      ]}
      contentContainerStyle={styles.content}
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
          { backgroundColor: theme ? '#4ade80' : '#22c55e' }
        ]}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>Add Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
