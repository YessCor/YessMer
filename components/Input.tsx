import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';

export default function Input({ label, hint, style, ...props }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor="#9CA3AF" style={[styles.input, style]} {...props} />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  hint: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
});
