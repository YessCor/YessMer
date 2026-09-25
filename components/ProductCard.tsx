import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Product } from '../types';
import { COLORS, formatPrice, RADIUS, SHADOW } from '../constants/theme';

export const discountPercent = (p: Product) =>
  p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;

export default function ProductCard({ product, width }: { product: Product; width: number }) {
  const image = product.images?.[0];
  const discount = discountPercent(product);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>Sin imagen</Text>
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discount}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Agotado</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {discount > 0 && <Text style={styles.oldPrice}>{formatPrice(product.compare_at_price!)}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 14, ...SHADOW },
  imageWrap: { aspectRatio: 1, backgroundColor: '#EEF0F4' },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  discount: { position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.danger, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  soldOut: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(17,24,39,0.75)', paddingVertical: 5, alignItems: 'center' },
  soldOutText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  info: { padding: 12 },
  name: { fontSize: 13, color: COLORS.text, minHeight: 34, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 4 },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  oldPrice: { fontSize: 12, color: COLORS.muted, textDecorationLine: 'line-through', marginLeft: 6 },
});
