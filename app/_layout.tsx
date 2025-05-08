import { useEffect, useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, useColorScheme, TouchableOpacity, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { Sun, Moon } from 'lucide-react-native';
import Logo from '@/components/Logo';

// Create a context to manage theme globally
import { createContext } from 'react';
export const ThemeContext = createContext({
  colorScheme: 'light' as 'light' | 'dark',
  toggleColorScheme: () => {},
});

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(systemColorScheme ?? 'light');
  const colors = Colors[colorScheme];
  
  useFrameworkReady();

  const toggleColorScheme = useCallback(() => {
    setColorScheme(current => current === 'light' ? 'dark' : 'light');
  }, []);

  // Initialize theme for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Add theme class to root element
      document.documentElement.classList.remove('light-theme', 'dark-theme');
      document.documentElement.classList.add(`${colorScheme}-theme`);
      
      // Add global styles
      let style = document.getElementById('theme-styles');
      if (!style) {
        style = document.createElement('style');
        style.id = 'theme-styles';
        document.head.appendChild(style);
      }
      
      style.textContent = `
        :root {
          color-scheme: ${colorScheme};
        }
        
        body, #root, #__next {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background-color: ${colors.background};
          color: ${colors.text};
        }
        
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        
        .light-theme {
          background-color: ${Colors.light.background};
          color: ${Colors.light.text};
        }
        
        .dark-theme {
          background-color: ${Colors.dark.background};
          color: ${Colors.dark.text};
        }
      `;

      // Add meta theme-color
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', colorScheme === 'dark' ? Colors.dark.background : Colors.light.background);
    }
  }, [colorScheme, colors]);

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack screenOptions={{ 
            headerShown: true,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF',
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerRight: () => (
              <TouchableOpacity 
                onPress={toggleColorScheme}
                style={{ marginRight: 16, padding: 8 }}
                accessibilityLabel="Toggle theme"
                accessibilityRole="button"
              >
                {colorScheme === 'light' ? (
                  <Moon size={24} color={colors.text} />
                ) : (
                  <Sun size={24} color={colors.inactive} />
                )}
              </TouchableOpacity>
            ),
          }}>
            <Stack.Screen name="(tabs)" options={{ 
              headerTitle: () => <Logo size="small" />,
              headerTitleAlign: 'center',
            }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </GestureHandlerRootView>
    </ThemeContext.Provider>
  );
}