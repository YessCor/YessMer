import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../lib/alert';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/cloudinary';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Input from '../components/Input';
import Screen from '../components/Screen';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function EditProfile() {
  const { session, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (!session) router.replace('/login?redirect=/edit-profile');
  }, [session]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setAddress(profile.address ?? '');
    setAvatarUri(profile.avatar_url ?? null);
  }, [profile]);

  if (!session) return null;

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Necesitamos acceso a tus fotos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setNewAvatar(true);
    }
  };

  const saveProfile = async () => {
    if (!fullName.trim()) return Alert.alert('Escribe tu nombre');
    setSaving(true);
    try {
      const avatar_url = newAvatar && avatarUri ? await uploadImage(avatarUri) : avatarUri;
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null, address: address.trim() || null, avatar_url })
        .eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      setNewAvatar(false);
      Alert.alert('Guardado', 'Tu perfil se actualizó correctamente.');
    } catch (e: any) {
      const msg: string = e?.message ?? 'Intenta de nuevo';
      Alert.alert(
        'No se pudo guardar',
        /address|avatar_url/.test(msg) ? 'Falta ejecutar supabase/migration_003_profile_edit.sql en Supabase.' : msg
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (password.length < 6) return Alert.alert('La contraseña debe tener al menos 6 caracteres');
    if (password !== password2) return Alert.alert('Las contraseñas no coinciden');
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPass(false);
    if (error) return Alert.alert('No se pudo cambiar la contraseña', error.message);
    setPassword('');
    setPassword2('');
    Alert.alert('Listo', 'Tu contraseña se actualizó.');
  };

  const initial = (fullName || session.user.email || '?').charAt(0).toUpperCase();

  return (
    <Screen style={{ maxWidth: 520 }}>
      <Stack.Screen options={{ title: 'Editar perfil' }} />

      <View style={styles.card}>
        <Pressable style={styles.avatarWrap} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
          )}
          <View style={styles.camera}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.hint}>Toca para cambiar tu foto</Text>

        <Input label="Nombre completo" value={fullName} onChangeText={setFullName} placeholder="Tu nombre" />
        <Input label="Correo" value={session.user.email ?? ''} editable={false} style={{ color: COLORS.muted, backgroundColor: '#F3F4F6' }} />
        <Input label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="300 000 0000" />
        <Input
          label="Dirección de envío"
          value={address}
          onChangeText={setAddress}
          placeholder="Calle, número, ciudad"
          hint="Se usará para autocompletar tus pedidos."
        />
        <PrimaryButton title="Guardar cambios" onPress={saveProfile} loading={saving} />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Cambiar contraseña</Text>
        <Input label="Nueva contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 6 caracteres" />
        <Input label="Repite la contraseña" value={password2} onChangeText={setPassword2} secureTextEntry placeholder="••••••••" />
        <PrimaryButton title="Actualizar contraseña" variant="dark" onPress={changePassword} loading={savingPass} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 18, marginBottom: 14, ...SHADOW },
  avatarWrap: { alignSelf: 'center', marginBottom: 6 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  initial: { color: '#fff', fontSize: 38, fontWeight: '800' },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.dark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  hint: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginBottom: 18 },
  section: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
});
