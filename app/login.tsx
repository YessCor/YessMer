import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../lib/alert';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Input from '../components/Input';
import { COLORS, RADIUS, SHADOW } from '../constants/theme';

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: 'Iniciar sesión' }} />
        <View style={styles.card}>
          <Text style={styles.logo}>Yess<Text style={{ color: COLORS.dark }}>mer</Text></Text>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>Inicia sesión para comprar en Yessmer</Text>

          <Input label="Correo electrónico" placeholder="tu@correo.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input label="Contraseña" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={onSubmit} />
          <PrimaryButton title="Iniciar sesión" onPress={onSubmit} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Link href={{ pathname: '/register', params: { redirect } }} style={styles.link}>
              Regístrate
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
