import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import { COLORS } from '../constants/theme';

export default function Cart() {
  const { items, setQuantity, removeItem, total } = useCart();
  const { session } = useAuth();

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Carrito' }} />
        <EmptyState title="Tu carrito está vacío" subtitle="Agrega productos desde el catálogo para verlos aquí." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Carrito' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.product.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.product.images?.[0] ? (
              <Image source={{ uri: item.product.images[0] }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: '#EEE' }]} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>${item.product.price.toLocaleString('es-CO')}</Text>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => setQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={16} color={COLORS.text} />
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable onPress={() => setQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={16} color={COLORS.text} />
                </Pressable>
                <Pressable onPress={() => removeItem(item.product.id)} style={{ marginLeft: 16 }}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('es-CO')}</Text>
        </View>
        <PrimaryButton
          title="Ir a pagar"
          onPress={() => router.push(session ? '/checkout' : '/login?redirect=/checkout')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  name: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { marginHorizontal: 12, fontWeight: '700', color: COLORS.text },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 15, color: COLORS.muted },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
});
