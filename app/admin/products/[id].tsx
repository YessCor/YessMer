import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Product } from '../../../types';
import EmptyState from '../../../components/EmptyState';
import ProductForm from '../../../components/ProductForm';
import { COLORS } from '../../../constants/theme';

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setProduct(data as Product));
  }, [id]);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Editar producto' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }
  if (!product) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <>
      <Stack.Screen options={{ title: 'Editar producto' }} />
      <ProductForm product={product} />
    </>
  );
}
