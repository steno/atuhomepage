import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Alert, Switch, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import TextField from '@/components/TextField';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { SERVICES } from '@/constants/Services';
import { updateUserProfile, logoutUser, getCurrentUserId } from '@/utils/firebase';
import { Settings, User, LogOut, Phone, Mail, MapPin } from 'lucide-react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const { user, loading: userLoading, refreshUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    // Simple phone validation (optional field)
    if (phone && !/^\+?[0-9]{10,15}$/.test(phone.trim())) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userId = getCurrentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      await updateUserProfile(userId, {
        name,
        phone,
      });
      
      await refreshUser();
      setIsEditing(false);
    } catch (err: any) {
      setError('Failed to update profile');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleAvailability = async (value: boolean) => {
    if (!user?.id) return;
    
    try {
      await updateUserProfile(user.id, { isAvailable: value });
      refreshUser();
    } catch (error) {
      console.error('Toggle availability error:', error);
    }
  };
  
  if (userLoading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.inactive }]}>
          Loading profile...
        </Text>
      </View>
    );
  }
  
  if (isEditing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity 
              onPress={() => setIsEditing(false)}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          <TextField
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
          
          <TextField
            label="Phone"
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          
          <Button
            title="Save Changes"
            fullWidth
            loading={loading}
            onPress={handleSaveProfile}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.subtle }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.name}
          </Text>
          
          <View style={[
            styles.roleBadge, 
            { 
              backgroundColor: user.role === 'client' ? colors.client : colors.provider,
              opacity: 0.9
            }
          ]}>
            <Text style={styles.roleText}>
              {user.role === 'client' ? 'Client' : 'Service Provider'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personal Information
          </Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <User size={18} color={colors.inactive} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.inactive }]}>Name:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Mail size={18} color={colors.inactive} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.inactive }]}>Email:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Phone size={18} color={colors.inactive} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.inactive }]}>Phone:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.phone || 'Not provided'}
            </Text>
          </View>
          
          {user.location && (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MapPin size={18} color={colors.inactive} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.inactive }]}>Location:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                Location services enabled
              </Text>
            </View>
          )}
        </View>
        
        {user.role === 'provider' && (
          <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Service Information
            </Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.inactive }]}>Service Type:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {SERVICES.find(s => s.type === user.serviceType)?.title || 'Not specified'}
              </Text>
            </View>
            
            <View style={styles.availabilityRow}>
              <Text style={[styles.availabilityText, { color: colors.text }]}>
                Available for Service
              </Text>
              <Switch
                value={user.isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: colors.inactive, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          <Button
            title="Edit Profile"
            fullWidth
            onPress={() => setIsEditing(true)}
            style={{ marginBottom: 12 }}
          />
          
          <Button
            title="Sign Out"
            variant="outline"
            fullWidth
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 8,
    width: 20,
  },
  infoLabel: {
    fontSize: 14,
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 24,
  },
});