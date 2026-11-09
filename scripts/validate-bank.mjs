// validate-bank.mjs — pemeriksaan bank soal PrediksiTNI.
// Memeriksa: skema tiap soal, duplikat batang soal (di dalam dan antar
// paket situs ini), rentang kunci, pembahasan tidak kosong, jumlah soal
// per paket & per grup topik sesuai spesifikasi, dan distribusi huruf
// kunci tidak timpang (tidak ada huruf > 45%).
// Jalankan: node scripts/validate-bank.mjs
import { readFileSync } from 'node:fs';

const SPEC = {
  'akademi-tni.json': {
    total: 50,
    grup: { 'Matematika': 12, 'Pengetahuan Alam': 12, 'Bahasa Inggris': 8, 'Bahasa Indonesia': 8, 'Wawasan Kebangsaan': 10 },
  },
  'bintara-tamtama.json': {
    total: 40,
    grup: { 'Wawasan Kebangsaan': 14, 'Pengetahuan Umum': 12, 'Matematika Dasar': 14 },
  },
};

let gagal = 0;
const salah = (m) => { gagal++; console.log('  GAGAL', m); };
const batangGlobal = new Map();

for (const [berkas, spec] of Object.entries(SPEC)) {
  const path = new URL(`../src/data/paket/${berkas}`, import.meta.url);
  let p;
  try {
    p = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    salah(`${berkas}: JSON tidak valid / berkas hilang (${e.message})`);
    continue;
  }
  console.log(`CHECK ${berkas}: ${p.soal?.length} soal`);
  if (!p.slug || !p.judul || !p.jalur || !p.intro || !p.durasiMenit) salah(`${berkas}: metadata paket tidak lengkap`);
  if (!Array.isArray(p.soal)) { salah(`${berkas}: field soal bukan array`); continue; }
  if (p.soal.length !== spec.total) salah(`${berkas}: jumlah soal ${p.soal.length}, seharusnya ${spec.total}`);

  const batangLokal = new Set();
  const distribusi = [0, 0, 0, 0];
  const hitungGrup = {};
  p.soal.forEach((s, i) => {
    const id = `${berkas} soal ${i + 1}`;
    if (typeof s.tanya !== 'string' || s.tanya.trim().length < 10) salah(`${id}: tanya tidak valid`);
    if (!Array.isArray(s.pilihan) || s.pilihan.length !== 4) salah(`${id}: pilihan harus tepat 4`);
    else {
      if (new Set(s.pilihan).size !== 4) salah(`${id}: ada opsi duplikat: ${s.pilihan.join(' | ')}`);
      if (s.pilihan.some((o) => typeof o !== 'string' || o.trim() === '')) salah(`${id}: ada opsi kosong`);
    }
    if (!Number.isInteger(s.kunci) || s.kunci < 0 || s.kunci > 3) salah(`${id}: kunci di luar rentang (${s.kunci})`);
    else distribusi[s.kunci]++;
    if (typeof s.bahasan !== 'string' || s.bahasan.trim().length < 20) salah(`${id}: pembahasan kosong/terlalu pendek`);
    if (typeof s.topik !== 'string' || s.topik.trim() === '') salah(`${id}: topik kosong`);
    const batang = String(s.tanya || '').trim().toLowerCase();
    if (batangLokal.has(batang)) salah(`${id}: batang soal duplikat di dalam paket`);
    batangLokal.add(batang);
    if (batangGlobal.has(batang)) salah(`${id}: batang soal duplikat dengan ${batangGlobal.get(batang)}`);
    batangGlobal.set(batang, id);
    const grup = s.topik.startsWith('Pengetahuan Alam') ? 'Pengetahuan Alam' : s.topik;
    hitungGrup[grup] = (hitungGrup[grup] || 0) + 1;
  });

  for (const [grup, n] of Object.entries(spec.grup)) {
    if (hitungGrup[grup] !== n) salah(`${berkas}: grup ${grup} berisi ${hitungGrup[grup] || 0} soal, seharusnya ${n}`);
  }
  for (const grup of Object.keys(hitungGrup)) {
    if (!(grup in spec.grup)) salah(`${berkas}: grup tak terduga "${grup}" (${hitungGrup[grup]} soal)`);
  }
  // komposisi yang tersimpan harus cocok dengan hitungan nyata
  const kompTersimpan = Object.fromEntries((p.komposisi || []).map((k) => [k.topik, k.jumlah]));
  if (JSON.stringify(kompTersimpan) !== JSON.stringify(hitungGrup)) {
    salah(`${berkas}: field komposisi tidak cocok dengan isi (tersimpan ${JSON.stringify(kompTersimpan)} vs nyata ${JSON.stringify(hitungGrup)})`);
  }
  const huruf = ['A', 'B', 'C', 'D'];
  distribusi.forEach((n, j) => {
    const persen = (n / p.soal.length) * 100;
    console.log(`  kunci ${huruf[j]}: ${n} (${persen.toFixed(1)}%)`);
    if (persen > 45) salah(`${berkas}: huruf ${huruf[j]} mendominasi (${persen.toFixed(1)}%)`);
  });
}

if (gagal) {
  console.log(`\nVALIDASI GAGAL: ${gagal} masalah.`);
  process.exit(1);
}
console.log('\nVALIDASI BANK: SEMUA LULUS');
