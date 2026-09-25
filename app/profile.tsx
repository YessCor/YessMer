import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../lib/alert';
import { router, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Screen from '../components/Screen';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function Profile() {
  const { session, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/profile');
  }, [session]);

  if (!session) return null;

  const displayName = profile?.full_name || session.user.email || '';

  return (
    <Screen style={{ maxWidth: 520 }}>
      <Stack.Screen options={{ title: 'Mi perfil' }} />
      <View style={styles.card}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{session.user.email}</Text>
          {isAdmin && (
            <View style={styles.role}>
              <Text style={styles.roleText}>Administrador</Text>
            </View>
          )}
        </View>
      </View>

      <PrimaryButton title="Editar perfil" icon="create-outline" onPress={() => router.push('/edit-profile')} />
      <View style={{ height: 12 }} />
      <PrimaryButton title="Mis pedidos" icon="receipt-outline" variant="outline" onPress={() => router.push('/orders')} />
      <View style={{ height: 12 }} />
      {isAdmin && (
        <>
          <PrimaryButton title="Panel de administración" icon="settings-outline" variant="dark" onPress={() => router.push('/admin')} />
          <View style={{ height: 12 }} />
        </>
      )}
      <PrimaryButton
        title="Cerrar sesión"
        icon="log-out-outline"
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 18, marginBottom: 20, ...SHADOW },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  email: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  role: { alignSelf: 'flex-start', backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  roleText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '800' },
});
