import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';

const ExpenseCard = ({ expense }) => {
  const theme = useSelector(state => state.theme.isDarkMode);
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
    ]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: expense.paidBy.profileUrl }}
            style={styles.avatar}
          />
          <Text style={[
            styles.userName,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            {expense.paidBy.name}
          </Text>
        </View>
        <Text style={[
          styles.date,
          { color: theme ? '#666666' : '#999999' }
        ]}>
          {new Date(expense.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={[
          styles.title,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          {expense.title}
        </Text>
        <Text style={[
          styles.amount,
          { color: theme ? '#4ade80' : '#22c55e' }
        ]}>
          ${expense.amount?.toFixed(2)}
        </Text>
      </View>

      <View style={styles.split}>
        <Text style={[
          styles.splitText,
          { color: theme ? '#666666' : '#999999' }
        ]}>
          Split between {expense.sharedBy.length} people
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  split: {
    marginTop: 4,
  },
  splitText: {
    fontSize: 12,
  },
});

export default ExpenseCard;
