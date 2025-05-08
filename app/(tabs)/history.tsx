import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { SERVICES } from '@/constants/Services';

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user } = useAuth();
  const { requests, loading, error } = useServiceRequests(user);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.primary;
      default:
        return colors.inactive;
    }
  };
  
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.requestItem, { backgroundColor: colorScheme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}
      onPress={() => router.push(`/request-details/${item.id}`)}
    >
      <View style={styles.requestHeader}>
        <Text style={[styles.requestService, { color: colors.text }]}>
          {SERVICES.find(s => s.type === item.serviceType)?.title || 'Service'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.requestDate, { color: colors.inactive }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      
      <View style={styles.requestFooter}>
        {item.status === 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.primary }]}
            onPress={() => router.push(`/request-details/${item.id}`)}
          >
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
          </TouchableOpacity>
        )}
        
        {(item.status === 'pending' || item.status === 'accepted') && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.primary }]}
              onPress={() => router.push(`/request-details/${item.id}`)}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.error, marginLeft: 8 }]}
              onPress={() => router.push(`/request-details/${item.id}?action=cancel`)}
            >
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }
  
  if (!requests || requests.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' }]}>
        <Text style={[styles.emptyText, { color: colors.inactive }]}>
          No service history yet
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' }}>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  requestItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestService: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 14,
    marginBottom: 12,
  },
  requestFooter: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});