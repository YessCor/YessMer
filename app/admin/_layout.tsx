import { Stack } from 'expo-router';
import BackButton from '../../components/BackButton';
import { COLORS } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.dark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.bg },
        // En el panel principal el botón sale al inicio de la tienda.
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen name="index" options={{ headerLeft: () => <BackButton fallback="/" /> }} />
    </Stack>
  );
}
