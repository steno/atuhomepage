export type UserRole = 'client' | 'provider';

export type ServiceType = 
  | 'electrician'
  | 'plumber'
  | 'carpenter' 
  | 'painter'
  | 'cleaner'
  | 'gardener'
  | 'handyman'
  | 'other';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  serviceType?: ServiceType;
  isAvailable?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: number;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  providerId?: string;
  createdAt: number;
  acceptedAt?: number;
  completedAt?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  requestId: string;
  createdAt: number;
  read: boolean;
}