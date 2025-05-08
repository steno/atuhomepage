import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { ThemeContext } from '@/app/_layout';
import { ServiceType } from '@/types';
import { SERVICES } from '@/constants/Services';
import * as Icons from 'lucide-react-native';

interface ServiceCardProps {
  type: ServiceType;
  selected?: boolean;
  onPress?: () => void;
}

export default function ServiceCard({
  type,
  selected = false,
  onPress
}: ServiceCardProps) {
  const { colorScheme } = useContext(ThemeContext);
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  
  const isMobile = width < 500;
  const gap = 16;
  const padding = 20;
  const numColumns = width < 500 ? 2 : width < 768 ? 3 : 4;
  const cardSize = isMobile ? 139 : Math.floor((width - (padding * 2) - (gap * (numColumns - 1))) / numColumns);
  
  const iconContainerSize = Math.floor(cardSize * 0.45);
  const iconSize = Math.floor(iconContainerSize * 0.6);
  const fontSize = Math.min(Math.max(Math.floor(cardSize * 0.12), 12), 14);
  
  const service = SERVICES.find(s => s.type === type);
  
  if (!service) {
    return null;
  }
  
  const IconComponent = (Icons as Record<string, any>)[service.icon.charAt(0).toUpperCase() + service.icon.slice(1)];
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selected ? colors.primary : colorScheme === 'dark' ? colors.card : '#F9F9F9',
          borderColor: selected ? colors.primary : colors.border,
          width: cardSize,
          height: cardSize,
          margin: gap / 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: selected ? 'rgba(0, 0, 0, 0.1)' : colors.subtle,
          width: iconContainerSize,
          height: iconContainerSize,
        }
      ]}>
        {IconComponent && (
          <IconComponent
            size={iconSize}
            color={selected ? '#1F2937' : colors.primary}
          />
        )}
      </View>
      <Text
        style={[
          styles.title,
          { 
            color: selected ? '#1F2937' : colors.text,
            fontSize,
            marginTop: Math.floor(cardSize * 0.08),
            paddingHorizontal: Math.floor(cardSize * 0.08),
          }
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {service.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  }
});