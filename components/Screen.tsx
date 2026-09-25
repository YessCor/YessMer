import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, MAX_WIDTH } from '../constants/theme';

// Centra el contenido con un ancho máximo (útil en web) y opcionalmente hace scroll.
export default function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  if (!scroll) {
    return (
      <View style={[styles.root, { alignItems: 'center' }]}>
        <View style={[styles.inner, style]}>{children}</View>
      </View>
    );
  }
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ alignItems: 'center' }} keyboardShouldPersistTaps="handled">
      <View style={[styles.inner, { padding: 16 }, style]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  inner: { width: '100%', maxWidth: MAX_WIDTH },
});
