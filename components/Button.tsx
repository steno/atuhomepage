import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Platform,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useContext } from 'react';
import { ThemeContext } from '@/app/_layout';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  ...rest
}: ButtonProps) {
  const { colorScheme } = useContext(ThemeContext);
  const colors = Colors[colorScheme];
  
  const getBackgroundColor = () => {
    if (rest.disabled) {
      return colorScheme === 'light' ? '#d3d3d3' : '#374151';
    }
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return 'transparent';
      case 'danger':
        return colors.error;
      default:
        return colors.primary;
    }
  };
  
  const getBorderColor = () => {
    if (rest.disabled) {
      return colorScheme === 'light' ? '#d3d3d3' : '#374151';
    }
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return 'transparent';
    }
  };
  
  const getTextColor = () => {
    if (rest.disabled) {
      return colorScheme === 'light' ? '#757575' : '#6B7280';
    }
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'primary':
      case 'secondary':
      case 'danger':
        return colorScheme === 'light' ? '#1F2937' : '#1F2937';
      default:
        return colorScheme === 'light' ? '#1F2937' : '#1F2937';
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 24 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          width: fullWidth ? '100%' : undefined,
          ...getPadding(),
          ...Platform.select({
            web: {
              cursor: rest.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                transform: 'translateY(-1px)',
                opacity: 0.95,
              },
            },
          }),
        },
        !rest.disabled && styles.shadow,
        style
      ]}
      disabled={loading || rest.disabled}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon && (
            <View style={styles.iconContainer}>
              {React.cloneElement(leftIcon as React.ReactElement, {
                color: getTextColor(),
                size: getFontSize() + 2
              })}
            </View>
          )}
          <Text 
            style={[
              styles.text, 
              { 
                color: getTextColor(),
                fontSize: getFontSize(),
                fontWeight: '600',
              },
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
});