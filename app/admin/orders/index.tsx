import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Order } from '../../../types';
import OrderStatusBadge from '../../../components/OrderStatusBadge';
import EmptyState from '../../../components/EmptyState';
import { COLORS } from '../../../constants/theme';

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Pedidos' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={orders}
      keyExtractor={(o) => o.id}
      ListHeaderComponent={<Stack.Screen options={{ title: 'Pedidos' }} />}
      ListEmptyComponent={<EmptyState title="Todavía no hay pedidos" />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/admin/orders/${item.id}`)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.id}>Pedido #{item.id.slice(0, 8)}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString('es-CO')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  id: { fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  date: { color: COLORS.muted, fontSize: 12 },
  total: { fontWeight: '800', color: COLORS.text, marginBottom: 6 },
});
