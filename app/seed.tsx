import { View, StyleSheet, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { seedDatabase } from '@/utils/seed';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';

export default function SeedScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await seedDatabase();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to seed database');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Database Seeding
      </Text>
      
      <Text style={[styles.description, { color: colors.inactive }]}>
        This will populate the database with test data including service providers, clients, service requests, and messages.
      </Text>
      
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}
      
      {success && (
        <View style={[styles.successContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
          <Text style={[styles.successText, { color: colors.success }]}>
            Database seeded successfully! You can now log in with any of the test accounts.
          </Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title="Seed Database"
          loading={loading}
          onPress={handleSeed}
          style={{ marginBottom: 12 }}
        />
        
        <Button
          title="Go to Welcome Screen"
          variant="outline"
          onPress={() => router.replace('/welcome')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  successContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});