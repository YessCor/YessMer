const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const DEFAULT_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const PROOF_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PROOF_PRESET;

export const PRESETS = {
  images: DEFAULT_PRESET,
  proofs: PROOF_PRESET || DEFAULT_PRESET,
};

// Sube una imagen (uri local, blob: o data:) a Cloudinary con un upload preset unsigned
// y devuelve la URL pública https.
export async function uploadImage(uri: string, preset: string | undefined = PRESETS.images): Promise<string> {
  if (!CLOUD_NAME || !preset) {
    throw new Error('Faltan EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME / EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET en el .env (reinicia expo start).');
  }

  const form = new FormData();
  form.append('upload_preset', preset);

  if (/^(blob:|data:|https?:)/.test(uri)) {
    // Web: se convierte a Blob real
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, `upload.${blob.type.split('/')[1] || 'jpg'}`);
  } else {
    // Nativo: React Native acepta { uri, name, type } en FormData
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    form.append('file', { uri, name: `upload.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` } as any);
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message ?? 'No se pudo subir la imagen a Cloudinary');
  }
  return json.secure_url as string;
}
