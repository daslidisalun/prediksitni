// PrediksiTNI — identitas situs (brand kerja sementara untuk demo lokal).
// Bank soal (paket) dimuat dari src/lib/paket.ts.

export const SITE_NAME = 'PrediksiTNI';
export const SITE_URL = 'https://daslidisalun.github.io';
export const BASE_PATH = '/prediksitni';
export const SITE_EMAIL = 'prediksitni@gmail.com';
export const SITE_TAGLINE = 'Latihan soal tes akademik TNI — orisinal, mengikuti mata uji seleksi';
export const SITE_DESCRIPTION =
  'PrediksiTNI menyediakan latihan soal tes akademik TNI yang orisinal — disusun mengikuti mata uji yang umum diujikan pada seleksi Akademi TNI, Bintara PK, dan Tamtama PK — lengkap dengan kunci jawaban dan pembahasan. Bukan bocoran, bukan soal resmi, dan tidak berafiliasi dengan TNI.';

export function withBase(path: string): string {
  if (path === '/') return BASE_PATH + '/';
  return BASE_PATH + (path.startsWith('/') ? path : '/' + path);
}

export function absolute(path: string): string {
  return SITE_URL + withBase(path);
}
