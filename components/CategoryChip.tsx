import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  labelActive: { color: '#fff' },
});
