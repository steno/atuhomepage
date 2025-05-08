import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { User, ServiceRequest, ServiceType, Message } from '@/types';

// Initialize Firebase
const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
});

const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to ensure user is authenticated
const ensureAuth = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return user;
};

export const createUser = async (email: string, password: string): Promise<string> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
  } catch (error: any) {
    console.error('Error logging in:', error);
    throw new Error(error.message);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error logging out:', error);
    throw new Error(error.message);
  }
};

export const getCurrentUserId = (): string | null => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

export const saveUserProfile = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: Date.now(),
      id: userId
    }, { merge: true });
  } catch (error: any) {
    console.error('Error saving user profile:', error);
    throw new Error(error.message);
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    throw new Error(error.message);
  }
};

export const updateUserProfile = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: Date.now()
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw new Error(error.message);
  }
};

export const createServiceRequest = async (requestData: Omit<ServiceRequest, 'id'>): Promise<string> => {
  try {
    const requestsCollection = collection(db, 'serviceRequests');
    const newRequestRef = doc(requestsCollection);
    
    await setDoc(newRequestRef, {
      ...requestData,
      id: newRequestRef.id,
      createdAt: Date.now()
    });
    
    return newRequestRef.id;
  } catch (error: any) {
    console.error('Error creating service request:', error);
    throw new Error(error.message);
  }
};

export const findNearbyProviders = async (serviceType: ServiceType, radius: number, userLocation: { latitude: number, longitude: number }): Promise<User[]> => {
  try {
    const providersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'provider'),
      where('serviceType', '==', serviceType),
      where('isAvailable', '==', true)
    );
    
    const querySnapshot = await getDocs(providersQuery);
    const providers: User[] = [];
    
    querySnapshot.forEach((doc) => {
      providers.push(doc.data() as User);
    });
    
    return providers;
  } catch (error: any) {
    console.error('Error finding nearby providers:', error);
    throw new Error(error.message);
  }
};

export const updateServiceRequestStatus = async (requestId: string, status: ServiceRequest['status'], providerId?: string): Promise<void> => {
  try {
    const requestRef = doc(db, 'serviceRequests', requestId);
    const request = await getDoc(requestRef);
    
    if (!request.exists()) {
      throw new Error('Service request not found');
    }
    
    const updateData: Record<string, any> = { 
      status,
      updatedAt: Date.now()
    };
    
    if (providerId) {
      updateData.providerId = providerId;
    }
    
    if (status === 'accepted') {
      updateData.acceptedAt = Date.now();
    } else if (status === 'completed') {
      updateData.completedAt = Date.now();
    }
    
    await updateDoc(requestRef, updateData);
  } catch (error: any) {
    console.error('Error updating service request status:', error);
    throw new Error(error.message);
  }
};

export const sendMessage = async (messageData: Omit<Message, 'id'>): Promise<string> => {
  try {
    const messagesCollection = collection(db, 'messages');
    const newMessageRef = doc(messagesCollection);
    
    await setDoc(newMessageRef, {
      ...messageData,
      id: newMessageRef.id,
      createdAt: Date.now()
    });
    
    return newMessageRef.id;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new Error(error.message);
  }
};