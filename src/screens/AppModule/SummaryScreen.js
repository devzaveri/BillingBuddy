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
  Share,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PieChart } from 'react-native-svg-charts';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { images } from '../../components/images';
const windowsHeight = Dimensions.get('window').height
const SummaryScreen = () => {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);
  const isFocused = useIsFocused();
  const { isDarkMode, theme: appTheme } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const cardBackgroundColor = isDarkMode ? colors.dark.card : colors.light.card;
  const groups = useSelector(state => state.groups.groups);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [userBalances, setUserBalances] = useState({});

  useEffect(() => {
    // Set navigation options
    navigation.setOptions({
      title: 'Summary',
      headerStyle: {
        backgroundColor: themeColors.background,
      },
      headerTintColor: themeColors.text,
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Summary
          </Text>
        </View>
      ),
    });
  }, [navigation, themeColors]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Fetch all expenses for the user
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('sharedBy', 'array-contains', { id: user.id })
    );

    // Using getDocs instead of onSnapshot since we only need to fetch once
    let isActive = true; // Flag to handle component unmount
    
    getDocs(expensesQuery).then((snapshot) => {
      // Only update state if component is still mounted
      if (isActive) {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExpenses(expensesData);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error fetching expenses:', error);
      if (isActive) {
        setLoading(false);
      }
    });

    // Cleanup function that sets the flag to false
    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    // Calculate balances from groups
    const balances = {};
    groups.forEach(group => {
      if (group.members) {
        const userMember = group.members.find(member => member.id === user?.id);
        if (userMember) {
          const userBalance = Number(userMember.balance) || 0;
          
          group.members.forEach(member => {
            if (member.id !== user?.id) {
              if (!balances[member.id]) {
                balances[member.id] = {
                  name: member.name || 'Unknown',
                  amount: 0,
                };
              }
              
              // Calculate relative balance between this user and the current user
              const memberBalance = Number(member.balance) || 0;
              // If user balance is positive, they are owed money
              // If member balance is negative, they owe money
              balances[member.id].amount += memberBalance;
            }
          });
        }
      }
    });
    
    setUserBalances(balances);
  }, [groups, user]);

  // Calculate total spent and received
  const totals = groups.reduce((acc, group) => {
    const userMember = group.members?.find(member => member.id === user?.id);
    if (userMember) {
      const balance = Number(userMember.balance) || 0;
      if (balance > 0) {
        acc.spent += balance; // Money you're owed
      } else {
        acc.received += Math.abs(balance); // Money you owe
      }
    }
    return acc;
  }, { spent: 0, received: 0 });

  const netBalance = totals.spent - totals.received;
  
  // Handle sharing summary
  const handleShareSummary = async () => {
    try {
      const summaryText = `BillingBuddy Summary

Total you are owed: $${totals.spent.toFixed(2)}
Total you owe: $${totals.received.toFixed(2)}
Net balance: ${netBalance >= 0 ? '+' : ''}$${netBalance.toFixed(2)}

${Object.values(userBalances)
    .filter(balance => balance.amount !== 0)
    .map(balance => `${balance.name}: ${balance.amount > 0 ? '+' : ''}$${balance.amount.toFixed(2)}`)
    .join('\n')}`;
      
      await Share.share({
        message: summaryText,
        title: 'BillingBuddy Summary'
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      Alert.alert('Error', 'Could not share summary. Please try again.');
    }
  };

  const chartData = Object.values(userBalances)
    .filter(balance => balance.amount !== 0)
    .map((balance, index) => ({
      name: balance.name,
      value: Math.abs(balance.amount),
      key: `pie-${index}`,
      svg: { 
        fill: [
          colors.primary,
          colors.accent,
          '#10B981',
          '#60a5fa',
          '#c084fc',
        ][index % 5],
      },
      arc: { 
        outerRadius: '100%', 
        padAngle: 0.01,
      },
      amount: balance.amount,
    }));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header title="Summary" />
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header title="Summary" />
        <View style={styles.emptyState}>
          <Icon name="account-alert" size={64} color={themeColors.muted} />
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            Please log in to view your summary
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Header 
        title="Summary" 
        rightComponent={
          <TouchableOpacity onPress={handleShareSummary}>
            <Image source={images.share} style={styles.Backicon} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Balance overview card */}
        <Card isDarkMode={isDarkMode} style={[styles.overviewCard, { backgroundColor: cardBackgroundColor }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Balance Overview</Text>
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: themeColors.text }]}>
              Total you are owed:
            </Text>
            <Text style={[styles.balanceValue, { color: themeColors.positive }]}>
              ${totals.spent.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: themeColors.text }]}>
              Total you owe:
            </Text>
            <Text style={[styles.balanceValue, { color: themeColors.negative }]}>
              ${totals.received.toFixed(2)}
            </Text>
          </View>
          
          <View style={[styles.netBalanceContainer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F3F4F6' }]}>
            <Text style={[styles.netBalanceLabel, { color: themeColors.text }]}>
              Net Balance:
            </Text>
            <Text 
              style={[
                styles.netBalanceValue, 
                { color: netBalance >= 0 ? themeColors.positive : themeColors.negative }
              ]}
            >
              ${Math.abs(netBalance).toFixed(2)} {netBalance >= 0 ? '(You are owed)' : '(You owe)'}
            </Text>
          </View>
        </Card>

        {/* Charts card */}
        {chartData.length > 0 && (
          <Card isDarkMode={isDarkMode} style={[styles.chartCard, { backgroundColor: cardBackgroundColor }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Balance Distribution</Text>
            
            <View style={styles.chartContainer}>
              <PieChart 
                style={styles.chart} 
                data={chartData} 
                innerRadius="60%"
                padAngle={0.02}
              />
              
              <View style={styles.legendContainer}>
                {chartData.map((item, index) => (
                  <View key={item.key} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.svg.fill }]} />
                    <Text style={[styles.legendText, { color: themeColors.text }]}>
                      {item.name} ({item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}
        
        {/* Balance details card */}
        <Card isDarkMode={isDarkMode} style={{ backgroundColor: cardBackgroundColor }}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Balance Details</Text>
          
          {Object.values(userBalances).length > 0 ? (
            Object.values(userBalances).map((item) => (
              <View key={item.id} style={styles.balanceItemContainer}>
                <View style={styles.balanceItemLeft}>
                  <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#333333' : '#E5E7EB' }]}>
                    <Text style={[styles.avatarText, { color: themeColors.text }]}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.personName, { color: themeColors.text }]}>
                    {item.name}
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.personBalance, 
                    { color: item.amount >= 0 ? themeColors.positive : themeColors.negative }
                  ]}
                >
                  {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="currency-usd-off" size={48} color={themeColors.muted} />
              <Text style={[styles.emptyText, { color: themeColors.text }]}>
                No balances to displayb
              </Text>
            </View>
          )}
        </Card>
        
        {/* Groups card */}
        <Card isDarkMode={isDarkMode} style={{ backgroundColor: cardBackgroundColor }}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Your Groups</Text>
          
          {groups.length > 0 ? (
            groups.map((group) => {
              const userMember = group.members?.find(member => member.id === user?.id);
              const balance = userMember ? Number(userMember.balance) || 0 : 0;
              
              return (
                <TouchableOpacity 
                  key={group.id} 
                  style={styles.groupItem}
                  onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                >
                  <View style={styles.groupItemLeft}>
                    <View style={[styles.groupIcon, { backgroundColor: isDarkMode ? '#333333' : '#E5E7EB' }]}>
                     <Image resizeMode='contain' source={images.accountGroup} style={styles.expanseGroupIcon} />
                    </View>
                    <Text style={[styles.groupName, { color: themeColors.text }]}>
                      {group.name}
                    </Text>
                  </View>
                  <Text 
                    style={[
                      styles.groupBalance, 
                      { color: balance >= 0 ? themeColors.positive : themeColors.negative }
                    ]}
                  >
                    {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Icon name="account-group-outline" size={48} color={themeColors.muted} />
              <Text style={[styles.emptyText, { color: themeColors.text }]}>
                You're not in any groups yet
              </Text>
              <Button
                label="Create a Group"
                variant="primary"
                onPress={() => navigation.navigate('AddGroup')}
                style={styles.createGroupButton}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: windowsHeight > 700 ? '6%' : 0
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  overviewCard: {
    marginBottom: spacing.md,
  },
  chartCard: {
    marginBottom: spacing.md,
    
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    fontSize: typography.fontSize.base,
  },
  balanceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  netBalanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  netBalanceLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  netBalanceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  chart: {
    height: 200,
    width: 200,
    alignSelf: 'center',
  },
  legendContainer: {
    marginTop: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
  },
  balanceItemContainer: {
   flexDirection: 'row',
    alignItems: 'center',
marginTop: 5
    // borderBottomColor: isDarkMode => isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  balanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex:1
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  personName: {
    fontSize: typography.fontSize.base,
    marginLeft: spacing.sm,
    flex: 1,
  },
  personBalance: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: 'rgba(128,128,128,0.1)',
    borderBottomWidth: 1,

  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex:1,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupName: {
    fontSize: typography.fontSize.base,
    marginLeft: spacing.sm,
    flex: 1,
  },
  groupBalance: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  createGroupButton: {
    marginTop: spacing.md,
    width: '80%',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  Backicon: {
     width: 20,
    height: 20,
  },
  expanseGroupIcon: {
    width: 24,
    height: 24,
    tintColor: "#000"
  }
});

export default SummaryScreen;
