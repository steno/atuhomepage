import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Firestore, getFirestore } from 'firebase/firestore';
import { ServiceRequest, User } from '@/types';
import { getCurrentUserId } from '@/utils/firebase';

export function useServiceRequests(user: User | null) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const db = getFirestore();
  
  const fetchRequests = useCallback(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);
    
    let requestsQuery;
    
    if (user.role === 'client') {
      requestsQuery = query(
        collection(db, 'serviceRequests'),
        where('clientId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    } else {
      requestsQuery = query(
        collection(db, 'serviceRequests'),
        where('providerId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const requestsData: ServiceRequest[] = [];
        snapshot.forEach((doc) => {
          requestsData.push(doc.data() as ServiceRequest);
        });
        setRequests(requestsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching requests:', err);
        setError('Failed to load service requests');
        setLoading(false);
      }
    );
    
    return unsubscribe;
  }, [db, user]);
  
  useEffect(() => {
    const unsubscribe = fetchRequests();
    return () => unsubscribe();
  }, [fetchRequests]);
  
  return {
    requests,
    loading,
    error,
    refresh: fetchRequests,
  };
}