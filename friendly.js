/* friendly.js — Plugin Friendly Pack (Build v6.6): Jam Pasar + Tur Onboarding + Kamus Mini */
(function () {
  if (!window.P) return;

  /* ================= 🕰️ JAM PASAR & COUNTDOWN (tab Market, paling atas) ================= */
  const firstMarketCard = document.getElementById('mktTemp') ? document.getElementById('mktTemp').closest('.card') : null;
  const clockCard = document.createElement('div');
  clockCard.className = 'card';
  clockCard.innerHTML = `
    <div class="card-title"><span>🕰️ Jam Pasar BEI</span><span class="agent-pill tech">WIB Live</span></div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
      <div>
        <div id="clkTime" style="font-family:var(--mono);font-size:1.5rem;font-weight:800;color:#fff;line-height:1;">--:--:--</div>
        <div id="clkDate" style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">-</div>
      </div>
      <div style="text-align:right;">
        <div id="clkStatus" class="tf-badge tf-warn" style="margin:0 0 6px 0;display:inline-block;">-</div>
        <div id="clkNext" style="font-size:0.7rem;color:var(--text-muted);font-family:var(--mono);">-</div>
      </div>
    </div>
    <div class="src-note">Sesi I 09:00–12:00 • Istirahat 12:00–13:30 • Sesi II 13:30–15:50 (pra-penutupan 15:50–16:00). Hitung mundur ke perubahan sesi berikutnya.</div>`;
  const marketTab = document.getElementById('tab-market');
  if (marketTab) marketTab.insertBefore(clockCard, firstMarketCard || marketTab.firstChild);

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtCountdown(ms) {
    if (ms <= 0) return 'sekarang';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h > 0 ? h + 'j ' : '') + pad(m) + 'm ' + pad(ss) + 'd';
  }
  function tickClock() {
    const w = P.wib();
    const d = w.getDay(), mins = w.getHours() * 60 + w.getMinutes(), sec = w.getSeconds();
    document.getElementById('clkTime').innerText = pad(w.getHours()) + ':' + pad(w.getMinutes()) + ':' + pad(sec);
    document.getElementById('clkDate').innerText = w.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    const st = document.getElementById('clkStatus'), nx = document.getElementById('clkNext');
    let label, cls, nextMs = null, nextLabel = '';
    if (d === 0 || d === 6) {
      label = 'AKHIR PEKAN — bursa tutup'; cls = 'tf-warn';
      const daysToMon = (8 - d) % 7 || 7;
      nextMs = daysToMon * 86400000 - (mins * 60 + sec) * 1000 + 9 * 3600000;
      nextLabel = 'Buka Senin 09:00';
    } else if (mins < 540) { label = 'PRE-MARKET — tunggu 09:00'; cls = 'tf-warn'; nextMs = (540 - mins) * 60000 - sec * 1000; nextLabel = 'Sesi I mulai'; }
    else if (mins < 720) { label = 'SESI I BERJALAN'; cls = 'tf-ok'; nextMs = (720 - mins) * 60000 - sec * 1000; nextLabel = 'Istirahat'; }
    else if (mins < 810) { label = 'ISTIRAHAT SIANG'; cls = 'tf-warn'; nextMs = (810 - mins) * 60000 - sec * 1000; nextLabel = 'Sesi II mulai'; }
    else if (mins < 950) { label = 'SESI II BERJALAN'; cls = 'tf-ok'; nextMs = (950 - mins) * 60000 - sec * 1000; nextLabel = 'Tutup 15:50'; }
    else { label = 'PASAR TUTUP'; cls = 'tf-warn'; nextMs = (24 * 60 - mins) * 60000 - sec * 1000 + 9 * 3600000; nextLabel = 'Buka besok 09:00'; }
    st.innerText = label; st.className = 'tf-badge ' + cls; st.style.margin = '0 0 6px 0'; st.style.display = 'inline-block';
    nx.innerText = nextLabel + ' dalam ' + fmtCountdown(nextMs);
  }
  tickClock(); setInterval(tickClock, 1000);

  /* ================= 📚 KAMUS MINI (tab Info) ================= */
  const GLOSS = [
    ['RSI', 'Relative Strength Index — mengukur kecepatan perubahan harga (0–100). <30 oversold (potensi pantul naik), >70 overbought (potensi koreksi).'],
    ['MOS', 'Margin of Safety — selisih antara harga pasar dan nilai wajar. Semakin besar MOS, semakin tebal "bantalan keamanan" Anda.'],
    ['SL', 'Stop Loss — batas rugi yang ditetapkan SEBELUM masuk, untuk memotong kerugian secara disiplin.'],
    ['PER', 'Price to Earnings — harga dibagi laba per lembar. Rendah = murah relatif laba (tapi konfirmasi sektor & pertumbuhan).'],
    ['PBV', 'Price to Book — harga dibagi nilai buku per lembar. <1 artinya harga di bawah nilai aset bersih.'],
    ['ROE', 'Return on Equity — seberapa efisien modal pemilik menghasilkan laba. ≥15% umumnya kuat.'],
    ['DER', 'Debt to Equity — rasio utang terhadap modal. Tinggi = leverage agresif (risiko & potensi lebih besar).'],
    ['ATR', 'Average True Range — rata-rata jarak gerak harga harian; dipakai menentukan Stop Loss yang "bernafas".'],
    ['Beta', 'Sensitivitas saham terhadap IHSG. Beta 1,5 = bergerak 1,5× lebih liar dari indeks.'],
    ['MOS Graham', 'Harga wajar konservatif = √(22,5 × EPS × BVPS). Cocok untuk penyaring awal, bukan target pasti.'],
    ['Closing Strength', 'Seberapa dekat harga tutup dengan tertinggi hari itu. ≥80% = pembeli menguasai sampai bel tutup (inti BSJP).'],
    ['Win Rate', 'Persentase trade yang untung. Ingat: win rate tinggi + rata-rata rugi besar tetap bisa rugi total — lihat juga net rata-rata.']
  ];
  P.card('tab-info', `
    <div class="card-title"><span>📚 Kamus Mini</span><span class="agent-pill fund">12 Istilah</span></div>
    <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Ketuk istilah untuk penjelasan singkat ala trader.</div>
    <div id="glossList"></div>
  `, document.querySelector('#tab-info .disclaimer-box'));
  document.getElementById('glossList').innerHTML = GLOSS.map(([t, d]) =>
    `<details class="agent-detail"><summary>${t}</summary><div style="font-size:0.74rem;color:#cbd5e1;line-height:1.5;margin-top:6px;">${esc(d)}</div></details>`
  ).join('');

  /* ================= 🧭 TUR ONBOARDING ================= */
  const STEPS = [
    { sel: '#tab-analysis .search-box', title: '1 · Analisis Saham', text: 'Ketik kode saham BEI lalu Proses. Aplikasi menghitung indikator riil, statistik risiko, fundamental, lalu menyusun laporan multi-agent.' },
    { sel: '#tab-market', title: '2 · Market & BSJP', text: 'Pantau suhu pasar, screener peluang, dan 🌙 kandidat Beli Sore Jual Pagi lengkap dengan track record setahun.' },
    { sel: '#tab-clinic', title: '3 · Klinik & Harga Wajar', text: 'Skor kesehatan A–D plus Graham Number dengan pita valuasi 3 metode. Kolom kosong bisa diisi manual.' },
    { sel: '#tab-porto', title: '4 · Porto & Alert', text: 'Catat posisi (lot + harga rata), lihat P&L & donut alokasi, pasang alert target harga, dan pantau heatmap watchlist.' },
    { sel: '#tab-journal', title: '5 · Jurnal & Track Record', text: 'Setiap analisis tersimpan otomatis. Hitung win-rate keputusan Anda sendiri — belajar dari data, bukan perasaan.' },
    { sel: '#tab-info', title: '6 · Info & Cadangan', text: 'Tes koneksi, ganti tema/OLED, dan Export/Import backup JSON supaya data Anda tidak pernah hilang.' }
  ];
  function ensureOverlay() {
    if (document.getElementById('tourOverlay')) return;
    const ov = document.createElement('div');
    ov.id = 'tourOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(4,8,18,0.82);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;';
    ov.innerHTML = `
      <div style="background:var(--card-bg);border:1px solid var(--accent);border-radius:16px;padding:20px;max-width:340px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.5);">
        <div id="tourTitle" style="font-weight:800;font-size:1rem;color:#fff;margin-bottom:8px;"></div>
        <div id="tourText" style="font-size:0.8rem;color:var(--text-muted);line-height:1.55;margin-bottom:14px;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span id="tourStep" style="font-size:0.68rem;color:var(--text-muted);font-family:var(--mono);"></span>
          <span style="display:flex;gap:8px;">
            <button class="btn-secondary" onclick="endTour()">Lewati</button>
            <button class="btn-action" id="tourNext" style="border-radius:8px;padding:8px 14px;font-size:0.78rem;">Lanjut</button>
          </span>
        </div>
      </div>`;
    document.body.appendChild(ov);
  }
  let tourIdx = 0;
  function showStep() {
    const s = STEPS[tourIdx];
    document.getElementById('tourTitle').innerText = s.title;
    document.getElementById('tourText').innerText = s.text;
    document.getElementById('tourStep').innerText = (tourIdx + 1) + ' / ' + STEPS.length;
    const btn = document.getElementById('tourNext');
    btn.innerText = tourIdx === STEPS.length - 1 ? 'Selesai ✓' : 'Lanjut';
    const targetSel = s.sel.split(' ')[0];
    try { switchTab(targetSel.replace('#tab-', '')); } catch (_) {}
  }
  window.nextTour = function () {
    tourIdx++;
    if (tourIdx >= STEPS.length) { endTour(); return; }
    showStep();
  };
  window.endTour = function () {
    const ov = document.getElementById('tourOverlay');
    if (ov) ov.remove();
    localStorage.setItem('ihsg_onboarded', '1');
  };
  window.startTour = function () {
    tourIdx = 0;
    ensureOverlay();
    showStep();
    document.getElementById('tourNext').onclick = window.nextTour;
  };
  // Tombol "Ulangi Tur" di tab Info
  P.card('tab-info', `
    <div class="card-title"><span>🧭 Tur Panduan</span><span class="agent-pill tech">6 Langkah</span></div>
    <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Baru pertama pakai, atau mau mengulang pengenalan fitur? Tur ini memandu Anda tab demi tab.</div>
    <button class="btn-copy" style="margin-top:0;" onclick="startTour()">🧭 Mulai / Ulangi Tur</button>
  `, document.querySelector('#tab-info .card'));
  // Auto-tur sekali saja
  if (localStorage.getItem('ihsg_onboarded') !== '1') {
    setTimeout(window.startTour, 1200);
  }
})();
