import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Logo from '@/components/Logo';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { Mail, Phone, ArrowLeft } from 'lucide-react-native';
import { createUser, loginUser, saveUserProfile } from '@/utils/firebase';

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  };
  
  const handleSubmit = async () => {
    setError(null);
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (mode === 'login') {
        await loginUser(email, password);
        // Route handling is done in the welcome screen
      } else {
        const userId = await createUser(email, password);
        
        // Create initial user profile
        await saveUserProfile(userId, {
          id: userId,
          email,
          createdAt: Date.now(),
          name: '', // Will be collected in onboarding
          role: 'client', // Default role, will be confirmed in onboarding
        });
        
        router.replace('/onboarding');
      }
    } catch (err: any) {
      let errorMessage = 'Authentication failed';
      
      // Format common Firebase error messages
      if (err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message.includes('auth/email-already-in-use')) {
        errorMessage = 'Email is already in use';
      } else if (err.message.includes('auth/invalid-email')) {
        errorMessage = 'Invalid email address';
      } else if (err.message.includes('auth/network-request-failed')) {
        errorMessage = 'Network error. Please check your connection';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const goBack = () => {
    router.back();
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Logo size="medium" />
        </View>
        
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.inactive }]}>
            {mode === 'login' 
              ? 'Sign in to continue to Atu Servicios' 
              : 'Sign up to get started with Atu Servicios'}
          </Text>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          <TextField
            label="Email"
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Mail size={20} color={colors.inactive} />}
          />
          
          <TextField
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          {mode === 'signup' && (
            <TextField
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}
          
          <Button
            title={mode === 'login' ? 'Log In' : 'Sign Up'}
            fullWidth
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
          
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, { color: colors.inactive }]}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={[styles.toggleButton, { color: colors.primary }]}>
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
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
  submitButton: {
    marginTop: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleButton: {
    fontSize: 14,
    fontWeight: '600',
  },
});