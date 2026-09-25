import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/theme';

const ITEMS = [
  { title: 'Categorías', subtitle: 'Crea y organiza las categorías', icon: 'grid-outline', href: '/admin/categories' },
  { title: 'Productos', subtitle: 'Publica y edita productos', icon: 'cube-outline', href: '/admin/products' },
  { title: 'Pedidos', subtitle: 'Revisa y confirma pagos', icon: 'receipt-outline', href: '/admin/orders' },
  { title: 'Método de pago', subtitle: 'QR y llave Bre-B / Nequi', icon: 'qr-code-outline', href: '/admin/settings' },
] as const;

export default function AdminDashboard() {
  const { loading, isAdmin } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Panel admin' }} />
        <EmptyState title="Acceso restringido" subtitle="Esta sección es solo para el administrador de Yessmer." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Panel admin' }} />
      {ITEMS.map((item) => (
        <Pressable key={item.href} style={styles.card} onPress={() => router.push(item.href)}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF3E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
