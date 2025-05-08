import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { SERVICES } from '@/constants/Services';
import { updateServiceRequestStatus } from '@/utils/firebase';
import { scheduleLocalNotification } from '@/utils/notifications';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export default function ServiceSearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user } = useAuth();
  const { requests, refresh } = useServiceRequests(user);
  
  const [searching, setSearching] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);
  
  const activeRequest = requests?.find(req => req.status === 'pending');
  
  const size = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: size.value }],
      opacity: opacity.value,
    };
  });
  
  useEffect(() => {
    size.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
    
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
    
    // Check if the request has been accepted
    const intervalId = setInterval(() => {
      refresh();
      
      if (activeRequest?.status === 'accepted') {
        clearInterval(intervalId);
        setSearching(false);
        router.replace(`/request-details/${activeRequest.id}`);
      }
    }, 3000);
    
    // Count down timer
    const timerId = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          clearInterval(intervalId);
          setSearching(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(timerId);
    };
  }, [activeRequest, refresh]);
  
  const handleCancel = async () => {
    if (!activeRequest) return;
    
    try {
      await updateServiceRequestStatus(activeRequest.id, 'cancelled');
      router.replace('/');
    } catch (error) {
      console.error('Cancel error:', error);
      setError('Failed to cancel request');
    }
  };
  
  const handleRetry = async () => {
    if (!activeRequest) return;
    
    try {
      // Reset the timer and continue searching
      setSecondsLeft(60);
      setSearching(true);
      
      // You might want to send a new batch of notifications here
      await scheduleLocalNotification(
        'Searching again',
        'Looking for available service providers',
        { requestId: activeRequest.id }
      );
    } catch (error) {
      console.error('Retry error:', error);
      setError('Failed to retry');
    }
  };
  
  if (!activeRequest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          No active service request found
        </Text>
        <Button
          title="Go Home"
          onPress={() => router.replace('/')}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {searching ? 'Finding Service Provider...' : 'No Providers Found'}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.inactive }]}>
            {searching 
              ? 'Searching for available providers in your area' 
              : 'No service providers are available at the moment'}
          </Text>
          
          <View style={styles.serviceInfo}>
            <Text style={[styles.serviceLabel, { color: colors.inactive }]}>
              Service Type:
            </Text>
            <Text style={[styles.serviceValue, { color: colors.text }]}>
              {SERVICES.find(s => s.type === activeRequest.serviceType)?.title || 'Service'}
            </Text>
          </View>
          
          {searching ? (
            <>
              <View style={styles.searchAnimation}>
                <Animated.View
                  style={[
                    styles.ripple,
                    { backgroundColor: colors.primary },
                    animatedStyle,
                  ]}
                />
                <View style={[styles.centerDot, { backgroundColor: colors.primary }]} />
              </View>
              
              <Text style={[styles.timer, { color: colors.inactive }]}>
                {secondsLeft} seconds remaining
              </Text>
              
              <TouchableOpacity onPress={handleCancel} style={{ marginTop: 24 }}>
                <Text style={[styles.cancelText, { color: colors.error }]}>
                  Cancel Search
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title="Try Again"
                onPress={handleRetry}
                style={{ marginBottom: 16 }}
              />
              
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancel}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  serviceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  serviceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchAnimation: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ripple: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timer: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    width: '100%',
    marginTop: 36,
  },
});