import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../constants/theme';

export default function Login() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return Alert.alert('Completa correo y contraseña');
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) return Alert.alert('No pudimos iniciar sesión', error);
    router.replace((redirect as string) || '/');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Stack.Screen options={{ title: 'Iniciar sesión' }} />
      <Text style={styles.title}>Bienvenido de nuevo</Text>
      <Text style={styles.subtitle}>Inicia sesión para comprar en Yessmer</Text>

      <TextInput
        placeholder="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      <PrimaryButton title="Iniciar sesión" onPress={onSubmit} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
        <Link href={{ pathname: '/register', params: { redirect } }} style={styles.link}>
          Regístrate
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
