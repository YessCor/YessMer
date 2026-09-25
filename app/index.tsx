import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../constants/theme';

export default function Home() {
  const { session, isAdmin } = useAuth();
  const { count } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Text style={styles.logo}>Yessmer</Text>
        <View style={styles.topBarActions}>
          <Pressable onPress={() => router.push('/cart')} style={styles.iconBtn}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => router.push(session ? '/profile' : '/login')} style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={26} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
        <TextInput
          placeholder="Buscar productos en Yessmer"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {isAdmin && (
        <Pressable style={styles.adminBanner} onPress={() => router.push('/admin')}>
          <Ionicons name="settings-outline" size={16} color="#fff" />
          <Text style={styles.adminBannerText}>Ir al panel de administración</Text>
        </Pressable>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          categories.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(c) => c.id}
              style={{ marginBottom: 14 }}
              renderItem={({ item }) => (
                <CategoryChip
                  label={item.name}
                  active={activeCategory === item.id}
                  onPress={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
                />
              )}
              ListHeaderComponent={
                <CategoryChip label="Todas" active={activeCategory === null} onPress={() => setActiveCategory(null)} />
              }
            />
          ) : null
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState title="Aún no hay productos" subtitle="Vuelve pronto, estamos cargando el catálogo." />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    backgroundColor: COLORS.dark,
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { color: COLORS.primary, fontSize: 24, fontWeight: '800' },
  topBarActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginLeft: 14 },
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  adminBanner: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBannerText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 13 },
  list: { padding: 16 },
});
