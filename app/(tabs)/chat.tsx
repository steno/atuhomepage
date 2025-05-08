import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, getFirestore } from 'firebase/firestore';
import { ServiceRequest, User } from '@/types';
import { getUserProfile } from '@/utils/firebase';

interface ChatPreview {
  requestId: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const db = getFirestore();
    
    // Find active service requests
    const requestsQuery = query(
      collection(db, 'serviceRequests'),
      where(user.role === 'client' ? 'clientId' : 'providerId', '==', user.id),
      where('status', '==', 'accepted'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      requestsQuery,
      async (snapshot) => {
        try {
          const requestsData: ServiceRequest[] = [];
          snapshot.forEach((doc) => {
            requestsData.push(doc.data() as ServiceRequest);
          });
          
          const chatsData: ChatPreview[] = [];
          
          for (const request of requestsData) {
            const otherUserId = user.role === 'client' ? request.providerId : request.clientId;
            
            if (!otherUserId) continue;
            
            // Get the other user's profile
            const otherUser = await getUserProfile(otherUserId);
            
            if (!otherUser) continue;
            
            // Get the latest message
            const messagesQuery = query(
              collection(db, 'messages'),
              where('requestId', '==', request.id),
              orderBy('createdAt', 'desc'),
              // limit(1)
            );
            
            const messagesSnapshot = await new Promise((resolve) => {
              const unsubMessages = onSnapshot(messagesQuery, (msgs) => {
                resolve(msgs);
                unsubMessages();
              });
            });
            
            let lastMessage = 'No messages yet';
            let timestamp = request.createdAt;
            let unreadCount = 0;
            
            if (!messagesSnapshot.empty) {
              const latestMessage = messagesSnapshot.docs[0].data();
              lastMessage = latestMessage.text;
              timestamp = latestMessage.createdAt;
              
              // Count unread messages
              messagesSnapshot.forEach((doc) => {
                const messageData = doc.data();
                if (messageData.receiverId === user.id && !messageData.read) {
                  unreadCount++;
                }
              });
            }
            
            chatsData.push({
              requestId: request.id,
              otherUserId,
              otherUserName: otherUser.name,
              lastMessage,
              timestamp,
              unreadCount,
            });
          }
          
          // Sort by latest message
          chatsData.sort((a, b) => b.timestamp - a.timestamp);
          
          setChats(chatsData);
        } catch (err) {
          console.error('Error processing chat data:', err);
          setError('Failed to load chats');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching chats:', err);
        setError('Failed to load chats');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [user]);
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day name
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  const renderItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colorScheme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}
      onPress={() => router.push(`/chat/${item.requestId}`)}
    >
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.otherUserName}
          </Text>
          <Text style={[styles.timestamp, { color: colors.inactive }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        
        <View style={styles.messagePreview}>
          <Text 
            style={[
              styles.messageText, 
              { 
                color: item.unreadCount > 0 ? colors.text : colors.inactive,
                fontWeight: item.unreadCount > 0 ? '600' : '400',
              }
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      </View>
    );
  }
  
  if (chats.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.inactive }]}>
          No active conversations
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.inactive }]}>
          {user?.role === 'client' 
            ? 'Request a service to start chatting with a provider'
            : 'Accept a service request to start chatting with a client'}
        </Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={(item) => item.requestId}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.background }]}
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
    padding: 16,
    paddingTop: 8,
  },
  chatItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});