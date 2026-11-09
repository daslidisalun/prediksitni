// Registry bank soal: satu berkas JSON per paket di src/data/paket/.
// Menambah paket baru = menambah berkas JSON + satu baris impor di sini.
// Berkas JSON dihasilkan oleh scripts/gen-bank.mjs (soal hitungan dihitung
// program; soal tulisan orisinal) — jangan sunting JSON-nya langsung.

import akademi from '../data/paket/akademi-tni.json';
import bintaraTamtama from '../data/paket/bintara-tamtama.json';

export interface Soal {
  tanya: string;
  pilihan: string[];
  kunci: number; // indeks 0-3
  bahasan: string;
  topik: string;
}

export interface Paket {
  slug: string;
  judul: string;
  jalur: string;
  durasiMenit: number;
  intro: string;
  komposisi: { topik: string; jumlah: number }[];
  soal: Soal[];
}

export const PAKETS: Paket[] = [akademi, bintaraTamtama] as Paket[];

export function cariPaket(slug: string): Paket | undefined {
  return PAKETS.find((p) => p.slug === slug);
}

export function totalSoal(): number {
  return PAKETS.reduce((s, p) => s + p.soal.length, 0);
}

export const HURUF = ['A', 'B', 'C', 'D', 'E'];
