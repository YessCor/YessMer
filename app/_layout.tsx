import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { COLORS, MAX_WIDTH } from '../constants/theme';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') document.body.style.backgroundColor = COLORS.bg;
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.dark },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: COLORS.bg, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
          }}
        >
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
