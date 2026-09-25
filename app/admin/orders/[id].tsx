import { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../../../lib/alert';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Order, OrderItem } from '../../../types';
import OrderStatusBadge from '../../../components/OrderStatusBadge';
import PrimaryButton from '../../../components/PrimaryButton';
import EmptyState from '../../../components/EmptyState';
import ItemRow from '../../../components/ItemRow';
import { COLORS } from '../../../constants/theme';

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
    setOrder(o as Order);
    const { data: its } = await supabase.from('order_items').select('*, products(images)').eq('order_id', id);
    setItems(its ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Detalle de pedido' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }
  if (!order) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  const updateStatus = async (status: Order['status']) => {
    setUpdating(true);
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', order.id);
      if (error) throw error;

      if (status === 'confirmado') {
        for (const item of items) {
          if (!item.product_id) continue;
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod) {
            const newStock = Math.max(0, prod.stock - item.quantity);
            await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
          }
        }
      }
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo actualizar');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Detalle de pedido' }} />
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
                <Text style={styles.infoLabel}>Comprobante de pago</Text>
                <Image source={{ uri: order.payment_proof_url }} style={styles.proof} resizeMode="contain" />
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ItemRow image={item.products?.images?.[0]} name={item.product_name} quantity={item.quantity} unitPrice={item.unit_price} />
        )}
        ListFooterComponent={
          <View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toLocaleString('es-CO')}</Text>
            </View>
            {(order.status === 'pago_reportado' || order.status === 'pendiente_pago') && (
              <>
                <PrimaryButton title="Confirmar pago" onPress={() => updateStatus('confirmado')} loading={updating} />
                <View style={{ height: 10 }} />
                <PrimaryButton title="Rechazar pago" variant="danger" onPress={() => updateStatus('rechazado')} loading={updating} />
              </>
            )}
            {order.status === 'confirmado' && (
              <PrimaryButton title="Marcar como enviado" variant="dark" onPress={() => updateStatus('enviado')} loading={updating} />
            )}
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
  proof: { width: '100%', height: 260, borderRadius: 8, marginTop: 8, backgroundColor: '#000' },
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, marginBottom: 14 },
  totalLabel: { fontSize: 15, color: COLORS.muted },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
});
