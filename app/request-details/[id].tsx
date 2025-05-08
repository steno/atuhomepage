import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { SERVICES } from '@/constants/Services';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { ServiceRequest, User } from '@/types';
import { getUserProfile, updateServiceRequestStatus } from '@/utils/firebase';
import { MessageCircle, MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react-native';

export default function RequestDetailsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const { user } = useAuth();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id) return;
      
      try {
        const db = getFirestore();
        const requestDoc = await getDoc(doc(db, 'serviceRequests', id));
        
        if (requestDoc.exists()) {
          const requestData = requestDoc.data() as ServiceRequest;
          setRequest(requestData);
          
          // Fetch the other user's details
          const otherUserId = user?.role === 'client' ? requestData.providerId : requestData.clientId;
          
          if (otherUserId) {
            const otherUserData = await getUserProfile(otherUserId);
            setOtherUser(otherUserData);
          }
        } else {
          setError('Request not found');
        }
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError('Failed to load request details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [id, user]);
  
  // Handle action parameter (e.g., for cancellation)
  useEffect(() => {
    if (action === 'cancel' && request && request.status !== 'cancelled') {
      Alert.alert(
        'Cancel Request',
        'Are you sure you want to cancel this service request?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: handleCancelRequest,
          },
        ]
      );
    }
  }, [action, request]);
  
  const handleAcceptRequest = async () => {
    if (!request || !user) return;
    
    setActionLoading(true);
    
    try {
      await updateServiceRequestStatus(request.id, 'accepted', user.id);
      
      // Refresh the request data
      const db = getFirestore();
      const updatedRequestDoc = await getDoc(doc(db, 'serviceRequests', request.id));
      
      if (updatedRequestDoc.exists()) {
        setRequest(updatedRequestDoc.data() as ServiceRequest);
      }
      
      // Navigate to chat
      router.push(`/chat/${request.id}`);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!request) return;
    
    setActionLoading(true);
    
    try {
      await updateServiceRequestStatus(request.id, 'cancelled');
      
      // Refresh the request data
      const db = getFirestore();
      const updatedRequestDoc = await getDoc(doc(db, 'serviceRequests', request.id));
      
      if (updatedRequestDoc.exists()) {
        setRequest(updatedRequestDoc.data() as ServiceRequest);
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError('Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCompleteRequest = async () => {
    if (!request) return;
    
    setActionLoading(true);
    
    try {
      await updateServiceRequestStatus(request.id, 'completed');
      
      // Refresh the request data
      const db = getFirestore();
      const updatedRequestDoc = await getDoc(doc(db, 'serviceRequests', request.id));
      
      if (updatedRequestDoc.exists()) {
        setRequest(updatedRequestDoc.data() as ServiceRequest);
      }
    } catch (err) {
      console.error('Error completing request:', err);
      setError('Failed to complete request');
    } finally {
      setActionLoading(false);
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.loadingText, { color: colors.inactive }]}>
            Loading request details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !request) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Request not found'}
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const getStatusColor = () => {
    switch (request.status) {
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
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Service Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.serviceHeader}>
              <Text style={[styles.serviceTitle, { color: colors.text }]}>
                {SERVICES.find(s => s.type === request.serviceType)?.title || 'Service'}
              </Text>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Calendar size={18} color={colors.inactive} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.inactive }]}>Date:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(request.createdAt)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Clock size={18} color={colors.inactive} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.inactive }]}>Time:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatTime(request.createdAt)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <MapPin size={18} color={colors.inactive} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.inactive }]}>Location:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {request.location.address || 'Current location'}
              </Text>
            </View>
            
            {request.status === 'accepted' && (
              <Button
                title="Open Chat"
                fullWidth
                onPress={() => router.push(`/chat/${request.id}`)}
                style={{ marginTop: 16 }}
                leftIcon={<MessageCircle size={18} color="#FFFFFF" />}
              />
            )}
          </View>
          
          {otherUser && (request.status === 'accepted' || request.status === 'completed') && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {user?.role === 'client' ? 'Service Provider' : 'Client'}
              </Text>
              
              <View style={styles.userInfoContainer}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.subtle }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {otherUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {otherUser.name}
                  </Text>
                  
                  {otherUser.phone && (
                    <Text style={[styles.userContact, { color: colors.inactive }]}>
                      {otherUser.phone}
                    </Text>
                  )}
                  
                  <Text style={[styles.userContact, { color: colors.inactive }]}>
                    {otherUser.email}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.actionsContainer}>
            {/* Provider can accept a pending request */}
            {user?.role === 'provider' && request.status === 'pending' && (
              <Button
                title="Accept Request"
                fullWidth
                loading={actionLoading}
                onPress={handleAcceptRequest}
              />
            )}
            
            {/* Client can cancel a pending request */}
            {user?.role === 'client' && (request.status === 'pending' || request.status === 'accepted') && (
              <Button
                title="Cancel Request"
                variant="outline"
                fullWidth
                loading={actionLoading}
                onPress={handleCancelRequest}
                style={{ marginTop: request.status === 'accepted' ? 12 : 0 }}
              />
            )}
            
            {/* Provider can complete an accepted request */}
            {user?.role === 'provider' && request.status === 'accepted' && (
              <Button
                title="Complete Service"
                fullWidth
                loading={actionLoading}
                onPress={handleCompleteRequest}
                style={{ marginBottom: 12 }}
              />
            )}
            
            {/* Client can go back to home from a completed service */}
            {(request.status === 'completed' || request.status === 'cancelled') && (
              <Button
                title="Return to Home"
                variant={request.status === 'completed' ? 'primary' : 'outline'}
                fullWidth
                onPress={() => router.replace('/')}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userContact: {
    fontSize: 14,
    marginBottom: 2,
  },
  actionsContainer: {
    marginTop: 16,
  },
});