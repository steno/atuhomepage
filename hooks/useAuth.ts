import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getUserProfile, saveUserProfile } from '@/utils/firebase';
import { User, UserRole } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const auth = getAuth();
  
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        setUser(userProfile);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError('Failed to load user profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        loadUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [auth, loadUserProfile]);
  
  const updateUserRole = useCallback(async (userId: string, role: UserRole, additionalData: Partial<User> = {}) => {
    try {
      setLoading(true);
      const userData = {
        role,
        ...additionalData,
      };
      
      await saveUserProfile(userId, userData);
      await loadUserProfile(userId);
    } catch (err) {
      setError('Failed to update user role');
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);
  
  return {
    user,
    firebaseUser,
    loading,
    error,
    updateUserRole,
    refreshUser: () => firebaseUser && loadUserProfile(firebaseUser.uid),
  };
}