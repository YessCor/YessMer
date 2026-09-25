import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Category } from '../../types';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/theme';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Categorías' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }

  const addCategory = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), slug: slugify(name) + '-' + Date.now().toString(36) });
    setSaving(false);
    if (error) return Alert.alert('Error', error.message);
    setName('');
    load();
  };

  const removeCategory = (id: string) => {
    Alert.alert('Eliminar categoría', '¿Seguro? Los productos quedarán sin categoría.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Categorías' }} />
      <View style={styles.addRow}>
        <TextInput placeholder="Nueva categoría (ej: Tecnología)" value={name} onChangeText={setName} style={styles.input} />
        <Pressable style={styles.addBtn} onPress={addCategory} disabled={saving}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="No hay categorías todavía" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Pressable onPress={() => removeCategory(item.id)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  addRow: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginRight: 10 },
  addBtn: { width: 46, height: 46, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
});
