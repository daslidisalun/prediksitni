import { defineConfig } from 'astro/config';

// Demo GitHub Pages: https://daslidisalun.github.io/prediksitni/
// (domain produksi menyusul; site/base diganti saat naik domain sendiri).
export default defineConfig({
  site: 'https://daslidisalun.github.io',
  base: '/prediksitni/',
  trailingSlash: 'ignore',
});
