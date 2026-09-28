import { supabase } from './supabase';

export type PseBank = { id: string; description: string };

export type DocType = 'CC' | 'CE' | 'NIT' | 'TI' | 'PP';

export const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PP', label: 'Pasaporte' },
];

export type PsePayer = {
  email: string;
  firstName: string;
  lastName: string;
  docType: DocType;
  docNumber: string;
  entityType: 'individual' | 'association';
  financialInstitution: string;
  phone: string;
  city: string;
  neighborhood: string;
  zipCode: string;
};

export async function getPseBanks(): Promise<PseBank[]> {
  const { data, error } = await supabase.functions.invoke('mp-banks');
  if (error) throw new Error(error.message ?? 'No se pudo obtener la lista de bancos PSE');
  if (data?.error) throw new Error(data.error);
  return (data?.banks ?? []) as PseBank[];
}

export async function createPsePayment(
  orderId: string,
  payer: PsePayer
): Promise<{ payment_id: number; status: string; redirect_url: string }> {
  const { data, error } = await supabase.functions.invoke('mp-create-payment', {
    body: { order_id: orderId, payer },
  });
  if (error) throw new Error(error.message ?? 'No se pudo iniciar el pago con PSE');
  if (data?.error) throw new Error(data.error);
  return data;
}
