# Yessmer 🛒

App de marketplace (estilo MercadoLibre) construida con **Expo + React Native + Supabase**.

- Cualquiera puede **navegar el catálogo sin iniciar sesión**.
- Los clientes se **registran/inician sesión** para comprar y ver sus pedidos.
- Tú (el **admin**) tienes un panel para crear **categorías**, publicar/editar **productos** y **confirmar pagos**.
- El pago se hace por **transferencia a tu Nequi / llave Bre-B**: el cliente ve tu QR, transfiere, sube el pantallazo, y tú confirmas el pago desde el panel admin (se descuenta el stock automáticamente al confirmar).

---

## 1. Requisitos

- Node.js 18+
- Una cuenta gratis en [supabase.com](https://supabase.com)
- Expo Go instalado en tu celular (para probar rápido) o un simulador iOS/Android

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Cuando esté listo, ve a **SQL Editor → New query**, pega el contenido completo de `supabase/schema.sql` (está en este proyecto) y dale **Run**. Esto crea todas las tablas, la seguridad (RLS) y las políticas.
3. Ve a **Storage** y crea estos 3 buckets, marcados como **Public**:
   - `product-images`
   - `payment-proofs`
   - `settings`
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

## 3. Configurar el proyecto local

```bash
cp .env.example .env
```

Edita `.env` y pega tus datos de Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Instala dependencias:

```bash
npm install
```

Corre la app:

```bash
npx expo start
```

Escanea el QR con la app **Expo Go** (Android/iOS) o presiona `i` / `a` si tienes simuladores.

## 4. Convertirte en administrador

1. Abre la app y **regístrate normalmente** con tu correo (quedas como cliente por defecto).
2. En Supabase, ve a **SQL Editor** y corre (cambia el correo):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```

3. Vuelve a abrir la app (o cierra y abre sesión). Verás el botón **"Ir al panel de administración"** en la pantalla principal y en tu perfil.

## 5. Configurar tu método de pago (Bre-B / Nequi)

Panel admin → **Método de pago**:
- Sube la imagen de tu **QR de Bre-B / Nequi**.
- Escribe tu **llave Bre-B o número Nequi**.
- Escribe instrucciones para el cliente (ej: "transfiere el valor exacto y sube el pantallazo").

Cuando un cliente compra:
1. Ve tu QR/llave en el checkout.
2. Transfiere desde su Nequi/app Bre-B.
3. Sube el pantallazo del pago.
4. El pedido queda **"Pago en revisión"**.
5. Tú lo revisas en **Panel admin → Pedidos**, ves el pantallazo, y tocas **"Confirmar pago"** (o "Rechazar pago"). Al confirmar, el stock del producto se descuenta automáticamente.

## 6. Estructura del proyecto

```
app/                    Pantallas (expo-router, basado en archivos)
  index.tsx              Catálogo público (sin login)
  product/[id].tsx        Detalle de producto
  cart.tsx                Carrito
  checkout.tsx             Pago por QR Bre-B/Nequi + subir comprobante
  login.tsx / register.tsx  Autenticación de clientes
  profile.tsx               Perfil del usuario
  orders/                   Mis pedidos (cliente)
  admin/                    Panel de administrador
    index.tsx                Dashboard
    categories.tsx           CRUD de categorías
    products/                CRUD de productos (con foto)
    orders/                  Revisar y confirmar/rechazar pagos
    settings.tsx             QR y llave Bre-B/Nequi

components/             Componentes reutilizables (tarjetas, botones, formulario de producto...)
context/                Estado global: sesión (Auth) y carrito (Cart)
lib/supabase.ts         Cliente de Supabase
types/                  Tipos de TypeScript
supabase/schema.sql     Script SQL completo (tablas + seguridad)
```

## 7. Cómo monetizas

Ahora mismo el modelo es: **vendedor único (tú)** cobrando por Nequi/Bre-B con confirmación manual — cero comisiones de pasarela.

Ideas para crecer más adelante (no incluidas todavía, pero el modelo de datos ya lo soporta con cambios moderados):
- Agregar Wompi o ePayco para pagos automáticos con tarjeta/PSE, sin depender de subir pantallazos.
- Cobrar a otros vendedores una comisión por venta o una cuota por publicar productos destacados (esto requeriría agregar una tabla `sellers`).
- Publicidad/posicionamiento pagado dentro del catálogo (categoría "destacados").

## 8. Publicar la app de verdad

Cuando quieras subirla a Play Store / App Store, usa **EAS Build** de Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

(Requiere cuenta gratuita de Expo y, para iOS, cuenta de Apple Developer).
