// gen-bank.mjs — pembangkit bank soal PrediksiTNI.
//
// DUA JENIS SOAL:
//  1. Soal hitungan (Matematika) — dibuat dari template di bawah; kunci
//     jawaban DIHITUNG oleh program dari parameternya, jadi mustahil salah
//     kunci. Parameter dipilih acak-terkendali (seed tetap) agar berkas
//     hasil bisa direproduksi persis.
//  2. Soal tulisan (IPA, bahasa, WK, PU) — ditulis orisinal oleh penulis,
//     disimpan sebagai data {tanya, benar, salah[3], bahasan, topik};
//     faktanya fakta publik (UUD 1945, Pancasila, UU 34/2004, IPA SMA dasar).
//
// Posisi kunci didistribusikan dengan pola rotasi [0,2,1,3,2,0,3,1] agar
// tiap huruf muncul tepat 25% dalam setiap 8 soal berurutan.
//
// Jalankan: node scripts/gen-bank.mjs  -> menulis src/data/paket/*.json
// Lalu periksa: node scripts/validate-bank.mjs

import { writeFileSync } from 'node:fs';

// ---------- util ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261109);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const ri = (min, max) => min + Math.floor(rng() * (max - min + 1));
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const PAT = [0, 2, 1, 3, 2, 0, 3, 1];
function rakit(items) {
  return items.map((it, i) => {
    const slot = PAT[i % PAT.length];
    const pilihan = new Array(4);
    pilihan[slot] = it.benar;
    let s = 0;
    for (let j = 0; j < 4; j++) {
      if (j === slot) continue;
      pilihan[j] = it.salah[s++];
    }
    return { tanya: it.tanya, pilihan, kunci: slot, bahasan: it.bahasan, topik: it.topik };
  });
}
// Pastikan pengecoh unik & berbeda dari jawaban; gagal keras bila tidak.
function cekItem(it) {
  const semua = [it.benar, ...it.salah];
  if (it.salah.length !== 3) throw new Error('pengecoh harus 3: ' + it.tanya);
  if (new Set(semua).size !== 4) throw new Error('opsi duplikat: ' + it.tanya + ' -> ' + semua.join(' | '));
  if (!it.bahasan || it.bahasan.length < 20) throw new Error('bahasan terlalu pendek: ' + it.tanya);
}

// ============================================================
// GENERATOR MATEMATIKA — kunci dihitung program
// ============================================================
function mathAkademi() {
  const M = 'Matematika';
  const out = [];

  { // 1. persen dari bilangan
    const persen = pick([15, 20, 25, 30, 40, 60, 75]);
    const basis = pick([240, 360, 480, 600, 720, 840]);
    const hasil = (persen * basis) / 100;
    out.push({
      topik: M,
      tanya: `Hasil dari ${persen}% dari ${fmt(basis)} adalah ...`,
      benar: fmt(hasil),
      salah: [fmt(hasil + basis / 10), fmt(hasil - basis / 20), fmt(hasil + 12)].map(String),
      bahasan: `${persen}% dari ${fmt(basis)} = ${persen}/100 × ${fmt(basis)} = ${fmt(hasil)}.`,
    });
  }
  { // 2. perbandingan
    let a = ri(2, 5), b = ri(2, 6);
    while (b === a) b = ri(2, 6);
    const k = ri(6, 14);
    const total = (a + b) * k;
    const bagianB = b * k;
    const kandidat = [a * k, bagianB + k, bagianB - k, bagianB + 2 * k, bagianB + 10, bagianB - 5, total - k];
    const pengecoh = [];
    for (const c of kandidat) {
      if (c !== bagianB && c > 0 && !pengecoh.includes(c)) pengecoh.push(c);
      if (pengecoh.length === 3) break;
    }
    out.push({
      topik: M,
      tanya: `Perbandingan jumlah calon Bintara dan Tamtama dalam satu gelombang latihan adalah ${a} : ${b}. Jika jumlah seluruh calon adalah ${fmt(total)} orang, jumlah calon Tamtama adalah ...`,
      benar: `${fmt(bagianB)} orang`,
      salah: pengecoh.map((c) => `${fmt(c)} orang`),
      bahasan: `Jumlah perbandingan = ${a} + ${b} = ${a + b}. Nilai satu bagian = ${fmt(total)} : ${a + b} = ${k}. Calon Tamtama = ${b} × ${k} = ${fmt(bagianB)} orang.`,
    });
  }
  { // 3. deret aritmetika — suku ke-n
    const a = ri(3, 9), beda = ri(3, 8), n = ri(7, 10);
    const un = a + (n - 1) * beda;
    const deret = [0, 1, 2, 3].map((i) => a + i * beda).join(', ');
    out.push({
      topik: M,
      tanya: `Suku ke-${n} dari barisan aritmetika ${deret}, ... adalah ...`,
      benar: fmt(un),
      salah: [fmt(un - beda), fmt(un + beda), fmt(un + 2 * beda)],
      bahasan: `Suku pertama a = ${a} dan beda b = ${beda}. Suku ke-${n}: Un = a + (n − 1)b = ${a} + ${n - 1} × ${beda} = ${un}.`,
    });
  }
  { // 4. deret geometri — suku ke-n
    const a = ri(2, 5), r = pick([2, 3]), n = ri(5, 6);
    const un = a * Math.pow(r, n - 1);
    const deret = [0, 1, 2].map((i) => a * Math.pow(r, i)).join(', ');
    out.push({
      topik: M,
      tanya: `Suku ke-${n} dari barisan geometri ${deret}, ... adalah ...`,
      benar: fmt(un),
      salah: [fmt(un / r), fmt(un + a * r), fmt(un * r)],
      bahasan: `Rasio r = ${r}. Suku ke-${n}: Un = a × r^(n−1) = ${a} × ${r}^${n - 1} = ${fmt(un)}.`,
    });
  }
  { // 5. luas segitiga
    const alas = ri(8, 20), tinggi = pick([6, 8, 10, 12, 14]);
    const luas = (alas * tinggi) / 2;
    out.push({
      topik: M,
      tanya: `Sebuah bendera upacara berbentuk segitiga dengan panjang alas ${alas} cm dan tinggi ${tinggi} cm. Luas bendera tersebut adalah ...`,
      benar: `${fmt(luas)} cm²`,
      salah: [`${fmt(alas * tinggi)} cm²`, `${fmt(luas + tinggi)} cm²`, `${fmt(luas - alas)} cm²`],
      bahasan: `Luas segitiga = ½ × alas × tinggi = ½ × ${alas} × ${tinggi} = ${fmt(luas)} cm².`,
    });
  }
  { // 6. keliling persegi panjang
    const p = ri(14, 26), l = ri(6, 12);
    const kel = 2 * (p + l);
    out.push({
      topik: M,
      tanya: `Lapangan apel berbentuk persegi panjang dengan panjang ${p} m dan lebar ${l} m. Keliling lapangan tersebut adalah ...`,
      benar: `${kel} m`,
      salah: [`${p + l} m`, `${kel + 2 * p} m`, `${p * l} m`],
      bahasan: `Keliling persegi panjang = 2 × (p + l) = 2 × (${p} + ${l}) = ${kel} m. Pilihan ${p * l} m adalah luasnya, bukan kelilingnya.`,
    });
  }
  { // 7. soal cerita dua barang (SPLDV sederhana)
    const hargaBuku = pick([4000, 5000, 6000]);
    const hargaPensil = pick([2000, 2500, 3000]);
    const a1 = 3, b1 = 2, a2 = 5, b2 = 1;
    const t1 = a1 * hargaBuku + b1 * hargaPensil;
    const t2 = a2 * hargaBuku + b2 * hargaPensil;
    const ditanya = 4 * hargaBuku + 3 * hargaPensil;
    out.push({
      topik: M,
      tanya: `Harga ${a1} buku tulis dan ${b1} pensil adalah Rp${fmt(t1)}, sedangkan harga ${a2} buku tulis dan ${b2} pensil adalah Rp${fmt(t2)}. Harga 4 buku tulis dan 3 pensil adalah ...`,
      benar: `Rp${fmt(ditanya)}`,
      salah: [`Rp${fmt(ditanya + 1500)}`, `Rp${fmt(ditanya - 2000)}`, `Rp${fmt(t1 + t2)}`],
      bahasan: `Misalkan buku = x dan pensil = y. Dari kedua persamaan diperoleh x = Rp${fmt(hargaBuku)} dan y = Rp${fmt(hargaPensil)}. Maka 4x + 3y = 4 × ${fmt(hargaBuku)} + 3 × ${fmt(hargaPensil)} = Rp${fmt(ditanya)}.`,
    });
  }
  { // 8. peluang dadu
    const kejadian = pick([
      { nama: 'bilangan prima', cocok: [2, 3, 5] },
      { nama: 'bilangan genap', cocok: [2, 4, 6] },
      { nama: 'lebih dari 4', cocok: [5, 6] },
    ]);
    const p = kejadian.cocok.length;
    const seder = { '3/6': '1/2', '2/6': '1/3' }[`${p}/6`];
    out.push({
      topik: M,
      tanya: `Sebuah dadu bersisi enam dilempar satu kali. Peluang muncul mata dadu ${kejadian.nama} adalah ...`,
      benar: seder,
      salah: seder === '1/2' ? ['1/3', '1/6', '2/3'] : ['1/2', '1/6', '5/6'],
      bahasan: `Mata dadu yang memenuhi syarat ada ${p} dari 6 kemungkinan, jadi peluangnya ${p}/6 = ${seder}.`,
    });
  }
  { // 9. rata-rata — lima nilai dipilih agar jumlahnya habis dibagi 5
    let nilai, jumlah;
    do {
      nilai = Array.from({ length: 5 }, () => ri(55, 98));
      jumlah = nilai.reduce((s, v) => s + v, 0);
    } while (jumlah % 5 !== 0);
    const rata = jumlah / 5;
    out.push({
      topik: M,
      tanya: `Nilai lima kali tes tertulis seorang calon adalah ${nilai.join(', ')}. Nilai rata-rata calon tersebut adalah ...`,
      benar: fmt(rata),
      salah: [fmt(rata + 2), fmt(rata - 3), fmt(rata + 5)],
      bahasan: `Jumlah nilai = ${nilai.join(' + ')} = ${fmt(jumlah)}. Rata-rata = ${fmt(jumlah)} : 5 = ${rata}.`,
    });
  }
  { // 10. diskon
    const harga = pick([250000, 300000, 400000, 500000]);
    const diskon = pick([10, 15, 20, 25]);
    const bayar = harga - (harga * diskon) / 100;
    out.push({
      topik: M,
      tanya: `Sepasang sepatu latihan berharga Rp${fmt(harga)} mendapat potongan harga ${diskon}%. Jumlah uang yang harus dibayar pembeli adalah ...`,
      benar: `Rp${fmt(bayar)}`,
      salah: [`Rp${fmt(harga - (harga * (diskon - 5)) / 100)}`, `Rp${fmt(bayar - 10000)}`, `Rp${fmt((harga * diskon) / 100)}`],
      bahasan: `Potongan = ${diskon}% × Rp${fmt(harga)} = Rp${fmt((harga * diskon) / 100)}. Yang dibayar = Rp${fmt(harga)} − Rp${fmt((harga * diskon) / 100)} = Rp${fmt(bayar)}.`,
    });
  }
  { // 11. kecepatan — jarak dibangun dari kecepatan × waktu agar hasilnya bulat
    const kec = pick([40, 45, 50, 60, 75, 80]);
    const waktu = pick([2, 3, 4, 5]);
    const jarak = kec * waktu;
    out.push({
      topik: M,
      tanya: `Sebuah kendaraan dinas menempuh jarak ${jarak} km dalam waktu ${waktu} jam dengan kecepatan tetap. Kecepatan rata-rata kendaraan tersebut adalah ...`,
      benar: `${kec} km/jam`,
      salah: [`${kec + 10} km/jam`, `${kec - 5} km/jam`, `${jarak * waktu} km/jam`],
      bahasan: `Kecepatan = jarak : waktu = ${jarak} : ${waktu} = ${kec} km/jam.`,
    });
  }
  { // 12. persamaan linear satu variabel
    const a = ri(3, 9), x = ri(4, 15), b = ri(2, 20);
    const c = a * x + b;
    out.push({
      topik: M,
      tanya: `Jika ${a}x + ${b} = ${c}, maka nilai x adalah ...`,
      benar: fmt(x),
      salah: [fmt(x + 1), fmt(x - 1), fmt(x + 3)],
      bahasan: `${a}x = ${c} − ${b} = ${a * x}, sehingga x = ${a * x} : ${a} = ${x}.`,
    });
  }
  out.forEach(cekItem);
  return out;
}

function mathDasar() {
  const M = 'Matematika Dasar';
  const out = [];
  const pasukan = ri(11, 14) * 100 + pick([0, 25, 50, 75]);
  const tambahan = ri(6, 9) * 100 + pick([0, 25, 50, 75]);
  out.push({
    topik: M,
    tanya: `Sebuah batalyon memiliki ${fmt(pasukan)} prajurit. Jika bergabung lagi ${fmt(tambahan)} prajurit, jumlah prajurit sekarang adalah ...`,
    benar: `${fmt(pasukan + tambahan)} prajurit`,
    salah: [`${fmt(pasukan + tambahan - 100)} prajurit`, `${fmt(pasukan + tambahan + 100)} prajurit`, `${fmt(pasukan - tambahan)} prajurit`],
    bahasan: `${fmt(pasukan)} + ${fmt(tambahan)} = ${fmt(pasukan + tambahan)} prajurit.`,
  });
  const bekal = ri(18, 28) * 100, dipakai = ri(7, 12) * 100 + 50;
  out.push({
    topik: M,
    tanya: `Dapur lapangan menyiapkan ${fmt(bekal)} porsi makanan. Sebanyak ${fmt(dipakai)} porsi telah dibagikan. Sisa porsi yang belum dibagikan adalah ...`,
    benar: `${fmt(bekal - dipakai)} porsi`,
    salah: [`${fmt(bekal - dipakai + 100)} porsi`, `${fmt(bekal - dipakai - 50)} porsi`, `${fmt(bekal + dipakai)} porsi`],
    bahasan: `${fmt(bekal)} − ${fmt(dipakai)} = ${fmt(bekal - dipakai)} porsi.`,
  });
  const regu = pick([18, 20, 24, 25, 30]), perRegu = pick([10, 11, 12, 13]);
  out.push({
    topik: M,
    tanya: `Dalam satu upacara, peserta dibagi menjadi ${regu} regu dengan ${perRegu} orang per regu. Jumlah seluruh peserta upacara adalah ...`,
    benar: `${regu * perRegu} orang`,
    salah: [`${regu * perRegu - perRegu} orang`, `${regu * perRegu + regu} orang`, `${regu + perRegu} orang`],
    bahasan: `${regu} × ${perRegu} = ${regu * perRegu} orang.`,
  });
  const truk = pick([8, 10, 12, 15]), perTruk = pick([90, 100, 110, 120]);
  out.push({
    topik: M,
    tanya: `Sebanyak ${fmt(truk * perTruk)} liter air bersih diangkut dengan ${truk} truk tangki yang masing-masing memuat jumlah sama. Muatan setiap truk adalah ...`,
    benar: `${perTruk} liter`,
    salah: [`${perTruk + 10} liter`, `${perTruk - 10} liter`, `${truk * perTruk} liter`],
    bahasan: `${fmt(truk * perTruk)} : ${truk} = ${perTruk} liter per truk.`,
  });
  const siswa = pick([240, 300, 350, 420, 500]), persenL = pick([10, 20, 30, 40]);
  out.push({
    topik: M,
    tanya: `Dari ${siswa} siswa yang mendaftar seleksi, ${persenL}% dinyatakan lulus tahap administrasi. Banyak siswa yang lulus tahap administrasi adalah ...`,
    benar: `${(siswa * persenL) / 100} siswa`,
    salah: [`${(siswa * persenL) / 100 + 10} siswa`, `${(siswa * persenL) / 100 - 5} siswa`, `${siswa - (siswa * persenL) / 100} siswa`],
    bahasan: `${persenL}% × ${siswa} = ${persenL}/100 × ${siswa} = ${(siswa * persenL) / 100} siswa.`,
  });
  { // perbandingan sederhana
    const a = 3, b = 5, k = pick([6, 8, 9, 11, 12]);
    out.push({
      topik: M,
      tanya: `Perbandingan jumlah bola dan kerucut latihan adalah ${a} : ${b}. Jika jumlah seluruhnya ${fmt((a + b) * k)} buah, banyak kerucut adalah ...`,
      benar: `${b * k} buah`,
      salah: [`${a * k} buah`, `${b * k + k} buah`, `${(a + b) * k - a} buah`],
      bahasan: `Satu bagian = ${(a + b) * k} : ${a + b} = ${k}. Kerucut = ${b} × ${k} = ${b * k} buah.`,
    });
  }
  { // deret sederhana
    const a = ri(4, 12), beda = pick([3, 4, 5, 6]);
    const deret = [0, 1, 2, 3].map((i) => a + i * beda);
    out.push({
      topik: M,
      tanya: `Angka berikutnya dari pola ${deret.join(', ')}, ... adalah ...`,
      benar: fmt(a + 4 * beda),
      salah: [fmt(a + 4 * beda - beda), fmt(a + 4 * beda + 2 * beda), fmt(a + 3 * beda + 1)],
      bahasan: `Pola bertambah tetap sebesar ${beda} setiap langkah, sehingga setelah ${deret[3]} berikutnya adalah ${deret[3]} + ${beda} = ${a + 4 * beda}.`,
    });
  }
  const sisi = pick([12, 15, 16, 18, 20, 25]);
  out.push({
    topik: M,
    tanya: `Sebuah petak tanah berbentuk persegi dengan sisi ${sisi} m. Luas petak tanah tersebut adalah ...`,
    benar: `${sisi * sisi} m²`,
    salah: [`${4 * sisi} m²`, `${sisi * sisi + sisi} m²`, `${2 * sisi} m²`],
    bahasan: `Luas persegi = sisi × sisi = ${sisi} × ${sisi} = ${sisi * sisi} m². Pilihan ${4 * sisi} m² adalah kelilingnya.`,
  });
  const p2 = pick([18, 20, 22, 24]), l2 = pick([7, 8, 9, 10, 11]);
  out.push({
    topik: M,
    tanya: `Sebuah aula berbentuk persegi panjang berukuran ${p2} m × ${l2} m. Jika sekeliling aula akan dipasangi pita, panjang pita yang dibutuhkan adalah ...`,
    benar: `${2 * (p2 + l2)} m`,
    salah: [`${p2 + l2} m`, `${p2 * l2} m`, `${2 * (p2 + l2) + 4} m`],
    bahasan: `Panjang pita = keliling = 2 × (${p2} + ${l2}) = ${2 * (p2 + l2)} m.`,
  });
  { // rata-rata sederhana
    const v = [pick([70, 72, 75]), pick([80, 82, 85]), pick([76, 78, 88]), pick([84, 90, 92])];
    const jumlah = v.reduce((s, x) => s + x, 0);
    const rata = jumlah / 4;
    out.push({
      topik: M,
      tanya: `Nilai empat mata pelajaran seorang siswa adalah ${v.join(', ')}. Nilai rata-ratanya adalah ...`,
      benar: String(rata).replace('.', ','),
      salah: [String(rata + 2).replace('.', ','), String(rata - 2).replace('.', ','), String(jumlah).replace('.', ',')],
      bahasan: `Jumlah nilai = ${v.join(' + ')} = ${jumlah}. Rata-rata = ${jumlah} : 4 = ${String(rata).replace('.', ',')}.`,
    });
  }
  const kec2 = pick([50, 60, 70, 80]);
  const jamTempuh = pick([2, 3, 4]);
  const jarak2 = kec2 * jamTempuh;
  out.push({
    topik: M,
    tanya: `Jarak dua kota adalah ${jarak2} km. Jika ditempuh dengan kecepatan rata-rata ${kec2} km/jam, waktu yang diperlukan adalah ...`,
    benar: `${jamTempuh} jam`,
    salah: [`${jamTempuh + 1} jam`, `${jamTempuh - 0.5} jam`.replace('.', ','), `${jarak2 * kec2} jam`],
    bahasan: `Waktu = jarak : kecepatan = ${jarak2} : ${kec2} = ${jamTempuh} jam.`,
  });
  const hargaSatuan = pick([10000, 12500, 15000]), beli = pick([2, 3]);
  const kembali = 50000 - beli * hargaSatuan;
  out.push({
    topik: M,
    tanya: `Rani membeli ${beli} buku seharga Rp${fmt(hargaSatuan)} per buku dan membayar dengan selembar Rp50.000. Uang kembaliannya adalah ...`,
    benar: `Rp${fmt(kembali)}`,
    salah: [`Rp${fmt(kembali + 2500)}`, `Rp${fmt(kembali - 2500)}`, `Rp${fmt(hargaSatuan)}`],
    bahasan: `Total belanja = ${beli} × Rp${fmt(hargaSatuan)} = Rp${fmt(beli * hargaSatuan)}. Kembalian = Rp50.000 − Rp${fmt(beli * hargaSatuan)} = Rp${fmt(kembali)}.`,
  });
  const utuh = pick([120, 160, 200, 240, 280]);
  out.push({
    topik: M,
    tanya: `Hasil dari 3/4 dari ${utuh} adalah ...`,
    benar: fmt((utuh * 3) / 4),
    salah: [fmt(utuh / 4), fmt(utuh / 2), fmt(utuh - 10)],
    bahasan: `3/4 × ${utuh} = (3 × ${utuh}) : 4 = ${fmt((utuh * 3) / 4)}.`,
  });
  const skala = pick([100000, 200000, 250000]);
  const cmPeta = skala === 250000 ? pick([4, 6, 8]) : pick([4, 5, 6, 8]);
  const kmNyata = (cmPeta * skala) / 100000;
  out.push({
    topik: M,
    tanya: `Pada peta berskala 1 : ${fmt(skala)}, jarak dua pos adalah ${cmPeta} cm. Jarak sebenarnya kedua pos tersebut adalah ...`,
    benar: `${fmt(kmNyata)} km`,
    salah: [`${fmt(kmNyata * 10)} km`, `${fmt(cmPeta * skala)} km`, `${fmt(kmNyata / 2)} km`],
    bahasan: `Jarak sebenarnya = ${cmPeta} × ${fmt(skala)} cm = ${fmt(cmPeta * skala)} cm = ${fmt(kmNyata)} km.`,
  });
  out.forEach(cekItem);
  return out;
}

// ============================================================
// SOAL TULISAN ORISINAL — {topik, tanya, benar, salah[3], bahasan}
// ============================================================
const FISIKA = [
  {
    topik: 'Pengetahuan Alam (Fisika)',
    tanya: 'Satuan gaya dalam Sistem Internasional (SI) adalah ...',
    benar: 'newton',
    salah: ['joule', 'watt', 'pascal'],
    bahasan: 'Gaya diukur dalam newton (N). Joule adalah satuan energi, watt satuan daya, dan pascal satuan tekanan.',
  },
  {
    topik: 'Pengetahuan Alam (Fisika)',
    tanya: 'Sebuah kendaraan bergerak menempuh jarak 120 meter dalam waktu 10 sekon dengan kelajuan tetap. Kelajuan kendaraan tersebut adalah ...',
    benar: '12 m/s',
    salah: ['10 m/s', '15 m/s', '20 m/s'],
    bahasan: 'Kelajuan = jarak : waktu = 120 m : 10 s = 12 m/s.',
  },
  {
    topik: 'Pengetahuan Alam (Fisika)',
    tanya: 'Energi kinetik sebuah benda yang bergerak akan menjadi lebih besar apabila ...',
    benar: 'massa dan kelajuannya bertambah',
    salah: ['massanya bertambah tetapi kelajuannya berkurang', 'benda berhenti bergerak', 'benda berada pada tempat yang lebih tinggi'],
    bahasan: 'Energi kinetik dirumuskan Ek = ½mv², sehingga membesar bila massa (m) dan kelajuan (v) bertambah. Ketinggian memengaruhi energi potensial, bukan energi kinetik.',
  },
  {
    topik: 'Pengetahuan Alam (Fisika)',
    tanya: 'Alat yang digunakan untuk mengukur kuat arus listrik dalam suatu rangkaian adalah ...',
    benar: 'amperemeter',
    salah: ['voltmeter', 'ohmmeter', 'termometer'],
    bahasan: 'Kuat arus listrik diukur dengan amperemeter. Voltmeter mengukur tegangan, ohmmeter mengukur hambatan, dan termometer mengukur suhu.',
  },
];
const KIMIA = [
  {
    topik: 'Pengetahuan Alam (Kimia)',
    tanya: 'Lambang unsur emas adalah ...',
    benar: 'Au',
    salah: ['Ag', 'Fe', 'Pb'],
    bahasan: 'Emas berlambang Au (dari bahasa Latin aurum). Ag adalah perak, Fe adalah besi, dan Pb adalah timbal.',
  },
  {
    topik: 'Pengetahuan Alam (Kimia)',
    tanya: 'Suatu larutan diketahui bersifat asam. Nilai pH larutan tersebut adalah ...',
    benar: 'kurang dari 7',
    salah: ['tepat 7', 'lebih dari 7', 'selalu 14'],
    bahasan: 'Skala pH: larutan asam mempunyai pH kurang dari 7, larutan netral tepat 7, dan larutan basa lebih dari 7.',
  },
  {
    topik: 'Pengetahuan Alam (Kimia)',
    tanya: 'Partikel terkecil dari suatu unsur yang masih memiliki sifat unsur tersebut adalah ...',
    benar: 'atom',
    salah: ['molekul', 'ion', 'campuran'],
    bahasan: 'Atom adalah partikel terkecil penyusun unsur yang masih mempertahankan sifat unsur itu. Molekul adalah gabungan dua atom atau lebih, sedangkan ion adalah atom atau kelompok atom bermuatan.',
  },
  {
    topik: 'Pengetahuan Alam (Kimia)',
    tanya: 'Perubahan wujud zat dari gas menjadi cair disebut ...',
    benar: 'mengembun',
    salah: ['mencair', 'membeku', 'menyublim'],
    bahasan: 'Gas berubah menjadi cair disebut mengembun, misalnya terbentuknya embun. Mencair adalah padat menjadi cair, membeku cair menjadi padat, dan menyublim padat menjadi gas.',
  },
];
const BIOLOGI = [
  {
    topik: 'Pengetahuan Alam (Biologi)',
    tanya: 'Organel sel tumbuhan yang menjadi tempat berlangsungnya fotosintesis adalah ...',
    benar: 'kloroplas',
    salah: ['mitokondria', 'ribosom', 'nukleus'],
    bahasan: 'Fotosintesis berlangsung di kloroplas yang mengandung klorofil. Mitokondria berperan dalam respirasi sel, ribosom dalam sintesis protein, dan nukleus mengatur aktivitas sel.',
  },
  {
    topik: 'Pengetahuan Alam (Biologi)',
    tanya: 'Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah ...',
    benar: 'jantung',
    salah: ['paru-paru', 'hati', 'ginjal'],
    bahasan: 'Jantung adalah organ pemompa darah dalam sistem peredaran darah. Paru-paru tempat pertukaran gas, hati antara lain menetralkan racun, dan ginjal menyaring darah membentuk urine.',
  },
  {
    topik: 'Pengetahuan Alam (Biologi)',
    tanya: 'Satuan pewarisan sifat yang menentukan ciri keturunan suatu makhluk hidup adalah ...',
    benar: 'gen',
    salah: ['jaringan', 'organ', 'sistem organ'],
    bahasan: 'Gen adalah satuan pewarisan sifat yang terdapat pada kromosom di dalam inti sel dan diwariskan dari induk kepada keturunannya.',
  },
  {
    topik: 'Pengetahuan Alam (Biologi)',
    tanya: 'Dalam sebuah rantai makanan di sawah, yang berperan sebagai produsen adalah ...',
    benar: 'tanaman padi',
    salah: ['belalang', 'katak', 'ular'],
    bahasan: 'Produsen adalah makhluk hidup yang membuat makanannya sendiri melalui fotosintesis, yaitu tanaman padi. Belalang, katak, dan ular adalah konsumen pada tingkat yang berbeda-beda.',
  },
];
const INGGRIS = [
  {
    topik: 'Bahasa Inggris',
    tanya: 'She ___ to the training field every morning.',
    benar: 'goes',
    salah: ['go', 'going', 'gone'],
    bahasan: 'Subjek "She" adalah orang ketiga tunggal, sehingga kata kerja bentuk kalimat berita waktu kini mendapat akhiran -es: "goes".',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'The past form of the verb "eat" is ...',
    benar: 'ate',
    salah: ['eated', 'eating', 'eats'],
    bahasan: '"Eat" adalah kata kerja tidak beraturan: eat – ate – eaten. Bentuk lampau (past simple) yang benar adalah "ate"; "eated" tidak ada dalam bahasa Inggris.',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'The synonym of "rapid" is ...',
    benar: 'fast',
    salah: ['slow', 'weak', 'late'],
    bahasan: '"Rapid" berarti cepat, sinonimnya "fast". "Slow" adalah antonimnya, "weak" berarti lemah, dan "late" berarti terlambat.',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'They ___ playing football at the moment.',
    benar: 'are',
    salah: ['is', 'am', 'was playing yesterday'],
    bahasan: 'Frasa "at the moment" menunjukkan present continuous dengan subjek jamak "They", sehingga dipakai "are" + kata kerja -ing: "They are playing".',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'Mount Semeru is ___ than Mount Slamet.',
    benar: 'higher',
    salah: ['high', 'highest', 'more high'],
    bahasan: 'Kata "than" menandai perbandingan (comparative degree), sehingga dipakai "higher". "Highest" adalah superlatif dan tidak dipakai bersama "than" di sini.',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'Read the text: "Andi wakes up at 5 a.m. Before going to school, he jogs around his village for thirty minutes." What does Andi do before going to school?',
    benar: 'He jogs around his village.',
    salah: ['He wakes up at school.', 'He jogs for five hours.', 'He goes to school at 5 a.m.'],
    bahasan: 'Teks menyatakan Andi bangun pukul 5 pagi lalu jogging mengelilingi kampungnya selama tiga puluh menit sebelum berangkat sekolah.',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'The manual book is ___ the table.',
    benar: 'on',
    salah: ['in the table', 'at table yesterday', 'between table'],
    bahasan: 'Untuk benda yang berada di atas permukaan, preposisi yang tepat adalah "on": "on the table".',
  },
  {
    topik: 'Bahasa Inggris',
    tanya: 'The plural form of "child" is ...',
    benar: 'children',
    salah: ['childs', 'childes', 'childrens'],
    bahasan: '"Child" adalah kata benda tidak beraturan; bentuk jamaknya "children", bukan ditambah -s biasa.',
  },
];
const INDONESIA = [
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Bacalah paragraf berikut: "Latihan fisik yang teratur membuat tubuh prajurit kuat dan bugar. Dengan tubuh yang bugar, tugas berat di lapangan dapat dijalani dengan baik. Karena itu, pembinaan fisik menjadi menu wajib setiap hari." Ide pokok paragraf tersebut adalah ...',
    benar: 'pentingnya latihan fisik teratur bagi kebugaran prajurit',
    salah: ['jadwal upacara di lapangan', 'jenis-jenis tugas berat prajurit', 'menu makanan prajurit setiap hari'],
    bahasan: 'Seluruh kalimat dalam paragraf mendukung satu gagasan utama: latihan fisik teratur penting bagi kebugaran prajurit. Pilihan lain hanya menyentuh potongan kecil isi paragraf.',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Kalimat yang efektif adalah ...',
    benar: 'Para peserta mengikuti tes dengan tertib.',
    salah: ['Para peserta-peserta mengikuti tes dengan tertibnya sekali.', 'Kepada para peserta diharapkan untuk mengikuti tes dengan tertib-rapi.', 'Para peserta mengikuti tes dengan sangat amat tertib sekali.'],
    bahasan: 'Kalimat efektif itu hemat dan tidak bertele-tele: "Para peserta mengikuti tes dengan tertib." Pilihan lain mengandung pengulangan kata dan pemborosan ("peserta-peserta" setelah "para", "sangat amat ... sekali").',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Sinonim kata "gigih" adalah ...',
    benar: 'tekun',
    salah: ['lelah', 'ragu', 'sombong'],
    bahasan: '"Gigih" berarti tekun dan tidak mudah menyerah dalam berusaha, sehingga sinonimnya adalah "tekun".',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Antonim kata "optimis" adalah ...',
    benar: 'pesimis',
    salah: ['realistis', 'percaya diri', 'semangat'],
    bahasan: 'Optimis berarti berpandangan penuh harapan; lawan katanya adalah pesimis, yaitu berpandangan serba suram terhadap hasil.',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Penulisan huruf kapital yang benar terdapat pada kalimat ...',
    benar: 'Sungai Bengawan Solo mengalir melalui Jawa Tengah dan Jawa Timur.',
    salah: ['Sungai bengawan solo mengalir melalui jawa tengah.', 'sungai Bengawan Solo Mengalir Melalui Jawa Tengah.', 'Sungai Bengawan solo mengalir melalui Jawa tengah dan Jawa Timur.'],
    bahasan: 'Nama geografi (Sungai Bengawan Solo, Jawa Tengah, Jawa Timur) ditulis dengan huruf kapital pada setiap kata pentingnya, dan awal kalimat juga kapital. Pilihan lain salah pada penulisan nama tempatnya.',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Kata baku dari kata "apotik" adalah ...',
    benar: 'apotek',
    salah: ['apotik', 'afotek', 'apoteker'],
    bahasan: 'Menurut KBBI, bentuk baku tempat menjual obat adalah "apotek". "Apoteker" adalah nama profesinya, bukan tempatnya.',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Kata berimbuhan yang tepat untuk melengkapi kalimat "Prajurit itu berhasil ___ posisi musuh dalam latihan perang-perangan" adalah ...',
    benar: 'merebut',
    salah: ['merebutkan', 'rebutan', 'direbut-rebut'],
    bahasan: 'Kata dasar "rebut" dengan awalan me- menjadi "merebut" dan tepat sebagai predikat kalimat aktif tersebut. Bentuk lain tidak sesuai kaidah atau makna kalimat.',
  },
  {
    topik: 'Bahasa Indonesia',
    tanya: 'Penggunaan tanda koma yang benar terdapat pada kalimat ...',
    benar: 'Setelah apel pagi, seluruh peserta mengikuti pemeriksaan kesehatan.',
    salah: ['Setelah apel pagi seluruh peserta, mengikuti pemeriksaan kesehatan.', 'Setelah, apel pagi seluruh peserta mengikuti pemeriksaan, kesehatan.', 'Setelah apel pagi seluruh peserta mengikuti, pemeriksaan kesehatan.'],
    bahasan: 'Keterangan waktu yang mendahului induk kalimat dipisahkan dengan tanda koma: "Setelah apel pagi, seluruh peserta mengikuti pemeriksaan kesehatan." Tanda koma tidak memisahkan subjek dari predikatnya.',
  },
];
const WK_AKADEMI = [
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Bunyi sila keempat Pancasila adalah ...',
    benar: 'Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan',
    salah: ['Persatuan Indonesia', 'Kemanusiaan yang adil dan beradab', 'Keadilan sosial bagi seluruh rakyat Indonesia'],
    bahasan: 'Sila keempat berbunyi "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan". Pilihan lain adalah sila ketiga, kedua, dan kelima.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Menurut Pasal 1 ayat (1) UUD 1945, Negara Indonesia adalah negara kesatuan yang berbentuk ...',
    benar: 'republik',
    salah: ['federasi', 'kerajaan', 'serikat'],
    bahasan: 'Pasal 1 ayat (1) UUD 1945 menyatakan: "Negara Indonesia ialah negara kesatuan, yang berbentuk Republik."',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Menurut UU No. 34 Tahun 2004, tugas pokok TNI adalah ...',
    benar: 'menegakkan kedaulatan negara, mempertahankan keutuhan wilayah NKRI, dan melindungi segenap bangsa dan seluruh tumpah darah Indonesia',
    salah: ['memelihara keamanan dan ketertiban masyarakat serta menegakkan hukum', 'melaksanakan pembangunan daerah dan pelayanan administrasi kependudukan', 'mengatur lalu lintas dan menerbitkan surat izin mengemudi'],
    bahasan: 'Pasal 7 ayat (1) UU No. 34 Tahun 2004 menetapkan tugas pokok TNI di bidang pertahanan negara seperti pada jawaban. Memelihara kamtibmas dan menegakkan hukum adalah tugas pokok Polri.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Berdasarkan UUD 1945, kekuasaan tertinggi atas Angkatan Darat, Angkatan Laut, dan Angkatan Udara dipegang oleh ...',
    benar: 'Presiden',
    salah: ['Panglima TNI', 'Menteri Pertahanan', 'Ketua DPR'],
    bahasan: 'Pasal 10 UUD 1945 menyatakan Presiden memegang kekuasaan tertinggi atas Angkatan Darat, Angkatan Laut, dan Angkatan Udara.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Teks Proklamasi Kemerdekaan Indonesia dibacakan oleh Ir. Soekarno pada 17 Agustus 1945 bertempat di ...',
    benar: 'Jalan Pegangsaan Timur Nomor 56, Jakarta',
    salah: ['Lapangan Ikada, Jakarta', 'Jalan Imam Bonjol Nomor 1, Jakarta', 'Gedung Pancasila, Jakarta'],
    bahasan: 'Proklamasi dibacakan di halaman rumah Ir. Soekarno di Jalan Pegangsaan Timur No. 56, Jakarta, pada Jumat, 17 Agustus 1945 pukul 10.00.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Peristiwa Sumpah Pemuda yang menjadi tonggak persatuan bangsa terjadi pada tanggal ...',
    benar: '28 Oktober 1928',
    salah: ['20 Mei 1908', '17 Agustus 1945', '1 Juni 1945'],
    bahasan: 'Sumpah Pemuda diikrarkan pada Kongres Pemuda II, 28 Oktober 1928. Tanggal 20 Mei 1908 adalah Kebangkitan Nasional (Budi Utomo) dan 1 Juni 1945 adalah pidato lahirnya Pancasila.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Ketentuan UUD 1945 yang menegaskan bahwa bentuk Negara Kesatuan Republik Indonesia tidak dapat dilakukan perubahan terdapat pada ...',
    benar: 'Pasal 37 ayat (5)',
    salah: ['Pasal 1 ayat (2)', 'Pasal 18 ayat (1)', 'Pasal 30 ayat (1)'],
    bahasan: 'Pasal 37 ayat (5) UUD 1945 menyatakan khusus mengenai bentuk Negara Kesatuan Republik Indonesia tidak dapat dilakukan perubahan.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Hari lahir Pancasila diperingati setiap tanggal 1 Juni, merujuk pada peristiwa ...',
    benar: 'pidato Ir. Soekarno di sidang BPUPKI tahun 1945',
    salah: ['pengangkatan Ir. Soekarno sebagai presiden pertama', 'pembacaan teks Proklamasi tahun 1945', 'sidang PPKI yang mengesahkan UUD 1945'],
    bahasan: 'Pada 1 Juni 1945, Ir. Soekarno berpidato di sidang BPUPKI dan pertama kali mengemukakan nama serta rumusan lima dasar negara yang disebutnya Pancasila.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Bendera Merah Putih yang dikibarkan pada Proklamasi 1945 dijahit oleh ...',
    benar: 'Fatmawati',
    salah: ['Cut Nyak Dien', 'R.A. Kartini', 'Dewi Sartika'],
    bahasan: 'Sang Saka Merah Putih jahitan Ibu Fatmawati, istri Ir. Soekarno, dikibarkan pada upacara Proklamasi 17 Agustus 1945.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Semboyan Bhinneka Tunggal Ika yang tercantum pada lambang negara Garuda Pancasila berarti ...',
    benar: 'berbeda-beda tetapi tetap satu jua',
    salah: ['bersatu kita teguh, bercerai kita runtuh', 'satu nusa, satu bangsa, satu bahasa', 'merdeka atau mati'],
    bahasan: 'Bhinneka Tunggal Ika berasal dari Kitab Sutasoma karya Mpu Tantular dan berarti "berbeda-beda tetapi tetap satu jua" — keberagaman bangsa yang tetap satu kesatuan.',
  },
];

const WK_BINTARA = [
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Bunyi sila pertama Pancasila adalah ...',
    benar: 'Ketuhanan Yang Maha Esa',
    salah: ['Kemanusiaan yang adil dan beradab', 'Persatuan Indonesia', 'Keadilan sosial bagi seluruh rakyat Indonesia'],
    bahasan: 'Sila pertama Pancasila berbunyi "Ketuhanan Yang Maha Esa", dilambangkan bintang. Pilihan lain adalah sila kedua, ketiga, dan kelima.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Lambang sila ketiga Pancasila, Persatuan Indonesia, adalah ...',
    benar: 'pohon beringin',
    salah: ['rantai', 'padi dan kapas', 'banteng'],
    bahasan: 'Sila ketiga dilambangkan pohon beringin. Rantai adalah lambang sila kedua, banteng sila keempat, dan padi serta kapas sila kelima.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Lambang sila kelima Pancasila adalah ...',
    benar: 'padi dan kapas',
    salah: ['bintang', 'pohon beringin', 'rantai'],
    bahasan: 'Sila kelima, Keadilan sosial bagi seluruh rakyat Indonesia, dilambangkan padi dan kapas yang menggambarkan sandang dan pangan sebagai kebutuhan dasar rakyat.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'UUD 1945 disahkan sebagai konstitusi negara oleh PPKI pada tanggal ...',
    benar: '18 Agustus 1945',
    salah: ['17 Agustus 1945', '1 Juni 1945', '28 Oktober 1928'],
    bahasan: 'Sehari setelah Proklamasi, pada 18 Agustus 1945, PPKI mengesahkan UUD 1945 dan memilih Presiden serta Wakil Presiden pertama.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Ketua Badan Penyelidik Usaha-Usaha Persiapan Kemerdekaan Indonesia (BPUPKI) adalah ...',
    benar: 'Radjiman Wedyodiningrat',
    salah: ['Ir. Soekarno', 'Drs. Mohammad Hatta', 'Mr. Muhammad Yamin'],
    bahasan: 'BPUPKI diketuai oleh dr. Radjiman Wedyodiningrat. Soekarno, Hatta, dan Yamin adalah anggota yang menyampaikan usulan dasar negara dalam sidang BPUPKI.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Semboyan Bhinneka Tunggal Ika diambil dari Kitab Sutasoma karya ...',
    benar: 'Mpu Tantular',
    salah: ['Mpu Prapanca', 'Mpu Sedah', 'Mpu Panuluh'],
    bahasan: 'Frasa Bhinneka Tunggal Ika terdapat dalam Kitab Sutasoma karya Mpu Tantular pada masa Majapahit. Mpu Prapanca menulis Kitab Negarakertagama.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Menurut Pasal 30 ayat (1) UUD 1945, tiap-tiap warga negara berhak dan wajib ikut serta dalam ...',
    benar: 'usaha pertahanan dan keamanan negara',
    salah: ['pemilihan umum lima tahunan', 'pembayaran pajak dan retribusi', 'program wajib belajar dua belas tahun'],
    bahasan: 'Pasal 30 ayat (1) UUD 1945: "Tiap-tiap warga negara berhak dan wajib ikut serta dalam usaha pertahanan dan keamanan negara." Inilah landasan konstitusional bela negara.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Pertempuran besar rakyat Surabaya melawan tentara Sekutu pada 10 November 1945 diperingati sebagai ...',
    benar: 'Hari Pahlawan',
    salah: ['Hari Kebangkitan Nasional', 'Hari Kesaktian Pancasila', 'Hari Sumpah Pemuda'],
    bahasan: 'Peristiwa 10 November 1945 di Surabaya diperingati sebagai Hari Pahlawan. Hari Kebangkitan Nasional jatuh pada 20 Mei dan Hari Kesaktian Pancasila pada 1 Oktober.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Pengakuan kedaulatan Indonesia oleh Belanda secara resmi terjadi melalui ...',
    benar: 'Konferensi Meja Bundar tahun 1949',
    salah: ['Perjanjian Linggarjati tahun 1947', 'Perjanjian Renville tahun 1948', 'Proklamasi 17 Agustus 1945'],
    bahasan: 'Melalui Konferensi Meja Bundar di Den Haag tahun 1949, Belanda secara resmi mengakui kedaulatan Indonesia pada 27 Desember 1949.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Butir ketiga Sumpah Pemuda tahun 1928 menyatakan menjunjung tinggi ...',
    benar: 'bahasa persatuan, Bahasa Indonesia',
    salah: ['tanah air Indonesia', 'bangsa Indonesia', 'lagu kebangsaan Indonesia Raya'],
    bahasan: 'Sumpah Pemuda berisi tiga ikrar: satu tanah air, satu bangsa, dan menjunjung bahasa persatuan, Bahasa Indonesia.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Indonesia disebut negara kepulauan karena ...',
    benar: 'wilayahnya terdiri atas ribuan pulau yang tersebar dari Sabang sampai Merauke',
    salah: ['seluruh penduduknya bekerja sebagai nelayan', 'ibu kotanya berada di sebuah pulau kecil', 'wilayahnya hanya terdiri atas dua pulau besar'],
    bahasan: 'Indonesia adalah negara kepulauan terbesar di dunia, terdiri atas belasan ribu pulau besar dan kecil yang dihubungkan oleh perairan.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Rumusan Pancasila sebagai dasar negara tercantum dalam Pembukaan UUD 1945, tepatnya pada ...',
    benar: 'alinea keempat',
    salah: ['alinea pertama', 'alinea kedua', 'alinea ketiga'],
    bahasan: 'Alinea keempat Pembukaan UUD 1945 memuat rumusan kelima sila Pancasila secara berurutan sebagai dasar negara.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Pengambilan keputusan dengan cara membicarakan bersama hingga tercapai kesepakatan bersama disebut ...',
    benar: 'musyawarah untuk mufakat',
    salah: ['voting suara terbanyak', 'keputusan sepihak pemimpin', 'undian bersama'],
    bahasan: 'Musyawarah untuk mufakat adalah cara pengambilan keputusan khas sila keempat Pancasila: dibicarakan bersama hingga dicapai kata sepakat.',
  },
  {
    topik: 'Wawasan Kebangsaan',
    tanya: 'Sikap bela negara yang paling tepat ditunjukkan oleh seorang siswa adalah ...',
    benar: 'belajar dengan tekun dan menaati peraturan sekolah',
    salah: ['menghindari upacara bendera karena melelahkan', 'menolak mata pelajaran Pendidikan Pancasila', 'hanya bergaul dengan teman satu daerah asal'],
    bahasan: 'Bela negara tidak selalu berarti angkat senjata; bagi siswa, wujudnya adalah belajar tekun, disiplin, dan menaati aturan — sikap yang menjadi fondasi kesiapan membela negara.',
  },
];
const PU = [
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Ibu kota Provinsi Jawa Timur adalah ...',
    benar: 'Surabaya',
    salah: ['Malang', 'Kediri', 'Madiun'],
    bahasan: 'Ibu kota Provinsi Jawa Timur adalah Surabaya. Malang, Kediri, dan Madiun adalah kota lain di Jawa Timur, bukan ibu kota provinsi.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Pulau terbesar di wilayah Indonesia adalah ...',
    benar: 'Kalimantan',
    salah: ['Sumatera', 'Sulawesi', 'Jawa'],
    bahasan: 'Kalimantan adalah pulau terbesar di Indonesia (bagian Indonesia dari Pulau Borneo), disusul Sumatera dan Papua sebagai pulau terluas berikutnya.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Selat yang memisahkan Pulau Jawa dan Pulau Sumatera adalah ...',
    benar: 'Selat Sunda',
    salah: ['Selat Malaka', 'Selat Madura', 'Selat Makassar'],
    bahasan: 'Selat Sunda terletak di antara Jawa dan Sumatera. Selat Malaka memisahkan Sumatera dari Semenanjung Malaya, Selat Madura di antara Jawa dan Madura.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Gunung tertinggi di Indonesia adalah ...',
    benar: 'Puncak Jaya di Papua',
    salah: ['Gunung Semeru di Jawa Timur', 'Gunung Kerinci di Jambi', 'Gunung Rinjani di Nusa Tenggara Barat'],
    bahasan: 'Puncak Jaya (Carstensz) di Papua, sekitar 4.884 mdpl, adalah titik tertinggi Indonesia. Semeru adalah yang tertinggi di Pulau Jawa, bukan di Indonesia.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Menurut UU No. 34 Tahun 2004, TNI terdiri atas ...',
    benar: 'TNI Angkatan Darat, TNI Angkatan Laut, dan TNI Angkatan Udara',
    salah: ['TNI Angkatan Darat dan Kepolisian Negara Republik Indonesia', 'TNI Angkatan Darat, Angkatan Laut, dan Badan Intelijen Negara', 'TNI Angkatan Darat saja sebagai matra tunggal'],
    bahasan: 'UU No. 34 Tahun 2004 tentang TNI menetapkan TNI terdiri atas tiga matra: Angkatan Darat, Angkatan Laut, dan Angkatan Udara. Polri adalah institusi tersendiri di luar TNI.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Markas Besar TNI berkedudukan di ...',
    benar: 'Cilangkap, Jakarta Timur',
    salah: ['Magelang, Jawa Tengah', 'Cimahi, Jawa Barat', 'Surabaya, Jawa Timur'],
    bahasan: 'Markas Besar (Mabes) TNI berada di Cilangkap, Jakarta Timur. Magelang dikenal sebagai lokasi Akademi Militer, bukan Mabes TNI.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Menurut UU No. 34 Tahun 2004, Panglima TNI diangkat dan diberhentikan oleh ...',
    benar: 'Presiden dengan persetujuan DPR',
    salah: ['Menteri Pertahanan tanpa persetujuan DPR', 'Presiden tanpa melibatkan DPR', 'Kepala Staf Angkatan secara bergilir'],
    bahasan: 'Pasal 13 UU No. 34 Tahun 2004: Panglima TNI diangkat dan diberhentikan oleh Presiden setelah mendapat persetujuan Dewan Perwakilan Rakyat.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Jumlah provinsi di Indonesia saat ini adalah ...',
    benar: '38 provinsi',
    salah: ['34 provinsi', '36 provinsi', '40 provinsi'],
    bahasan: 'Setelah pemekaran empat provinsi baru di Papua (Papua Selatan, Papua Tengah, Papua Pegunungan, dan Papua Barat Daya), jumlah provinsi Indonesia menjadi 38.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Hari ulang tahun TNI diperingati setiap tanggal ...',
    benar: '5 Oktober',
    salah: ['17 Agustus', '10 November', '1 Juni'],
    bahasan: 'HUT TNI diperingati setiap 5 Oktober, merujuk pada pembentukan Tentara Keamanan Rakyat (TKR) pada 5 Oktober 1945.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Sungai terpanjang di Indonesia adalah ...',
    benar: 'Sungai Kapuas di Kalimantan Barat',
    salah: ['Sungai Bengawan Solo di Jawa', 'Sungai Musi di Sumatera Selatan', 'Sungai Citarum di Jawa Barat'],
    bahasan: 'Sungai Kapuas di Kalimantan Barat, dengan panjang sekitar 1.143 km, adalah sungai terpanjang di Indonesia.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Kewarganegaraan Republik Indonesia saat ini diatur dalam undang-undang, yaitu ...',
    benar: 'UU No. 12 Tahun 2006',
    salah: ['UU No. 34 Tahun 2004', 'UU No. 2 Tahun 2002', 'UU No. 20 Tahun 2003'],
    bahasan: 'Kewarganegaraan diatur dalam UU No. 12 Tahun 2006. UU 34/2004 mengatur TNI, UU 2/2002 mengatur Polri, dan UU 20/2003 mengatur sistem pendidikan nasional.',
  },
  {
    topik: 'Pengetahuan Umum',
    tanya: 'Danau terbesar di Indonesia adalah ...',
    benar: 'Danau Toba di Sumatera Utara',
    salah: ['Danau Poso di Sulawesi Tengah', 'Danau Singkarak di Sumatera Barat', 'Danau Sentani di Papua'],
    bahasan: 'Danau Toba di Sumatera Utara adalah danau terbesar di Indonesia sekaligus salah satu danau vulkanik terbesar di dunia.',
  },
];

// ============================================================
// PERAKITAN PAKET
// ============================================================
[...FISIKA, ...KIMIA, ...BIOLOGI, ...INGGRIS, ...INDONESIA, ...WK_AKADEMI, ...WK_BINTARA, ...PU].forEach(cekItem);

const soalAkademi = rakit([
  ...mathAkademi(),
  ...FISIKA, ...KIMIA, ...BIOLOGI,
  ...INGGRIS, ...INDONESIA, ...WK_AKADEMI,
]);
const soalBintara = rakit([
  ...WK_BINTARA, ...PU, ...mathDasar(),
]);

function komposisi(soal) {
  const hitung = new Map();
  for (const s of soal) {
    const grup = s.topik.startsWith('Pengetahuan Alam') ? 'Pengetahuan Alam' : s.topik;
    hitung.set(grup, (hitung.get(grup) || 0) + 1);
  }
  return [...hitung.entries()].map(([topik, jumlah]) => ({ topik, jumlah }));
}

const paketAkademi = {
  slug: 'akademi-tni',
  judul: 'Prediksi Soal Tes Akademik Taruna Akademi TNI',
  jalur: 'Akademi TNI (Akmil · AAL · AAU)',
  durasiMenit: 100,
  intro: 'Latihan 50 soal untuk calon Taruna Akademi TNI: Matematika 12 soal, Pengetahuan Alam 12 soal (Fisika, Kimia, Biologi dasar SMA), Bahasa Inggris 8 soal, Bahasa Indonesia 8 soal, dan Wawasan Kebangsaan 10 soal. Soal latihan orisinal mengikuti mata uji yang umum diujikan pada seleksi Akademi TNI — bukan bocoran dan bukan soal resmi.',
  komposisi: komposisi(soalAkademi),
  soal: soalAkademi,
};
const paketBintara = {
  slug: 'bintara-tamtama',
  judul: 'Prediksi Soal Tes Bintara & Tamtama TNI',
  jalur: 'Bintara PK & Tamtama PK (AD · AL · AU)',
  durasiMenit: 80,
  intro: 'Latihan 40 soal untuk calon Bintara dan Tamtama PK TNI: Wawasan Kebangsaan 14 soal (Pancasila, UUD 1945, NKRI, sejarah perjuangan, bela negara), Pengetahuan Umum 12 soal (geografi Indonesia, kewarganegaraan, dasar UU No. 34 Tahun 2004 tentang TNI), dan Matematika Dasar 14 soal. Soal latihan orisinal — bukan bocoran dan bukan soal resmi.',
  komposisi: komposisi(soalBintara),
  soal: soalBintara,
};

writeFileSync(new URL('../src/data/paket/akademi-tni.json', import.meta.url), JSON.stringify(paketAkademi, null, 2) + '\n');
writeFileSync(new URL('../src/data/paket/bintara-tamtama.json', import.meta.url), JSON.stringify(paketBintara, null, 2) + '\n');
console.log(`akademi-tni: ${soalAkademi.length} soal — ${JSON.stringify(paketAkademi.komposisi)}`);
console.log(`bintara-tamtama: ${soalBintara.length} soal — ${JSON.stringify(paketBintara.komposisi)}`);
