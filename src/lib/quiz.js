// PrediksiTNI — mesin kuis sisi browser.
// Satu mode instan: klik jawaban -> langsung ketahuan benar/salah beserta
// pembahasannya, skor berjalan tampil di toolbar. Semua state hanya hidup
// di halaman ini; tidak ada yang dikirim ke server.

const HURUF = ['A', 'B', 'C', 'D', 'E'];

export function initKuis() {
  const wadah = document.getElementById('kuis-app');
  const dataEl = document.getElementById('paket-data');
  if (!wadah || !dataEl) return;
  const paket = JSON.parse(dataEl.textContent);
  const soal = paket.soal;

  let jawaban = new Array(soal.length).fill(null);
  let terkunci = new Array(soal.length).fill(false);

  wadah.innerHTML = `
    <div class="kuis-toolbar">
      <div class="kuis-status">
        <span class="chip">Skor: <strong id="kuis-skor">0</strong></span>
        <span class="chip">Terjawab: <strong id="kuis-terjawab">0/${soal.length}</strong></span>
        <span class="chip" id="kuis-selesai-chip" hidden>Paket selesai — ulangi untuk skor lebih baik</span>
      </div>
      <button class="btn ghost" id="kuis-ulang">Ulangi Paket</button>
    </div>
    <div id="kuis-daftar"></div>
  `;

  const daftar = wadah.querySelector('#kuis-daftar');
  const elSkor = wadah.querySelector('#kuis-skor');
  const elTerjawab = wadah.querySelector('#kuis-terjawab');
  const elSelesaiChip = wadah.querySelector('#kuis-selesai-chip');

  function gambarUlang() {
    daftar.innerHTML = soal.map((s, i) => {
      const terpilih = jawaban[i];
      const periksa = terkunci[i];
      const opsi = s.pilihan.map((p, j) => {
        let kelas = 'opsi';
        if (terpilih === j) kelas += ' dipilih';
        if (periksa) {
          if (j === s.kunci) kelas += ' benar';
          else if (terpilih === j) kelas += ' salah';
        }
        return `<button class="${kelas}" data-soal="${i}" data-opsi="${j}" ${periksa ? 'disabled' : ''}>
          <span class="opsi-huruf">${HURUF[j]}</span><span>${p}</span></button>`;
      }).join('');
      const bahasan = periksa
        ? `<div class="bahasan"><strong>${terpilih === s.kunci ? 'Benar! ' : `Belum tepat — jawaban benar: ${HURUF[s.kunci]}. `}</strong>${s.bahasan}</div>`
        : '';
      return `<div class="kartu-soal" id="soal-${i + 1}">
        <div class="soal-kepala"><span class="soal-nomor">${i + 1}</span><span class="soal-topik">${s.topik}</span></div>
        <p class="soal-tanya">${s.tanya}</p>
        <div class="opsi-daftar">${opsi}</div>
        ${bahasan}
      </div>`;
    }).join('');

    const terjawab = jawaban.filter((j) => j !== null).length;
    const benar = soal.reduce((n, s, i) => n + (jawaban[i] === s.kunci ? 1 : 0), 0);
    elTerjawab.textContent = `${terjawab}/${soal.length}`;
    elSkor.textContent = terjawab ? String(Math.round((benar / soal.length) * 100)) : '0';
    elSelesaiChip.hidden = terjawab !== soal.length;
  }

  wadah.addEventListener('click', (ev) => {
    if (ev.target.closest('#kuis-ulang')) {
      jawaban = new Array(soal.length).fill(null);
      terkunci = new Array(soal.length).fill(false);
      gambarUlang();
      return;
    }
    const btnOpsi = ev.target.closest('.opsi');
    if (!btnOpsi) return;
    const i = Number(btnOpsi.dataset.soal);
    const j = Number(btnOpsi.dataset.opsi);
    if (terkunci[i]) return;
    jawaban[i] = j;
    terkunci[i] = true;
    gambarUlang();
  });

  gambarUlang();
}
