import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/EmptyState';
import Screen from '../../components/Screen';
import { COLORS, formatPrice, RADIUS, SHADOW } from '../../constants/theme';

const ITEMS = [
  { title: 'Productos', subtitle: 'Publica productos, precios y stock', icon: 'cube-outline', href: '/admin/products' },
  { title: 'Categorías', subtitle: 'Crea y organiza las categorías', icon: 'grid-outline', href: '/admin/categories' },
  { title: 'Pedidos', subtitle: 'Revisa y confirma pagos', icon: 'receipt-outline', href: '/admin/orders' },
  { title: 'Método de pago', subtitle: 'QR y llave Bre-B / Nequi', icon: 'qr-code-outline', href: '/admin/settings' },
] as const;

type Stats = { products: number; lowStock: number; toReview: number; sales: number };

export default function AdminDashboard() {
  const { loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;
      (async () => {
        const [{ data: prods }, { data: orders }] = await Promise.all([
          supabase.from('products').select('stock'),
          supabase.from('orders').select('status,total'),
        ]);
        setStats({
          products: prods?.length ?? 0,
          lowStock: prods?.filter((p) => p.stock <= 5).length ?? 0,
          toReview: orders?.filter((o) => o.status === 'pago_reportado').length ?? 0,
          sales: orders?.filter((o) => o.status === 'confirmado' || o.status === 'enviado').reduce((s, o) => s + Number(o.total), 0) ?? 0,
        });
      })();
    }, [isAdmin])
  );

  if (loading) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Panel admin' }} />
        <EmptyState icon="lock-closed-outline" title="Acceso restringido" subtitle="Esta sección es solo para el administrador de Yessmer." />
      </View>
    );
  }

  const cards = [
    { label: 'Ventas confirmadas', value: stats ? formatPrice(stats.sales) : '—', icon: 'cash-outline', color: COLORS.success },
    { label: 'Pagos por revisar', value: stats ? String(stats.toReview) : '—', icon: 'time-outline', color: COLORS.warning },
    { label: 'Productos', value: stats ? String(stats.products) : '—', icon: 'cube-outline', color: COLORS.primary },
    { label: 'Poco stock', value: stats ? String(stats.lowStock) : '—', icon: 'alert-circle-outline', color: COLORS.danger },
  ];

  return (
    <Screen style={{ maxWidth: 820 }}>
      <Stack.Screen options={{ title: 'Panel admin' }} />
      <View style={styles.statsGrid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.stat}>
            <Ionicons name={c.icon as any} size={20} color={c.color} />
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.quickAdd} onPress={() => router.push('/admin/products/new')}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.quickAddText}>Publicar nuevo producto</Text>
      </Pressable>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  stat: { flexGrow: 1, flexBasis: 150, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, ...SHADOW },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  quickAdd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: 16, marginBottom: 14 },
  quickAddText: { color: '#fff', fontWeight: '800', fontSize: 15, marginLeft: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
