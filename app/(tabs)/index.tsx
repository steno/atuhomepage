import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import Button from '@/components/Button';
import { ServiceCard } from '@/components';
import Colors from '@/constants/Colors';
import { ThemeContext } from '../_layout';
import { SERVICES } from '@/constants/Services';
import { createServiceRequest, updateUserProfile, getCurrentUserId } from '@/utils/firebase';
import { getCurrentLocation, getAddressFromCoordinates } from '@/utils/location';
import { setupNotifications } from '@/utils/notifications';
import { MapPin, ChevronRight, RefreshCw } from 'lucide-react-native';

export default function HomeScreen() {
  const { colorScheme } = useContext(ThemeContext);
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  
  const { user, loading: userLoading, refreshUser } = useAuth();
  const { requests, loading: requestsLoading } = useServiceRequests(user);
  
  const [selectedService, setSelectedService] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [findingService, setFindingService] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const activeRequest = requests?.find(req => req.status === 'pending' || req.status === 'accepted');
  
  const isMobile = width < 500;
  const itemsPerPage = isMobile ? 4 : width < 768 ? 6 : 8;
  const totalPages = Math.ceil(SERVICES.length / itemsPerPage);
  
  useEffect(() => {
    if (user?.role === 'provider') {
      setupNotifications();
    }
  }, [user]);
  
  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        
        const address = await getAddressFromCoordinates(currentLocation.latitude, currentLocation.longitude);
        if (address) {
          setLocationName(address.name || 'Location found');
          
          if (user && user.id) {
            await updateUserProfile(user.id, {
              location: currentLocation
            });
            refreshUser();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setLocationLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLocation();
  }, []);
  
  const handleFindService = async () => {
    if (!selectedService || !location) return;
    
    setFindingService(true);
    
    try {
      const requestData = {
        clientId: getCurrentUserId() || '',
        serviceType: selectedService,
        status: 'pending',
        location: {
          ...location,
          address: locationName
        },
        createdAt: Date.now(),
      };
      
      await createServiceRequest(requestData);
      router.push('/service-search');
    } catch (error) {
      console.error('Error creating service request:', error);
    } finally {
      setFindingService(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.locationContainer}
          onPress={fetchLocation}
          disabled={locationLoading}
          activeOpacity={0.7}
        >
          <MapPin size={18} color={colors.inactive} />
          <Text style={[styles.locationText, { color: colors.inactive }]}>
            {locationLoading ? 'Fetching location...' : 
              locationName ? locationName :
              location ? 'Location found' : 
              'Location unavailable'}
          </Text>
          {locationLoading ? (
            <ActivityIndicator size="small" color={colors.inactive} style={styles.locationIcon} />
          ) : (
            <RefreshCw 
              size={14} 
              color={colors.inactive} 
              style={styles.locationIcon}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.findServiceCard}>
          <Text style={[styles.findServiceTitle, { color: colors.text }]}>
            Find a Service Provider
          </Text>
          
          <Text style={[styles.findServiceSubtitle, { color: colors.inactive }]}>
            Select a service and get matched with nearby professionals
          </Text>
        </View>
        
        <View style={styles.servicesSection}>
          <Text style={[styles.servicesTitle, { color: colors.text }]}>
            Available Services
          </Text>
          
          <View style={styles.scrollHint}>
            <Text style={[styles.scrollHintText, { color: colors.inactive }]}>
              Scroll to see more
            </Text>
            <ChevronRight size={16} color={colors.inactive} />
          </View>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.servicesScrollContent}
          pagingEnabled={isMobile}
          onScroll={(e) => {
            if (isMobile) {
              const offset = e.nativeEvent.contentOffset.x;
              setCurrentPage(Math.round(offset / width));
            }
          }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={isMobile ? width : undefined}
        >
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.type}
              type={service.type}
              selected={selectedService === service.type}
              onPress={() => setSelectedService(service.type)}
            />
          ))}
        </ScrollView>
        
        {isMobile && (
          <View style={styles.paginationContainer}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: currentPage === index ? colors.primary : colors.inactive,
                    width: currentPage === index ? 20 : 8,
                  }
                ]}
              />
            ))}
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Find Now"
            fullWidth
            loading={findingService}
            disabled={!selectedService || !location || findingService}
            onPress={handleFindService}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  findServiceCard: {
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  findServiceTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  findServiceSubtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  locationIcon: {
    marginLeft: 8,
  },
  servicesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollHintText: {
    fontSize: 14,
    marginRight: 4,
  },
  servicesScrollContent: {
    paddingRight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    height: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
});