import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../lib/alert';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Input from '../components/Input';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

export default function Register() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!fullName || !email || !password) return Alert.alert('Completa todos los campos');
    if (password.length < 6) return Alert.alert('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);
    if (error) return Alert.alert('No pudimos crear tu cuenta', error);
    Alert.alert('¡Cuenta creada!', 'Revisa tu correo si tu proyecto de Supabase requiere confirmación.');
    router.replace((redirect as string) || '/');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: 'Crear cuenta' }} />
        <View style={styles.card}>
          <Text style={styles.logo}>Yess<Text style={{ color: COLORS.dark }}>mer</Text></Text>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para comprar y seguir tus pedidos</Text>

          <Input label="Nombre completo" placeholder="Tu nombre" value={fullName} onChangeText={setFullName} />
          <Input label="Correo electrónico" placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input label="Contraseña" placeholder="Mínimo 6 caracteres" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={onSubmit} />
          <PrimaryButton title="Crear cuenta" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href={{ pathname: '/login', params: { redirect } }} style={styles.link}>
              Inicia sesión
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 24, ...SHADOW },
  logo: { color: COLORS.primary, fontSize: 28, fontWeight: '800', marginBottom: 14, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 22 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.muted },
  link: { color: COLORS.primary, fontWeight: '700' },
});
