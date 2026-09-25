import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, formatPrice, RADIUS } from '../constants/theme';

// Fila de producto con foto: se usa en el resumen de pedidos y del checkout.
export default function ItemRow({
  image,
  name,
  quantity,
  unitPrice,
}: {
  image?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
}) {
  return (
    <View style={styles.row}>
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.placeholder]}>
          <Ionicons name="image-outline" size={20} color={COLORS.muted} />
        </View>
      )}
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text numberOfLines={2} style={styles.name}>{name}</Text>
        <Text style={styles.qty}>{quantity} x {formatPrice(unitPrice)}</Text>
      </View>
      <Text style={styles.price}>{formatPrice(unitPrice * quantity)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: RADIUS.md, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  thumb: { width: 52, height: 52, borderRadius: RADIUS.sm },
  placeholder: { backgroundColor: '#EEF0F4', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  qty: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  price: { fontWeight: '800', color: COLORS.text },
});
