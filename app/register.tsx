import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../constants/theme';

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Stack.Screen options={{ title: 'Crear cuenta' }} />
      <Text style={styles.title}>Crea tu cuenta</Text>
      <Text style={styles.subtitle}>Regístrate para comprar y seguir tus pedidos</Text>

      <TextInput placeholder="Nombre completo" value={fullName} onChangeText={setFullName} style={styles.input} />
      <TextInput
        placeholder="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      <PrimaryButton title="Crear cuenta" onPress={onSubmit} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
        <Link href={{ pathname: '/login', params: { redirect } }} style={styles.link}>
          Inicia sesión
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: COLORS.muted },
  link: { color: COLORS.primary, fontWeight: '700' },
});
