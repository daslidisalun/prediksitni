import { SITE_URL } from '../config/site';
import { PAKETS } from '../lib/paket';

const STATIC_ROUTES = ['/', '/paket/', '/kisi-kisi/', '/tentang/', '/kontak/', '/privasi/', '/disclaimer/'];

export function GET() {
  const urls = [
    ...STATIC_ROUTES,
    ...PAKETS.map((p) => `/paket/${p.slug}/`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
