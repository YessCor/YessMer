import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, MAX_WIDTH, RADIUS } from '../constants/theme';

const GAP = 14;

export default function Home() {
  const { session, isAdmin } = useAuth();
  const { count } = useCart();
  const { width: winWidth } = useWindowDimensions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const contentWidth = Math.min(winWidth, MAX_WIDTH) - 32;
  const columns = winWidth >= 1000 ? 4 : winWidth >= 700 ? 3 : 2;
  const cardWidth = (contentWidth - GAP * (columns - 1)) / columns;

  const load = useCallback(async () => {
    const { data: cats } = await supabase.from('categories').select('*').order('name');
    setCategories(cats ?? []);

    let query = supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (activeCategory) query = query.eq('category_id', activeCategory);
    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    const { data: prods } = await query;
    setProducts(prods ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [activeCategory, search]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const featured = products.filter((p) => p.is_featured);
  const showFeatured = featured.length > 0 && !activeCategory && !search.trim();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, contentStyle: { maxWidth: '100%', backgroundColor: COLORS.bg } }} />
      <View style={styles.topBarWrap}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>Yess<Text style={{ color: '#fff' }}>mer</Text></Text>
          <View style={styles.topBarActions}>
            {isAdmin && (
              <Pressable onPress={() => router.push('/admin')} style={styles.adminBtn}>
                <Ionicons name="settings-outline" size={15} color="#fff" />
                <Text style={styles.adminBtnText}>Admin</Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.push('/cart')} style={styles.iconBtn}>
              <Ionicons name="cart-outline" size={24} color="#fff" />
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push(session ? '/profile' : '/login')} style={styles.iconBtn}>
              <Ionicons name="person-circle-outline" size={27} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.inner, { padding: 16 }]}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Encuentra lo que buscas</Text>
            <Text style={styles.heroSub}>Los mejores productos, pago fácil con Bre-B / Nequi.</Text>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Buscar productos"
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </Pressable>
              )}
            </View>
          </View>

          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              <CategoryChip label="Todas" active={activeCategory === null} onPress={() => setActiveCategory(null)} />
              {categories.map((c) => (
                <CategoryChip
                  key={c.id}
                  label={c.name}
                  active={activeCategory === c.id}
                  onPress={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
                />
              ))}
            </ScrollView>
          )}

          {showFeatured && (
            <>
              <Text style={styles.sectionTitle}>Destacados</Text>
              <View style={styles.grid}>
                {featured.slice(0, columns).map((p) => (
                  <ProductCard key={p.id} product={p} width={cardWidth} />
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>{showFeatured ? 'Todos los productos' : 'Productos'}</Text>
          <View style={styles.grid}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} width={cardWidth} />
            ))}
          </View>
          {!loading && products.length === 0 && (
            <EmptyState
              icon="search-outline"
              title={search || activeCategory ? 'Sin resultados' : 'Aún no hay productos'}
              subtitle={search || activeCategory ? 'Prueba con otra búsqueda o categoría.' : 'Vuelve pronto, estamos cargando el catálogo.'}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH },
  topBarWrap: { backgroundColor: COLORS.dark, paddingTop: 44, paddingBottom: 12, alignItems: 'center' },
  topBar: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { color: COLORS.primary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  topBarActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 16 },
  adminBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 6 },
  adminBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 4 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hero: { backgroundColor: COLORS.dark, borderRadius: RADIUS.lg, padding: 20, marginBottom: 18 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: '#9CA3AF', fontSize: 13, marginTop: 4, marginBottom: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: COLORS.text },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP },
});
