import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.dark },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: COLORS.bg },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
