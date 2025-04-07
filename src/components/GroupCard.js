import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupCard = ({ group, onPress }) => {
  const theme = useSelector(state => state.theme.isDarkMode);
  const user = useSelector(state => state.auth.user);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getUserBalance = () => {
    const member = group.members.find(m => m.id === user?.id);
    // Ensure we have a numeric value for balance
    return member && member.balance !== undefined ? Number(member.balance) : 0;
  };

  const balance = getUserBalance();
  const isPositive = balance >= 0;
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme ? '#1e1e1e' : '#f9f9f9' }
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[
            styles.name,
            { color: theme ? '#f1f1f1' : '#121212' }
          ]}>
            {group.name}
          </Text>
          {group.description ? (
            <Text style={[
              styles.description,
              { color: theme ? '#a1a1aa' : '#71717a' }
            ]} numberOfLines={1}>
              {group.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.details}>
          <View style={styles.infoRow}>
            <Icon
              name="currency-usd"
              size={16}
              color={theme ? '#a1a1aa' : '#71717a'}
            />
            <Text style={[
              styles.balance,
              { color: isPositive ? '#4ade80' : '#ef4444' }
            ]}>
              {isPositive ? '+' : ''}{balance.toFixed(2)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon
              name="clock-outline"
              size={16}
              color={theme ? '#a1a1aa' : '#71717a'}
            />
            <Text style={[
              styles.date,
              { color: theme ? '#a1a1aa' : '#71717a' }
            ]}>
              {formatDate(group.updatedAt)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.members}>
        {group.members.slice(0, 3).map((member, index) => (
          member.profileUrl ? (
            <Image
              key={member.id}
              source={{ uri: member.profileUrl }}
              style={[
                styles.avatar,
                { marginLeft: index > 0 ? -15 : 0 }
              ]}
            />
          ) : (
            <View
              key={member.id}
              style={[
                styles.avatarPlaceholder,
                { marginLeft: index > 0 ? -15 : 0 },
                { backgroundColor: theme ? '#4ade80' : '#22c55e' }
              ]}
            >
              <Text style={styles.avatarText}>
                {getInitials(member.name || 'User')}
              </Text>
            </View>
          )
        ))}
        {group.members.length > 3 && (
          <View style={[
            styles.moreMembers,
            { backgroundColor: theme ? '#4ade80' : '#22c55e' }
          ]}>
            <Text style={styles.moreMembersText}>
              +{group.members.length - 3}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  header: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balance: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  date: {
    fontSize: 14,
    marginLeft: 4,
  },
  members: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  moreMembersText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default GroupCard;
