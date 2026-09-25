import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../../../lib/alert';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Category, Product } from '../../../types';
import EmptyState from '../../../components/EmptyState';
import CategoryChip from '../../../components/CategoryChip';
import Screen from '../../../components/Screen';
import { COLORS, formatPrice, RADIUS, SHADOW } from '../../../constants/theme';

type Filter = 'all' | 'active' | 'hidden' | 'low';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Visibles' },
  { key: 'hidden', label: 'Ocultos' },
  { key: 'low', label: 'Poco stock' },
];
const LOW_STOCK = 5;

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.sku ?? '').toLowerCase().includes(q)) return false;
      if (filter === 'active') return p.is_active;
      if (filter === 'hidden') return !p.is_active;
      if (filter === 'low') return p.stock <= LOW_STOCK;
      return true;
    });
  }, [products, search, filter]);

  const toggleActive = async (p: Product, value: boolean) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: value } : x)));
    const { error } = await supabase.from('products').update({ is_active: value }).eq('id', p.id);
    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      load();
    }
  };

  const adjustStock = async (p: Product, delta: number) => {
    const stock = Math.max(0, p.stock + delta);
    if (stock === p.stock) return;
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock } : x)));
    const { error } = await supabase.from('products').update({ stock }).eq('id', p.id);
    if (error) {
      Alert.alert('No se pudo actualizar el stock', error.message);
      load();
    }
  };

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Productos' }} />
        <EmptyState icon="lock-closed-outline" title="Acceso restringido" />
      </View>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Productos' }} />
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            placeholder="Buscar por nombre o SKU"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <Pressable style={styles.addBtn} onPress={() => router.push('/admin/products/new')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Nuevo</Text>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <CategoryChip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>
      <Text style={styles.count}>{visible.length} de {products.length} productos</Text>

      {visible.length === 0 && (
        <EmptyState
          icon="cube-outline"
          title={products.length === 0 ? 'Aún no has publicado productos' : 'Sin resultados'}
          subtitle={products.length === 0 ? 'Toca "Nuevo" para publicar el primero.' : 'Prueba con otra búsqueda o filtro.'}
        />
      )}

      {visible.map((item) => (
        <Pressable key={item.id} style={styles.row} onPress={() => router.push(`/admin/products/${item.id}`)}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: '#EEF0F4', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={22} color={COLORS.muted} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
              {item.compare_at_price ? <Text style={styles.oldPrice}>{formatPrice(item.compare_at_price)}</Text> : null}
              {categoryName(item.category_id) && <Text style={styles.meta}> · {categoryName(item.category_id)}</Text>}
            </View>
            <View style={styles.stockRow}>
              <Pressable style={styles.stockBtn} onPress={() => adjustStock(item, -1)} hitSlop={6}>
                <Ionicons name="remove" size={14} color={COLORS.text} />
              </Pressable>
              <Text style={[styles.stock, item.stock <= LOW_STOCK && { color: COLORS.danger }]}>
                {item.stock === 0 ? 'Agotado' : `${item.stock} en stock`}
              </Text>
              <Pressable style={styles.stockBtn} onPress={() => adjustStock(item, 1)} hitSlop={6}>
                <Ionicons name="add" size={14} color={COLORS.text} />
              </Pressable>
              {item.is_featured && <Ionicons name="star" size={14} color={COLORS.primary} style={{ marginLeft: 8 }} />}
            </View>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Switch
              value={item.is_active}
              onValueChange={(v) => toggleActive(item, v)}
              trackColor={{ true: COLORS.primary, false: '#D1D5DB' }}
            />
            <Text style={styles.meta}>{item.is_active ? 'Visible' : 'Oculto'}</Text>
          </View>
        </Pressable>
      ))}
      <View style={{ height: 30 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', columnGap: 10, marginBottom: 12 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 14, color: COLORS.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 8 },
  count: { color: COLORS.muted, fontSize: 12, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: RADIUS.lg, marginBottom: 10, ...SHADOW },
  thumb: { width: 62, height: 62, borderRadius: RADIUS.md },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 2 },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  oldPrice: { fontSize: 12, color: COLORS.muted, textDecorationLine: 'line-through', marginLeft: 6 },
  meta: { fontSize: 11, color: COLORS.muted },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stockBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stock: { marginHorizontal: 10, fontSize: 12, fontWeight: '700', color: COLORS.text },
});
