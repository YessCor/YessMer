import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Vuelve atrás; si no hay historial (p. ej. tras recargar la página) va al panel admin.
export default function BackButton({ fallback = '/admin' }: { fallback?: string }) {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as any))}
      hitSlop={10}
      style={{ marginRight: 14, marginLeft: 4 }}
    >
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </Pressable>
  );
}
