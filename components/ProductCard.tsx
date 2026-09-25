import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Product } from '../types';
import { COLORS } from '../constants/theme';

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/product/${product.id}`)}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={{ color: COLORS.muted }}>Sin imagen</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toLocaleString('es-CO')}</Text>
      {product.stock === 0 && <Text style={styles.outOfStock}>Agotado</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrap: { aspectRatio: 1, borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, color: COLORS.text, marginBottom: 4, minHeight: 34 },
  price: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  outOfStock: { color: COLORS.danger, fontSize: 12, marginTop: 4, fontWeight: '600' },
});
