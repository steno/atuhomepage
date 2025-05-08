import { createUser, saveUserProfile, createServiceRequest, sendMessage } from './firebase';
import { ServiceType, UserRole } from '@/types';

const SERVICES: ServiceType[] = [
  'electrician',
  'plumber',
  'carpenter',
  'painter',
  'cleaner',
  'gardener',
  'handyman',
  'other'
];

const PROVIDERS = [
  {
    email: 'john.electrician@test.com',
    password: 'test123',
    name: 'John Smith',
    phone: '+1234567890',
    role: 'provider' as UserRole,
    serviceType: 'electrician' as ServiceType,
    isAvailable: true,
  },
  {
    email: 'mary.plumber@test.com',
    password: 'test123',
    name: 'Mary Johnson',
    phone: '+1234567891',
    role: 'provider' as UserRole,
    serviceType: 'plumber' as ServiceType,
    isAvailable: true,
  },
  {
    email: 'bob.carpenter@test.com',
    password: 'test123',
    name: 'Bob Wilson',
    phone: '+1234567892',
    role: 'provider' as UserRole,
    serviceType: 'carpenter' as ServiceType,
    isAvailable: true,
  }
];

const CLIENTS = [
  {
    email: 'alice.client@test.com',
    password: 'test123',
    name: 'Alice Brown',
    phone: '+1234567893',
    role: 'client' as UserRole,
  },
  {
    email: 'david.client@test.com',
    password: 'test123',
    name: 'David Miller',
    phone: '+1234567894',
    role: 'client' as UserRole,
  }
];

const MOCK_LOCATION = {
  latitude: 40.7128,
  longitude: -74.0060
};

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Create providers
    const providerIds = await Promise.all(
      PROVIDERS.map(async (provider) => {
        const userId = await createUser(provider.email, provider.password);
        await saveUserProfile(userId, {
          id: userId,
          ...provider,
          createdAt: Date.now(),
          location: MOCK_LOCATION
        });
        return userId;
      })
    );
    
    // Create clients
    const clientIds = await Promise.all(
      CLIENTS.map(async (client) => {
        const userId = await createUser(client.email, client.password);
        await saveUserProfile(userId, {
          id: userId,
          ...client,
          createdAt: Date.now(),
          location: MOCK_LOCATION
        });
        return userId;
      })
    );
    
    // Create service requests with different statuses
    const statuses = ['completed', 'accepted', 'pending', 'cancelled'];
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      const clientId = clientIds[i % clientIds.length];
      const providerId = providerIds[i % providerIds.length];
      const status = statuses[i % statuses.length];
      const serviceType = SERVICES[i % SERVICES.length];
      
      const requestData = {
        clientId,
        serviceType,
        status,
        location: MOCK_LOCATION,
        createdAt: Date.now() - (i * 24 * 60 * 60 * 1000), // Spread over past days
        providerId: status !== 'pending' ? providerId : undefined,
        acceptedAt: status === 'accepted' || status === 'completed' ? Date.now() - (i * 12 * 60 * 60 * 1000) : undefined,
        completedAt: status === 'completed' ? Date.now() - (i * 6 * 60 * 60 * 1000) : undefined,
      };
      
      const requestId = await createServiceRequest(requestData);
      requests.push({ id: requestId, ...requestData });
      
      // Add messages for accepted and completed requests
      if (status === 'accepted' || status === 'completed') {
        const messages = [
          {
            senderId: clientId,
            receiverId: providerId,
            text: 'Hi, I need help with my service request',
            requestId,
            createdAt: Date.now() - (i * 24 * 60 * 60 * 1000) + 1000,
            read: true
          },
          {
            senderId: providerId,
            receiverId: clientId,
            text: 'Hello! I can help you with that. What exactly do you need?',
            requestId,
            createdAt: Date.now() - (i * 24 * 60 * 60 * 1000) + 2000,
            read: true
          },
          {
            senderId: clientId,
            receiverId: providerId,
            text: 'Thanks! Here are the details...',
            requestId,
            createdAt: Date.now() - (i * 24 * 60 * 60 * 1000) + 3000,
            read: true
          }
        ];
        
        for (const message of messages) {
          await sendMessage(message);
        }
      }
    }
    
    console.log('Database seeding completed successfully!');
    console.log('\nTest accounts:');
    console.log('\nProviders:');
    PROVIDERS.forEach(p => console.log(`- ${p.email} (${p.serviceType})`));
    console.log('\nClients:');
    CLIENTS.forEach(c => console.log(`- ${c.email}`));
    console.log('\nAll accounts use password: test123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}