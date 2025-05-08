import React, { useContext } from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, MessageSquare, User, History } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { ThemeContext } from '../_layout';
import { useAuth } from '@/hooks/useAuth';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { colorScheme } = useContext(ThemeContext);
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.inactive,
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF',
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 85 : 60,
            paddingBottom: Platform.OS === 'ios' ? 30 : 10,
            paddingTop: 10,
            elevation: 8,
            shadowColor: colors.shadow,
            shadowOffset: {
              width: 0,
              height: -3,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <History size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <MessageSquare size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});