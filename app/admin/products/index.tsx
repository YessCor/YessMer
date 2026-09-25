import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Product } from '../../../types';
import EmptyState from '../../../components/EmptyState';
import { COLORS } from '../../../constants/theme';

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Productos' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Productos' }} />
      <Pressable style={styles.addBtn} onPress={() => router.push('/admin/products/new')}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.addBtnText}>Nuevo producto</Text>
      </Pressable>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Aún no has publicado productos" />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/admin/products/${item.id}`)}>
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: '#EEE' }]} />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price.toLocaleString('es-CO')} · stock {item.stock}</Text>
              {!item.is_active && <Text style={styles.inactive}>Oculto</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumb: { width: 50, height: 50, borderRadius: 8 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  price: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  inactive: { fontSize: 11, color: COLORS.danger, marginTop: 2, fontWeight: '700' },
});
