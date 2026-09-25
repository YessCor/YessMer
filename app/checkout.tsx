import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '../lib/alert';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { PRESETS, uploadImage } from '../lib/cloudinary';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { StoreSettings } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import ItemRow from '../components/ItemRow';
import { COLORS } from '../constants/theme';

export default function Checkout() {
  const { session, profile } = useAuth();
  const { items, total, clear } = useCart();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Autocompleta con los datos guardados en el perfil (sin pisar lo que el usuario ya escribió)
  useEffect(() => {
    if (profile?.address) setAddress((a) => a || profile.address!);
    if (profile?.phone) setPhone((p) => p || profile.phone!);
  }, [profile]);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => setSettings(data as StoreSettings));
  }, []);

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/checkout');
  }, [session]);

  if (!session) return null;

  const pickProof = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos para subir el comprobante');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setProofUri(result.assets[0].uri);
  };

  const submitOrder = async () => {
    if (items.length === 0) return Alert.alert('Tu carrito está vacío');
    if (!address.trim() || !phone.trim()) return Alert.alert('Ingresa dirección y teléfono de envío');
    if (!proofUri) return Alert.alert('Sube el pantallazo del pago por Nequi / Bre-B antes de continuar');

    setSubmitting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          status: 'pago_reportado',
          total,
          shipping_address: address.trim(),
          shipping_phone: phone.trim(),
        })
        .select()
        .single();
      if (orderError || !order) throw orderError;

      const itemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        unit_price: i.product.price,
        quantity: i.quantity,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      const proofUrl = await uploadImage(proofUri, PRESETS.proofs);
      await supabase.from('orders').update({ payment_proof_url: proofUrl }).eq('id', order.id);

      clear();
      router.replace(`/orders/${order.id}`);
    } catch (e: any) {
      Alert.alert('No pudimos registrar tu pedido', e?.message ?? 'Intenta de nuevo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Stack.Screen options={{ title: 'Confirmar pago' }} />
      {items.map((i) => (
        <ItemRow key={i.product.id} image={i.product.images?.[0]} name={i.product.name} quantity={i.quantity} unitPrice={i.product.price} />
      ))}
      <Text style={styles.total}>Total a pagar: ${total.toLocaleString('es-CO')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Paga con Nequi / Llave Bre-B</Text>
        {settings?.qr_image_url ? (
          <Image source={{ uri: settings.qr_image_url }} style={styles.qr} />
        ) : (
          <Text style={styles.muted}>El vendedor aún no ha configurado el QR de pago.</Text>
        )}
        {settings?.nequi_key ? <Text style={styles.key}>Llave Bre-B / Nequi: {settings.nequi_key}</Text> : null}
        {settings?.payment_instructions ? (
          <Text style={styles.instructions}>{settings.payment_instructions}</Text>
        ) : (
          <Text style={styles.instructions}>
            Escanea el QR o usa la llave para transferir el valor exacto y luego sube el pantallazo del pago.
          </Text>
        )}
      </View>

      <Text style={styles.label}>Dirección de envío</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Calle, número, ciudad" />

      <Text style={styles.label}>Teléfono de contacto</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="300 000 0000" />

      <Text style={styles.label}>Comprobante de pago</Text>
      <PrimaryButton title={proofUri ? 'Cambiar comprobante' : 'Subir pantallazo del pago'} variant="outline" onPress={pickProof} />
      {proofUri && <Image source={{ uri: proofUri }} style={styles.proof} />}

      <View style={{ height: 20 }} />
      <PrimaryButton title="Confirmar pedido" onPress={submitOrder} loading={submitting} />
      <Text style={styles.note}>Tu pedido quedará en revisión hasta que el vendedor confirme el pago recibido.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  total: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  qr: { width: 220, height: 220, borderRadius: 8, marginBottom: 12 },
  key: { fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  instructions: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  muted: { color: COLORS.muted, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14 },
  proof: { width: 140, height: 140, borderRadius: 8, marginTop: 10 },
  note: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
