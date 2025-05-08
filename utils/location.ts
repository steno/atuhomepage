import * as Location from 'expo-location';

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation() {
  const hasPermission = await requestLocationPermission();
  
  if (!hasPermission) {
    return null;
  }
  
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

export async function getAddressFromCoordinates(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;
      
      // Find the most relevant component for display
      const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;
      const subLocality = addressComponents.find(c => c.types.includes('sublocality'))?.long_name;
      const route = addressComponents.find(c => c.types.includes('route'))?.long_name;
      
      // Prioritize the most specific location name
      const locationName = subLocality || locality || route || result.formatted_address.split(',')[0];
      
      return {
        name: locationName,
        formattedAddress: result.formatted_address,
        street: route,
        city: locality,
        country: addressComponents.find(c => c.types.includes('country'))?.long_name,
        postalCode: addressComponents.find(c => c.types.includes('postal_code'))?.long_name,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
}