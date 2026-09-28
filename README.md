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

## 6. Configurar Mercado Pago (pago con PSE)

Además del pago manual, los clientes pueden pagar con **PSE a través de Mercado Pago** (débito a cualquier banco colombiano, con confirmación automática). Esto necesita un backend, así que se implementó con **Supabase Edge Functions** (ya incluidas en `supabase/functions/`).

### 6.1 Aplica la migración de base de datos

En **Supabase → SQL Editor**, corre el contenido de `supabase/migration_005_mercadopago.sql`.

### 6.2 Consigue tus credenciales de Mercado Pago

1. Entra a [mercadopago.com.co/developers/panel](https://www.mercadopago.com.co/developers/panel) e inicia sesión con tu cuenta de Mercado Pago.
2. Crea una aplicación (o usa una existente).
3. En el menú de tu aplicación busca las secciones **Pruebas → Credenciales de prueba** y **Producción → Credenciales de producción** (ambas muestran un Access Token que empieza con `APP_USR-`; la sección en la que estás parado es lo que distingue si es de prueba o real, no el prefijo).
   - Usa el **Access Token de "Credenciales de prueba"** mientras haces pruebas.
   - Cambia al de **"Credenciales de producción"** cuando vayas a cobrar de verdad.

### 6.3 Instala el CLI de Supabase y enlaza tu proyecto

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU-PROJECT-REF   # el ID que aparece en la URL de tu proyecto Supabase
```

### 6.4 Configura el secret del Access Token de prueba

```bash
supabase secrets set MP_TEST_ACCESS_TOKEN=TU_ACCESS_TOKEN
```

(`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles automáticamente dentro de las Edge Functions, no hace falta configurarlos.)

### 6.5 Despliega las Edge Functions

```bash
supabase functions deploy mp-banks
supabase functions deploy mp-create-payment
supabase functions deploy mp-webhook --no-verify-jwt
supabase functions deploy mp-return --no-verify-jwt
```

`mp-webhook` y `mp-return` llevan `--no-verify-jwt` porque Mercado Pago las llama directamente, sin token de sesión de tu app.

### 6.6 Configura el webhook en Mercado Pago

En el panel de tu aplicación → **Webhooks** → agrega:

```
https://TU-PROJECT-REF.supabase.co/functions/v1/mp-webhook
```

Suscríbete al evento **Pagos**. Así, cuando el banco confirme (o rechace) el pago, Mercado Pago le avisa a tu app y el pedido pasa automáticamente a **"Pago confirmado"** (o **"Pago rechazado"**), descontando el stock igual que con la confirmación manual.

### 6.7 Probar

Con el Access Token de la sección "Credenciales de prueba", Mercado Pago simula el flujo de PSE con un banco de prueba: al elegirlo, te lleva a una pantalla donde puedes simular "Pago aprobado" o "Pago rechazado" sin transferir dinero real. Cuando quieras cobrar de verdad, reemplaza el secret `MP_TEST_ACCESS_TOKEN` por el Access Token de "Credenciales de producción" (no hay que tocar el código).

## 7. Estructura del proyecto

```
app/                    Pantallas (expo-router, basado en archivos)
  index.tsx              Catálogo público (sin login)
  product/[id].tsx        Detalle de producto
  cart.tsx                Carrito
  checkout.tsx             Pago con PSE (Mercado Pago) o por QR Bre-B/Nequi + comprobante
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
lib/mercadopago.ts      Cliente para las Edge Functions de Mercado Pago (PSE)
types/                  Tipos de TypeScript
supabase/schema.sql     Script SQL completo (tablas + seguridad)
supabase/migration_005_mercadopago.sql  Columnas de pago con Mercado Pago
supabase/functions/     Edge Functions: mp-banks, mp-create-payment, mp-webhook, mp-return
```

## 8. Cómo monetizas

Ahora mismo el modelo es: **vendedor único (tú)** cobrando por Nequi/Bre-B (manual) o PSE vía Mercado Pago (automático, ver sección 6).

Ideas para crecer más adelante (no incluidas todavía, pero el modelo de datos ya lo soporta con cambios moderados):
- Agregar tarjeta de crédito/débito con Mercado Pago (Checkout Bricks) además de PSE.
- Cobrar a otros vendedores una comisión por venta o una cuota por publicar productos destacados (esto requeriría agregar una tabla `sellers`).
- Publicidad/posicionamiento pagado dentro del catálogo (categoría "destacados").

## 9. Publicar la app de verdad

Cuando quieras subirla a Play Store / App Store, usa **EAS Build** de Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

(Requiere cuenta gratuita de Expo y, para iOS, cuenta de Apple Developer).
