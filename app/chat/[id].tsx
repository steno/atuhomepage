import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ServiceRequest, User, Message } from '@/types';
import { getUserProfile, sendMessage } from '@/utils/firebase';
import { Send, ArrowLeft } from 'lucide-react-native';

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (!id || !user) return;
    
    const db = getFirestore();
    
    // Fetch the service request
    const fetchRequest = async () => {
      try {
        const requestDoc = await getDoc(doc(db, 'serviceRequests', id));
        
        if (requestDoc.exists()) {
          const requestData = requestDoc.data() as ServiceRequest;
          setRequest(requestData);
          
          // Fetch the other user's details
          const otherUserId = user.role === 'client' ? requestData.providerId : requestData.clientId;
          
          if (otherUserId) {
            const otherUserData = await getUserProfile(otherUserId);
            setOtherUser(otherUserData);
          }
        } else {
          setError('Request not found');
        }
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError('Failed to load conversation');
      }
    };
    
    fetchRequest();
    
    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('requestId', '==', id),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList: Message[] = [];
        const batch = db.batch();
        
        snapshot.forEach((doc) => {
          const messageData = doc.data() as Message;
          messagesList.push(messageData);
          
          // Mark messages as read if they're for the current user
          if (messageData.receiverId === user.id && !messageData.read) {
            batch.update(doc.ref, { read: true });
          }
        });
        
        // Apply batch updates
        batch.commit().catch((err) => {
          console.error('Error marking messages as read:', err);
        });
        
        setMessages(messagesList);
        setLoading(false);
        
        // Scroll to bottom on new messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [id, user]);
  
  const handleSend = async () => {
    if (!inputText.trim() || !user || !request || !otherUser) return;
    
    setSending(true);
    
    try {
      const newMessage = {
        senderId: user.id,
        receiverId: otherUser.id,
        text: inputText.trim(),
        requestId: request.id,
        createdAt: Date.now(),
        read: false,
      };
      
      await sendMessage(newMessage);
      setInputText('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.id;
    
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.sentMessage : styles.receivedMessage,
          {
            backgroundColor: isCurrentUser ? colors.primary : colorScheme === 'dark' ? colors.card : '#E5E5EA',
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isCurrentUser ? '#FFFFFF' : colors.text },
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            { color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : colors.inactive },
          ]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </View>
    );
  };
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.inactive }]}>
        No messages yet. Start the conversation!
      </Text>
    </View>
  );
  
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={[styles.backText, { color: colors.primary }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: otherUser?.name || 'Chat',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={renderEmptyComponent}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
          
          <View style={[styles.inputContainer, { backgroundColor: colorScheme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.inactive}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});