import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import Logo from '@/components/Logo';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '@/utils/firebase';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [animationComplete, setAnimationComplete] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        
        if (userProfile) {
          if (userProfile.role) {
            // User has completed onboarding, go to main app
            router.replace('/(tabs)');
          } else {
            // User logged in but hasn't completed onboarding
            router.replace('/onboarding');
          }
        } else {
          // User logged in but no profile, go to onboarding
          router.replace('/onboarding');
        }
      } else {
        // User not logged in, stay on welcome screen
        setAuthChecked(true);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };
  
  const handleGetStarted = () => {
    router.replace('/auth');
  };
  
  if (!authChecked) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Logo size="large" animated onAnimationComplete={handleAnimationComplete} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Logo size="large" />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Service at your fingertips
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.inactive }]}>
          Connect with professional service providers instantly for all your home needs
        </Text>
        
        <Button
          title="Get Started"
          size="large"
          fullWidth
          onPress={handleGetStarted}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
  },
  button: {
    marginTop: 8,
  }
});