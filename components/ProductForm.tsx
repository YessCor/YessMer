import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Alert } from '../lib/alert';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/cloudinary';
import { Category, Product } from '../types';
import PrimaryButton from './PrimaryButton';
import Input from './Input';
import Screen from './Screen';
import { COLORS, formatPrice, RADIUS, SHADOW } from '../constants/theme';

const MAX_IMAGES = 6;

// Si la página se recargó no hay historial: se vuelve a la lista de productos.
const goToList = () => (router.canGoBack() ? router.back() : router.replace('/admin/products'));

// Acepta "12.500", "12,500" o "12500" -> 12500
const parseNumber = (v: string) => Number(v.replace(/[^\d.]/g, '').replace(/\.(?=.*\.)/g, ''));

export default function ProductForm({ product }: { product?: Product }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [comparePrice, setComparePrice] = useState(product?.compare_at_price ? String(product.compare_at_price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(product?.category_id ?? null);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []));
  }, []);

  const pickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return Alert.alert(`Máximo ${MAX_IMAGES} fotos por producto`);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_IMAGES));
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));
  const makeCover = (index: number) =>
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);

  // Sube solo las imágenes locales (las ya publicadas empiezan con http y no cambian).
  const save = async () => {
    const priceNum = parseNumber(price);
    const stockNum = parseInt(stock || '0', 10);
    const compareNum = comparePrice.trim() ? parseNumber(comparePrice) : null;
    if (!name.trim()) return Alert.alert('Ponle un nombre al producto');
    if (!price.trim() || isNaN(priceNum) || priceNum < 0) return Alert.alert('Ingresa un precio válido');
    if (isNaN(stockNum) || stockNum < 0) return Alert.alert('Ingresa un stock válido');
    if (compareNum !== null && (isNaN(compareNum) || compareNum <= priceNum))
      return Alert.alert('El precio anterior debe ser mayor al precio actual');

    setSaving(true);
    try {
      const uploaded = await Promise.all(images.map((uri) => (/^https?:\/\//.test(uri) ? uri : uploadImage(uri))));

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        compare_at_price: compareNum,
        stock: stockNum,
        sku: sku.trim() || null,
        category_id: categoryId,
        is_active: isActive,
        is_featured: isFeatured,
        images: uploaded,
      };

      const { error } = product
        ? await supabase.from('products').update(payload).eq('id', product.id)
        : await supabase.from('products').insert(payload);
      if (error) throw error;
      goToList();
    } catch (e: any) {
      const msg: string = e?.message ?? 'Intenta de nuevo';
      Alert.alert(
        'No se pudo guardar',
        /compare_at_price|is_featured|sku/.test(msg)
          ? 'Falta ejecutar supabase/migration_002_product_extras.sql en el SQL Editor de Supabase.'
          : msg
      );
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
          goToList();
        },
      },
    ]);
  };

  const priceNum = parseNumber(price);
  const compareNum = parseNumber(comparePrice);
  const discount = comparePrice && compareNum > priceNum && priceNum > 0 ? Math.round((1 - priceNum / compareNum) * 100) : 0;

  return (
    <Screen style={{ maxWidth: 720 }}>
      <View style={styles.card}>
        <Text style={styles.section}>Fotos ({images.length}/{MAX_IMAGES})</Text>
        <View style={styles.imagesRow}>
          {images.map((uri, i) => (
            <View key={uri + i} style={styles.imageBox}>
              <Image source={{ uri }} style={styles.image} />
              {i === 0 && (
                <View style={styles.cover}>
                  <Text style={styles.coverText}>Portada</Text>
                </View>
              )}
              <Pressable style={styles.removeBtn} onPress={() => removeImage(i)}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
              {i > 0 && (
                <Pressable style={styles.starBtn} onPress={() => makeCover(i)}>
                  <Ionicons name="star" size={12} color="#fff" />
                </Pressable>
              )}
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <Pressable style={[styles.imageBox, styles.addImage]} onPress={pickImages}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.addImageText}>Agregar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Información</Text>
        <Input label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Audífonos inalámbricos" />
        <Input
          label="Descripción"
          style={{ height: 100, textAlignVertical: 'top' }}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Detalles del producto"
        />
        <Input label="SKU / referencia (opcional)" value={sku} onChangeText={setSku} autoCapitalize="characters" placeholder="Ej: AUD-001" />

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
          {categories.length === 0 && <Text style={styles.muted}>Crea categorías primero en la sección Categorías.</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Precio e inventario</Text>
        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Input label="Precio de venta" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Precio anterior" value={comparePrice} onChangeText={setComparePrice} keyboardType="numeric" placeholder="Opcional" />
          </View>
        </View>
        {discount > 0 && (
          <Text style={styles.discountHint}>
            Se mostrará {formatPrice(priceNum)} con {formatPrice(compareNum)} tachado · -{discount}%
          </Text>
        )}
        <Input label="Stock disponible" value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" />
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchTitle}>Visible en el catálogo</Text>
            <Text style={styles.muted}>Si lo apagas, los clientes no lo verán.</Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: COLORS.primary, false: '#D1D5DB' }} />
        </View>
        <View style={[styles.switchRow, { marginTop: 16 }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.switchTitle}>Producto destacado</Text>
            <Text style={styles.muted}>Aparece arriba en la pantalla principal.</Text>
          </View>
          <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ true: COLORS.primary, false: '#D1D5DB' }} />
        </View>
      </View>

      <PrimaryButton title={product ? 'Guardar cambios' : 'Publicar producto'} onPress={save} loading={saving} />
      {product && (
        <>
          <View style={{ height: 10 }} />
          <PrimaryButton title="Eliminar producto" variant="danger" onPress={remove} />
        </>
      )}
      <View style={{ height: 30 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 16, marginBottom: 14, ...SHADOW },
  section: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageBox: { width: 96, height: 96, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#EEF0F4' },
  image: { width: '100%', height: '100%' },
  addImage: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  addImageText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 12, marginTop: 2 },
  cover: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(17,24,39,0.75)', alignItems: 'center', paddingVertical: 2 },
  coverText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(220,38,38,0.9)', alignItems: 'center', justifyContent: 'center' },
  starBtn: { position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(17,24,39,0.7)', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  rowInputs: { flexDirection: 'row', columnGap: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  muted: { color: COLORS.muted, fontSize: 12 },
  discountHint: { color: COLORS.success, fontSize: 12, fontWeight: '600', marginTop: -6, marginBottom: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
});
