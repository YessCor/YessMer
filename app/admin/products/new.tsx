import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import EmptyState from '../../../components/EmptyState';
import ProductForm from '../../../components/ProductForm';
import { COLORS } from '../../../constants/theme';

export default function NewProduct() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Nuevo producto' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo producto' }} />
      <ProductForm />
    </>
  );
}
