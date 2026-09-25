import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { StoreSettings } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { COLORS } from '../../constants/theme';

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [newQrPicked, setNewQrPicked] = useState(false);
  const [nequiKey, setNequiKey] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        const s = data as StoreSettings;
        if (s) {
          setQrUri(s.qr_image_url);
          setNequiKey(s.nequi_key ?? '');
          setInstructions(s.payment_instructions ?? '');
        }
      });
  }, []);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Stack.Screen options={{ title: 'Método de pago' }} />
        <EmptyState title="Acceso restringido" />
      </View>
    );
  }

  const pickQr = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      setQrUri(result.assets[0].uri);
      setNewQrPicked(true);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      let qrUrl = qrUri;
      if (newQrPicked && qrUri) {
        const ext = qrUri.split('.').pop() || 'jpg';
        const path = `qr-${Date.now()}.${ext}`;
        const response = await fetch(qrUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage.from('settings').upload(path, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
        });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from('settings').getPublicUrl(path);
        qrUrl = pub.publicUrl;
      }

      const { error } = await supabase
        .from('store_settings')
        .update({ qr_image_url: qrUrl, nequi_key: nequiKey.trim(), payment_instructions: instructions.trim() })
        .eq('id', 1);
      if (error) throw error;
      Alert.alert('Guardado', 'El método de pago se actualizó correctamente.');
      setNewQrPicked(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 18 }}>
      <Stack.Screen options={{ title: 'Método de pago' }} />
      <Text style={styles.label}>QR de Bre-B / Nequi</Text>
      <Pressable style={styles.qrPicker} onPress={pickQr}>
        {qrUri ? <Image source={{ uri: qrUri }} style={styles.qr} /> : <Text style={{ color: COLORS.muted }}>Toca para subir el QR</Text>}
      </Pressable>

      <Text style={styles.label}>Llave Bre-B / número Nequi</Text>
      <TextInput style={styles.input} value={nequiKey} onChangeText={setNequiKey} placeholder="Ej: @yessmer o 300 000 0000" />

      <Text style={styles.label}>Instrucciones para el cliente</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholder="Ej: Transfiere el valor exacto y sube el pantallazo. Confirmamos en menos de 1 hora."
      />

      <View style={{ height: 10 }} />
      <PrimaryButton title="Guardar método de pago" onPress={save} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  qrPicker: {
    height: 220,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qr: { width: '100%', height: '100%' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14 },
});
