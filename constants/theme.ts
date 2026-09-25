import { Platform, ViewStyle } from 'react-native';

export const COLORS = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  primary: '#FF8A00',
  primaryDark: '#E67600',
  primarySoft: '#FFF3E3',
  dark: '#111827',
  border: '#E5E7EB',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
};

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };

export const MAX_WIDTH = 1100;

export const SHADOW: ViewStyle = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(17,24,39,0.06)' } as any,
  default: { shadowColor: '#111827', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
}) as ViewStyle;

export const formatPrice = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;
