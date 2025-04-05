import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { PieChart } from 'react-native-chart-kit';

const SummaryScreen = () => {
  const theme = useSelector(state => state.theme.isDarkMode);
  const { groups } = useSelector(state => state.groups);
  const { user } = useSelector(state => state.auth);

  // Calculate total spent and received
  const totals = groups.reduce((acc, group) => {
    group.expenses?.forEach(expense => {
      if (expense.paidBy.id === user.uid) {
        acc.spent += expense.amount;
      }
      const userShare = expense.sharedBy.find(
        member => member.id === user.uid
      )?.amount || 0;
      acc.received += userShare;
    });
    return acc;
  }, { spent: 0, received: 0 });

  const netBalance = totals.spent - totals.received;

  // Calculate who owes who
  const balances = {};
  groups.forEach(group => {
    group.members.forEach(member => {
      if (member.id !== user.uid) {
        if (!balances[member.id]) {
          balances[member.id] = {
            name: member.name,
            amount: 0,
          };
        }
        balances[member.id].amount += member.balance;
      }
    });
  });

  const chartData = Object.values(balances)
    .filter(balance => balance.amount !== 0)
    .map((balance, index) => ({
      name: balance.name,
      amount: Math.abs(balance.amount),
      color: [
        '#4ade80',
        '#facc15',
        '#f472b6',
        '#60a5fa',
        '#c084fc',
      ][index % 5],
      legendFontColor: theme ? '#f1f1f1' : '#121212',
    }));

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme ? '#121212' : '#ffffff' }
      ]}
    >
      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Your Balance
        </Text>
        <Text style={[
          styles.balance,
          { 
            color: netBalance >= 0
              ? theme ? '#4ade80' : '#22c55e'
              : '#ef4444'
          }
        ]}>
          ${netBalance?.toFixed(2)}
        </Text>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Text style={[
              styles.balanceLabel,
              { color: theme ? '#f1f1f1' : '#121212' }
            ]}>
              Total Spent
            </Text>
            <Text style={[
              styles.balanceValue,
              { color: theme ? '#4ade80' : '#22c55e' }
            ]}>
              ${totals.spent?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={[
              styles.balanceLabel,
              { color: theme ? '#f1f1f1' : '#121212' }
            ]}>
              Your Share
            </Text>
            <Text style={[
              styles.balanceValue,
              { color: theme ? '#f472b6' : '#ec4899' }
            ]}>
              ${totals.received?.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {chartData.length > 0 && (
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            Expense Distribution
          </Text>
          <PieChart
            data={chartData}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={[
          styles.sectionTitle,
          { color: theme ? '#f1f1f1' : '#121212' }
        ]}>
          Settlements
        </Text>
        {Object.values(balances).map((balance, index) => (
          <View key={index} style={[
            styles.settlementItem,
            { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
          ]}>
            <Text style={[
              styles.settlementName,
              { color: theme ? '#f1f1f1' : '#121212' }
            ]}>
              {balance.name}
            </Text>
            <Text style={[
              styles.settlementAmount,
              { 
                color: balance.amount >= 0
                  ? theme ? '#4ade80' : '#22c55e'
                  : '#ef4444'
              }
            ]}>
              {balance.amount >= 0 ? 'Owes you' : 'You owe'} ${Math.abs(balance.amount)?.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settlementName: {
    fontSize: 16,
    fontWeight: '500',
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SummaryScreen;
