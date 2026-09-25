import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types';
import PrimaryButton from './PrimaryButton';
import { COLORS } from '../constants/theme';

export default function ProductForm({ product }: { product?: Product }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [categoryId, setCategoryId] = useState<string | null>(product?.category_id ?? null);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [imageUri, setImageUri] = useState<string | null>(product?.images?.[0] ?? null);
  const [newImagePicked, setNewImagePicked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []));
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewImagePicked(true);
    }
  };

  const save = async () => {
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!name.trim()) return Alert.alert('Ponle un nombre al producto');
    if (isNaN(priceNum) || priceNum < 0) return Alert.alert('Ingresa un precio válido');
    if (isNaN(stockNum) || stockNum < 0) return Alert.alert('Ingresa un stock válido');

    setSaving(true);
    try {
      let images = product?.images ?? [];
      if (newImagePicked && imageUri) {
        const ext = imageUri.split('.').pop() || 'jpg';
        const path = `${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
        images = [pub.publicUrl];
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        stock: stockNum,
        category_id: categoryId,
        is_active: isActive,
        images,
      };

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      router.back();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e?.message ?? 'Intenta de nuevo');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!product) return;
    Alert.alert('Eliminar producto', '¿Seguro que quieres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', product.id);
          if (error) return Alert.alert('Error', error.message);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={{ color: COLORS.muted }}>Toca para elegir una foto</Text>
        )}
      </Pressable>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Audífonos inalámbricos" />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Detalles del producto"
      />

      <View style={styles.rowInputs}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Precio</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Stock</Text>
          <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" />
        </View>
      </View>

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.chipsRow}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
            onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
          >
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
        {categories.length === 0 && (
          <Text style={styles.muted}>Crea categorías primero en la sección Categorías.</Text>
        )}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Visible en el catálogo</Text>
        <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: COLORS.primary, false: undefined }} />
      </View>

      <View style={{ height: 10 }} />
      <PrimaryButton title={product ? 'Guardar cambios' : 'Publicar producto'} onPress={save} loading={saving} />
      {product && (
        <>
          <View style={{ height: 10 }} />
          <PrimaryButton title="Eliminar producto" variant="danger" onPress={remove} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14 },
  rowInputs: { flexDirection: 'row', marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  muted: { color: COLORS.muted, fontSize: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
});
