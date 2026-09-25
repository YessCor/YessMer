import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Category, Product } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';
import { discountPercent } from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { COLORS, formatPrice, MAX_WIDTH, RADIUS, SHADOW } from '../../constants/theme';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: winWidth } = useWindowDimensions();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState(0);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(data as Product);
      if (data?.category_id) {
        const { data: cat } = await supabase.from('categories').select('*').eq('id', data.category_id).single();
        setCategory(cat as Category);
      }
    })();
  }, [id]);

  if (!product) return <View style={styles.container} />;

  const wide = winWidth >= 800;
  const images = product.images ?? [];
  const image = images[selected];
  const discount = discountPercent(product);
  const outOfStock = product.stock === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <Stack.Screen options={{ title: product.name }} />
      <View style={[styles.inner, wide && { flexDirection: 'row', padding: 16, columnGap: 24 }]}>
        <View style={wide ? { flex: 1 } : undefined}>
          <View style={[styles.imageBox, wide && { borderRadius: RADIUS.lg }]}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Text style={{ color: COLORS.muted }}>Sin imagen</Text>
              </View>
            )}
          </View>
          {images.length > 1 && (
            <ScrollView horizontal style={{ marginTop: 10, paddingHorizontal: wide ? 0 : 16 }} showsHorizontalScrollIndicator={false}>
              {images.map((uri, i) => (
                <Pressable key={uri} onPress={() => setSelected(i)} style={[styles.thumb, i === selected && styles.thumbActive]}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.body, wide && { flex: 1, padding: 0 }]}>
          {category && <Text style={styles.category}>{category.name}</Text>}
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {discount > 0 && (
              <>
                <Text style={styles.oldPrice}>{formatPrice(product.compare_at_price!)}</Text>
                <View style={styles.discount}>
                  <Text style={styles.discountText}>-{discount}%</Text>
                </View>
              </>
            )}
          </View>
          <View style={[styles.stockPill, { backgroundColor: outOfStock ? COLORS.dangerSoft : COLORS.successSoft }]}>
            <Text style={{ color: outOfStock ? COLORS.danger : COLORS.success, fontWeight: '700', fontSize: 12 }}>
              {outOfStock ? 'Sin stock por el momento' : `${product.stock} disponibles`}
            </Text>
          </View>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
          {product.sku ? <Text style={styles.sku}>SKU: {product.sku}</Text> : null}

          <View style={{ marginTop: 22 }}>
            <PrimaryButton
              title={added ? 'Agregado ✓' : 'Agregar al carrito'}
              icon="cart-outline"
              disabled={outOfStock}
              onPress={() => {
                addItem(product);
                setAdded(true);
                setTimeout(() => setAdded(false), 1200);
              }}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="Comprar ahora"
              variant="dark"
              disabled={outOfStock}
              onPress={() => {
                addItem(product);
                router.push('/checkout');
              }}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH },
  imageBox: { aspectRatio: 1, backgroundColor: '#EEF0F4', overflow: 'hidden', maxHeight: 560 },
  image: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 64, height: 64, borderRadius: RADIUS.sm, overflow: 'hidden', marginRight: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: COLORS.primary },
  body: { padding: 18 },
  category: { color: COLORS.primary, fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  price: { fontSize: 30, fontWeight: '800', color: COLORS.text },
  oldPrice: { fontSize: 16, color: COLORS.muted, textDecorationLine: 'line-through', marginLeft: 10 },
  discount: { backgroundColor: COLORS.danger, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 10 },
  discountText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stockPill: { alignSelf: 'flex-start', borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  description: { color: COLORS.text, lineHeight: 22, fontSize: 14 },
  sku: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
});
