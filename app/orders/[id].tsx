import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem } from '../../types';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { COLORS } from '../../constants/theme';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
      setOrder(o as Order);
      const { data: its } = await supabase.from('order_items').select('*').eq('order_id', id);
      setItems(its ?? []);
    })();
  }, [id]);

  if (!order) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Detalle del pedido' }} />
      <View style={styles.header}>
        <Text style={styles.id}>Pedido #{order.id.slice(0, 8)}</Text>
        <OrderStatusBadge status={order.status} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Envío a</Text>
            <Text style={styles.infoValue}>{order.shipping_address}</Text>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{order.shipping_phone}</Text>
            {order.payment_proof_url && (
              <>
                <Text style={styles.infoLabel}>Comprobante enviado</Text>
                <Image source={{ uri: order.payment_proof_url }} style={styles.proof} />
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.quantity}x {item.product_name}
            </Text>
            <Text style={styles.itemPrice}>${(item.unit_price * item.quantity).toLocaleString('es-CO')}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.total.toLocaleString('es-CO')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  id: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  infoLabel: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  proof: { width: 120, height: 120, borderRadius: 8, marginTop: 8 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemName: { flex: 1, color: COLORS.text, marginRight: 8 },
  itemPrice: { fontWeight: '700', color: COLORS.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, marginTop: 4 },
  totalLabel: { fontSize: 15, color: COLORS.muted },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
});
