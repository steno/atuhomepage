import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import { ServiceCard } from '@/components';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { SERVICES } from '@/constants/Services';
import { ServiceType, UserRole } from '@/types';
import { updateUserProfile, getCurrentUserId } from '@/utils/firebase';

type OnboardingStep = 'basic-info' | 'role-selection' | 'service-type';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [step, setStep] = useState<OnboardingStep>('basic-info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleNext = async () => {
    setError(null);
    
    if (step === 'basic-info') {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }
      
      // Simple phone validation (optional field)
      if (phone && !/^\+?[0-9]{10,15}$/.test(phone.trim())) {
        setError('Please enter a valid phone number');
        return;
      }
      
      setStep('role-selection');
    } else if (step === 'role-selection') {
      if (!role) {
        setError('Please select a role');
        return;
      }
      
      if (role === 'provider') {
        setStep('service-type');
      } else {
        // For clients, complete the onboarding
        await completeOnboarding();
      }
    } else if (step === 'service-type') {
      if (!serviceType) {
        setError('Please select a service type');
        return;
      }
      
      await completeOnboarding();
    }
  };
  
  const completeOnboarding = async () => {
    setLoading(true);
    
    try {
      const userId = getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const userData: Record<string, any> = {
        name,
        role: role as UserRole,
      };
      
      if (phone) {
        userData.phone = phone;
      }
      
      if (role === 'provider' && serviceType) {
        userData.serviceType = serviceType;
        userData.isAvailable = true; // Default to available for providers
      }
      
      await updateUserProfile(userId, userData);
      
      // Navigate to the main app
      router.replace('/(tabs)');
    } catch (err: any) {
      setError('Failed to update profile. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getStepProgress = () => {
    if (step === 'basic-info') return 1;
    if (step === 'role-selection') return 2;
    return 3;
  };
  
  const getTotalSteps = () => {
    return role === 'provider' ? 3 : 2;
  };
  
  const renderBasicInfoStep = () => {
    return (
      <>
        <Text style={[styles.title, { color: colors.text }]}>
          Tell us about yourself
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.inactive }]}>
          This information helps us create your profile
        </Text>
        
        <TextField
          label="Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
        
        <TextField
          label="Phone (Optional)"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </>
    );
  };
  
  const renderRoleSelectionStep = () => {
    return (
      <>
        <Text style={[styles.title, { color: colors.text }]}>
          How will you use Atu Servicios?
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.inactive }]}>
          Select your role on the platform
        </Text>
        
        <View style={styles.roleContainer}>
          <View
            style={[
              styles.roleCard,
              {
                borderColor: role === 'client' ? colors.client : colors.border,
                backgroundColor: role === 'client' ? `${colors.client}15` : colorScheme === 'dark' ? colors.card : '#F9F9F9',
              },
            ]}
            onTouchEnd={() => setRole('client')}
          >
            <View
              style={[
                styles.roleIconContainer,
                {
                  backgroundColor: role === 'client' ? `${colors.client}30` : colors.subtle,
                },
              ]}
            >
              <Text style={[styles.roleIcon, { color: role === 'client' ? colors.client : colors.inactive }]}>👤</Text>
            </View>
            <Text style={[styles.roleTitle, { color: colors.text }]}>Client</Text>
            <Text style={[styles.roleDescription, { color: colors.inactive }]}>
              I need services for my home
            </Text>
          </View>
          
          <View
            style={[
              styles.roleCard,
              {
                borderColor: role === 'provider' ? colors.provider : colors.border,
                backgroundColor: role === 'provider' ? `${colors.provider}15` : colorScheme === 'dark' ? colors.card : '#F9F9F9',
              },
            ]}
            onTouchEnd={() => setRole('provider')}
          >
            <View
              style={[
                styles.roleIconContainer,
                {
                  backgroundColor: role === 'provider' ? `${colors.provider}30` : colors.subtle,
                },
              ]}
            >
              <Text style={[styles.roleIcon, { color: role === 'provider' ? colors.provider : colors.inactive }]}>👨‍🔧</Text>
            </View>
            <Text style={[styles.roleTitle, { color: colors.text }]}>Provider</Text>
            <Text style={[styles.roleDescription, { color: colors.inactive }]}>
              I offer professional services
            </Text>
          </View>
        </View>
      </>
    );
  };
  
  const renderServiceTypeStep = () => {
    return (
      <>
        <Text style={[styles.title, { color: colors.text }]}>
          What services do you provide?
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.inactive }]}>
          Select your primary service type
        </Text>
        
        <ScrollView style={styles.servicesContainer} contentContainerStyle={styles.servicesContent}>
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.type}
              type={service.type}
              selected={serviceType === service.type}
              onPress={() => setServiceType(service.type)}
            />
          ))}
        </ScrollView>
      </>
    );
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
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: colors.inactive }]}>
            Step {getStepProgress()} of {getTotalSteps()}
          </Text>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${(getStepProgress() / getTotalSteps()) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
        
        <View style={styles.content}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          {step === 'basic-info' && renderBasicInfoStep()}
          {step === 'role-selection' && renderRoleSelectionStep()}
          {step === 'service-type' && renderServiceTypeStep()}
        </View>
        
        <View style={styles.bottomContainer}>
          <Button
            title={step === 'service-type' || (step === 'role-selection' && role === 'client') ? 'Complete Setup' : 'Next'}
            fullWidth
            loading={loading}
            onPress={handleNext}
          />
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
  progressContainer: {
    marginTop: 60,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    marginBottom: 24,
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  roleCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleIcon: {
    fontSize: 32,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  servicesContainer: {
    marginTop: 16,
    maxHeight: 400,
  },
  servicesContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  bottomContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
});