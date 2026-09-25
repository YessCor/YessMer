import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'dark' | 'danger' | 'outline';
}) {
  const bg =
    variant === 'dark'
      ? COLORS.dark
      : variant === 'danger'
      ? COLORS.danger
      : variant === 'outline'
      ? 'transparent'
      : COLORS.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: COLORS.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.text : '#fff'} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && { color: COLORS.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
