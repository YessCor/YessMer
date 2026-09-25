import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../constants/theme';

export default function Profile() {
  const { session, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/profile');
  }, [session]);

  if (!session) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mi perfil' }} />
      <View style={styles.card}>
        <Text style={styles.name}>{profile?.full_name || session.user.email}</Text>
        <Text style={styles.email}>{session.user.email}</Text>
      </View>

      <PrimaryButton title="Mis pedidos" variant="outline" onPress={() => router.push('/orders')} />
      <View style={{ height: 12 }} />
      {isAdmin && (
        <>
          <PrimaryButton title="Panel de administración" variant="dark" onPress={() => router.push('/admin')} />
          <View style={{ height: 12 }} />
        </>
      )}
      <PrimaryButton
        title="Cerrar sesión"
        variant="danger"
        onPress={() =>
          Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: async () => {
                await signOut();
                router.replace('/');
              },
            },
          ])
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  email: { color: COLORS.muted, fontSize: 13 },
});
