import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/theme';

export default function MyOrders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/orders');
  }, [session]);

  if (!session) return null;

  if (orders.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Mis pedidos' }} />
        <EmptyState title="Aún no tienes pedidos" subtitle="Cuando compres algo, aparecerá aquí." />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={orders}
      keyExtractor={(o) => o.id}
      ListHeaderComponent={<Stack.Screen options={{ title: 'Mis pedidos' }} />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/orders/${item.id}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.id}>Pedido #{item.id.slice(0, 8)}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('es-CO')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.total}>${item.total.toLocaleString('es-CO')}</Text>
            <OrderStatusBadge status={item.status} />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  id: { fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  date: { color: COLORS.muted, fontSize: 12 },
  total: { fontWeight: '800', color: COLORS.text, marginBottom: 6 },
});
