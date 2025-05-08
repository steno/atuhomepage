import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle 
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  secureTextEntry?: boolean;
}

export default function TextField({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  rightIcon,
  leftIcon,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  const borderColor = error ? colors.error : colors.border;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        { 
          borderColor,
          backgroundColor: colorScheme === 'dark' ? colors.subtle : '#F9F9F9',
        },
        inputStyle
      ]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            { 
              color: colors.text,
              paddingLeft: leftIcon ? 0 : 12,
              paddingRight: rightIcon || secureTextEntry ? 0 : 12
            }
          ]}
          placeholderTextColor={colors.inactive}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...rest}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={togglePasswordVisibility}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={colors.inactive} />
            ) : (
              <Eye size={20} color={colors.inactive} />
            )}
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingVertical: 12,
  },
  leftIconContainer: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  }
});