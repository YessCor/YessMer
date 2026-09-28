import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Alert } from '../lib/alert';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { PRESETS, uploadImage } from '../lib/cloudinary';
import { createPsePayment, DOC_TYPES, DocType, getPseBanks, PseBank } from '../lib/mercadopago';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { StoreSettings } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import CategoryChip from '../components/CategoryChip';
import ItemRow from '../components/ItemRow';
import { COLORS } from '../constants/theme';

type PaymentMethod = 'manual' | 'pse';

export default function Checkout() {
  const { session, profile } = useAuth();
  const { items, total, clear } = useCart();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('pse');
  const [submitting, setSubmitting] = useState(false);

  // --- Pago manual (Nequi / Bre-B) ---
  const [proofUri, setProofUri] = useState<string | null>(null);

  // --- Pago con Mercado Pago (PSE) ---
  const [banks, setBanks] = useState<PseBank[]>([]);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankId, setBankId] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType>('CC');
  const [docNumber, setDocNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [entityType, setEntityType] = useState<'individual' | 'association'>('individual');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    if (profile?.address) setAddress((a) => a || profile.address!);
    if (profile?.phone) setPhone((p) => p || profile.phone!);
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      setFirstName((v) => v || parts[0] || '');
      setLastName((v) => v || parts.slice(1).join(' '));
    }
    if (session?.user?.email) setEmail((e) => e || session.user.email!);
  }, [profile, session]);

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

  useEffect(() => {
    if (method !== 'pse' || banks.length > 0 || loadingBanks) return;
    setLoadingBanks(true);
    setBanksError(null);
    getPseBanks()
      .then(setBanks)
      .catch((e) => setBanksError(e?.message ?? 'No se pudo cargar la lista de bancos'))
      .finally(() => setLoadingBanks(false));
  }, [method]);

  if (!session) return null;

  const pickProof = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos para subir el comprobante');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setProofUri(result.assets[0].uri);
  };

  const createOrder = async (status: 'pago_reportado' | 'pendiente_pago') => {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        status,
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

    return order;
  };

  const submitManual = async () => {
    if (!proofUri) return Alert.alert('Sube el pantallazo del pago por Nequi / Bre-B antes de continuar');
    setSubmitting(true);
    try {
      const order = await createOrder('pago_reportado');
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

  const submitPse = async () => {
    if (!bankId) return Alert.alert('Selecciona tu banco para pagar con PSE');
    if (!firstName.trim() || !lastName.trim()) return Alert.alert('Ingresa tu nombre completo');
    if (!docNumber.trim()) return Alert.alert('Ingresa tu número de documento');
    if (!email.trim()) return Alert.alert('Ingresa tu correo electrónico');
    if (!city.trim() || !neighborhood.trim() || !zipCode.trim()) {
      return Alert.alert('Ingresa ciudad, barrio y código postal');
    }

    setSubmitting(true);
    try {
      const order = await createOrder('pendiente_pago');

      const { redirect_url } = await createPsePayment(order.id, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        docType,
        docNumber: docNumber.trim(),
        entityType,
        financialInstitution: bankId,
        phone: phone.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        zipCode: zipCode.trim(),
      });

      clear();

      if (Platform.OS === 'web') {
        window.open(redirect_url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(redirect_url);
      }

      router.replace(`/orders/${order.id}`);
    } catch (e: any) {
      Alert.alert('No pudimos iniciar el pago con PSE', e?.message ?? 'Intenta de nuevo');
    } finally {
      setSubmitting(false);
    }
  };

  const submitOrder = () => (method === 'pse' ? submitPse() : submitManual());

  // Solo para pruebas: llena el formulario con el comprador de prueba de Mercado Pago,
  // requerido cuando se usan credenciales de prueba (Cuentas de prueba > Comprador).
  const fillTestData = () => {
    setEntityType('individual');
    setFirstName('Comprador');
    setLastName('Prueba');
    setEmail('test_user_3020853863843777441@testuser.com');
    setDocType('CC');
    setDocNumber('1234567890');
    setAddress((a) => a || 'Calle 10 # 100');
    setPhone((p) => p || '3001234567');
    setCity('Bogota');
    setNeighborhood('Centro');
    setZipCode('110111');
    if (!bankId && banks[0]) setBankId(banks[0].id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Stack.Screen options={{ title: 'Confirmar pago' }} />
      {items.map((i) => (
        <ItemRow key={i.product.id} image={i.product.images?.[0]} name={i.product.name} quantity={i.quantity} unitPrice={i.product.price} />
      ))}
      <Text style={styles.total}>Total a pagar: ${total.toLocaleString('es-CO')}</Text>

      <Text style={styles.label}>Dirección de envío</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Calle, número, ciudad" />

      <Text style={styles.label}>Teléfono de contacto</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="300 000 0000" />

      <Text style={[styles.label, { marginTop: 18 }]}>Método de pago</Text>
      <View style={styles.methodRow}>
        <CategoryChip label="PSE (Mercado Pago)" active={method === 'pse'} onPress={() => setMethod('pse')} />
        <CategoryChip label="Nequi / Bre-B" active={method === 'manual'} onPress={() => setMethod('manual')} />
      </View>

      {method === 'pse' ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Paga con PSE</Text>
          <Text style={styles.instructions}>Serás redirigido a tu banco para autorizar el pago de forma segura.</Text>

          <PrimaryButton title="Usar datos de prueba" variant="outline" onPress={fillTestData} />

          <Text style={styles.label}>Tipo de persona</Text>
          <View style={styles.methodRow}>
            <CategoryChip label="Natural" active={entityType === 'individual'} onPress={() => setEntityType('individual')} />
            <CategoryChip label="Jurídica" active={entityType === 'association'} onPress={() => setEntityType('association')} />
          </View>

          <Text style={styles.label}>Nombres</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Nombres" />

          <Text style={styles.label}>Apellidos</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Apellidos" />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Tipo de documento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
            {DOC_TYPES.map((d) => (
              <CategoryChip key={d.value} label={d.value} active={docType === d.value} onPress={() => setDocType(d.value)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>Número de documento</Text>
          <TextInput
            style={styles.input}
            value={docNumber}
            onChangeText={setDocNumber}
            placeholder="Número de documento"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Ciudad</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Ciudad" />

          <Text style={styles.label}>Barrio</Text>
          <TextInput style={styles.input} value={neighborhood} onChangeText={setNeighborhood} placeholder="Barrio" />

          <Text style={styles.label}>Código postal</Text>
          <TextInput
            style={styles.input}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="Código postal"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Banco</Text>
          {loadingBanks && <Text style={styles.muted}>Cargando bancos...</Text>}
          {banksError && <Text style={styles.error}>{banksError}</Text>}
          {!loadingBanks && !banksError && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              {banks.map((b) => (
                <CategoryChip key={b.id} label={b.description} active={bankId === b.id} onPress={() => setBankId(b.id)} />
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
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

          <View style={{ height: 6 }} />
          <Text style={[styles.label, { alignSelf: 'flex-start' }]}>Comprobante de pago</Text>
          <PrimaryButton title={proofUri ? 'Cambiar comprobante' : 'Subir pantallazo del pago'} variant="outline" onPress={pickProof} />
          {proofUri && <Image source={{ uri: proofUri }} style={styles.proof} />}
        </View>
      )}

      <View style={{ height: 20 }} />
      <PrimaryButton title={method === 'pse' ? 'Pagar con PSE' : 'Confirmar pedido'} onPress={submitOrder} loading={submitting} />
      <Text style={styles.note}>
        {method === 'pse'
          ? 'Se abrirá una ventana segura de tu banco para autorizar el pago.'
          : 'Tu pedido quedará en revisión hasta que el vendedor confirme el pago recibido.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  total: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  methodRow: { flexDirection: 'row', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  qr: { width: 220, height: 220, borderRadius: 8, marginBottom: 12, alignSelf: 'center' },
  key: { fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  instructions: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  muted: { color: COLORS.muted, marginBottom: 8 },
  error: { color: COLORS.danger, marginBottom: 8, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14 },
  proof: { width: 140, height: 140, borderRadius: 8, marginTop: 10, alignSelf: 'center' },
  note: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
});
