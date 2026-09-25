import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import EmptyState from '../components/EmptyState';
import Screen from '../components/Screen';
import { COLORS, formatPrice, RADIUS, SHADOW } from '../constants/theme';

export default function Cart() {
  const { items, setQuantity, removeItem, total } = useCart();
  const { session } = useAuth();

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Carrito' }} />
        <EmptyState icon="cart-outline" title="Tu carrito está vacío" subtitle="Agrega productos desde el catálogo para verlos aquí." />
        <View style={{ padding: 20, alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: 320 }}>
            <PrimaryButton title="Ver catálogo" onPress={() => router.replace('/')} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Screen style={{ maxWidth: 720 }}>
      <Stack.Screen options={{ title: 'Carrito' }} />
      {items.map((item) => (
        <View key={item.product.id} style={styles.row}>
          {item.product.images?.[0] ? (
            <Image source={{ uri: item.product.images[0] }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: '#EEF0F4' }]} />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
            <Text style={styles.price}>{formatPrice(item.product.price)}</Text>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => setQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}>
                <Ionicons name="remove" size={16} color={COLORS.text} />
              </Pressable>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <Pressable onPress={() => setQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}>
                <Ionicons name="add" size={16} color={COLORS.text} />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Text style={styles.subtotal}>{formatPrice(item.product.price * item.quantity)}</Text>
              <Pressable onPress={() => removeItem(item.product.id)} style={{ marginLeft: 14 }}>
                <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.summary}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <PrimaryButton title="Ir a pagar" onPress={() => router.push(session ? '/checkout' : '/login?redirect=/checkout')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 12, marginBottom: 12, ...SHADOW },
  thumb: { width: 76, height: 76, borderRadius: RADIUS.md },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  price: { fontSize: 13, color: COLORS.muted, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  qtyText: { marginHorizontal: 12, fontWeight: '700', color: COLORS.text },
  subtotal: { fontWeight: '800', color: COLORS.text },
  summary: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginTop: 4, ...SHADOW },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 15, color: COLORS.muted },
  totalValue: { fontSize: 24, fontWeight: '800', color: COLORS.text },
});
