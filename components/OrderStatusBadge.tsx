import { StyleSheet, Text, View } from 'react-native';
import { OrderStatus } from '../types';
import { COLORS } from '../constants/theme';

const LABELS: Record<OrderStatus, string> = {
  pendiente_pago: 'Pendiente de pago',
  pago_reportado: 'Pago en revisión',
  confirmado: 'Pago confirmado',
  enviado: 'Enviado',
  rechazado: 'Pago rechazado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente_pago: COLORS.muted,
  pago_reportado: COLORS.warning,
  confirmado: COLORS.success,
  enviado: COLORS.primary,
  rechazado: COLORS.danger,
  cancelado: COLORS.danger,
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});
