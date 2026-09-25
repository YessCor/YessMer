export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  sku: string | null;
  stock: number;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  created_at: string;
};

export type OrderStatus =
  | 'pendiente_pago'
  | 'pago_reportado'
  | 'confirmado'
  | 'enviado'
  | 'rechazado'
  | 'cancelado';

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  payment_proof_url: string | null;
  shipping_address: string | null;
  shipping_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  products?: { images: string[] } | null;
};

export type StoreSettings = {
  id: number;
  qr_image_url: string | null;
  nequi_key: string | null;
  payment_instructions: string | null;
  updated_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
