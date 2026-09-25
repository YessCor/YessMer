import { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Category, Product } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';
import { useCart } from '../../context/CartContext';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
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

  const image = product.images?.[0];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Producto' }} />
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={{ color: COLORS.muted }}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.body}>
        {category && <Text style={styles.category}>{category.name}</Text>}
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toLocaleString('es-CO')}</Text>
        <Text style={styles.stock}>
          {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock por el momento'}
        </Text>
        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          title={added ? 'Agregado ✓' : 'Agregar al carrito'}
          disabled={product.stock === 0}
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
          disabled={product.stock === 0}
          onPress={() => {
            addItem(product);
            router.push('/checkout');
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  image: { width, height: width },
  placeholder: { backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 18 },
  category: { color: COLORS.muted, fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  price: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  stock: { color: COLORS.muted, marginBottom: 14, fontSize: 13 },
  description: { color: COLORS.text, lineHeight: 20, fontSize: 14 },
  footer: { padding: 18, paddingBottom: 34 },
});
