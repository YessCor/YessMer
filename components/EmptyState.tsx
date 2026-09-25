import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },
});
