/* briefing.js - Kantor Agen AI 3/3 (Build v6.8): mesin Rapat Pagi + notulen cetak */
(function () {
  if (!window.P) return;

  /* ===== CSS cetak notulen ===== */
  (function () {
    var st = document.createElement('style');
    st.textContent = '@media print{body.printbrief *{visibility:hidden}body.printbrief #briefCard,body.printbrief #briefCard *{visibility:visible}body.printbrief #briefCard{position:absolute;left:0;top:0;width:100%;background:#fff;color:#000;border:none}}';
    document.head.appendChild(st);
  })();

  /* ===== kumpulkan data rapat (cache-first) ===== */
  async function gatherData() {
    var data = { swing: [], bsjp: [], thermo: null, alerts: [], ts: Date.now() };
    try {
      var sc = lsJSON('swscan_cache', null);
      if (sc && sc.rows) data.swing = sc.rows.slice(0, 3);
      else if (typeof window.runSwingScan === 'function') {
        await window.runSwingScan();
        var sc2 = lsJSON('swscan_cache', null);
        if (sc2 && sc2.rows) data.swing = sc2.rows.slice(0, 3);
      }
    } catch (e) {}
    try {
      var bc = lsJSON('bsjp_cache', null);
      if (bc && bc.rows) data.bsjp = bc.rows.slice(0, 1);
      else if (typeof window.runBSJP === 'function') {
        await window.runBSJP();
        var bc2 = lsJSON('bsjp_cache', null);
        if (bc2 && bc2.rows) data.bsjp = bc2.rows.slice(0, 1);
      }
    } catch (e) {}
    try {
      var th = lsJSON('thermo_cache', null);
      if (th) data.thermo = th;
    } catch (e) {}
    try {
      var al = lsJSON('ihsg_swing_alerts', []);
      for (var i = 0; i < al.length; i++) if (al[i].done) data.alerts.push(al[i]);
    } catch (e) {}
    return data;
  }

  function buildPrompt(d) {
    var p = '';
    p += 'Anda adalah Master Agent di KANTOR AGEN AI trading IHSG. Susun NOTULEN RAPAT PAGI ringkas, tegas, berbahasa Indonesia, berbasis DATA berikut (jangan mengarang angka).\n\n';
    p += 'SITUASI PASAR: ' + (d.thermo ? ('skor ' + d.thermo.score + ' (' + d.thermo.label + ')') : 'data suhu pasar tidak tersedia') + '.\n';
    p += 'KANDIDAT SWING (buy-on-dip dalam tren): ';
    if (d.swing.length) {
      for (var i = 0; i < d.swing.length; i++) {
        var s = d.swing[i];
        p += s.code + ' (skor ' + s.score + ', ADX ' + (s.adx ? s.adx.toFixed(0) : '-') + ', MTF ' + (s.mtf != null ? s.mtf : '-') + ', dist MA20 ' + (s.dist != null ? (s.dist >= 0 ? '+' : '') + s.dist.toFixed(1) + '%' : '-') + '); ';
      }
    } else { p += 'tidak ada kandidat lolos filter hari ini. '; }
    p += '\nKANDIDAT BSJP (beli sore jual pagi): ';
    if (d.bsjp.length) {
      var b = d.bsjp[0];
      p += b.code + ' (change ' + (b.chg != null ? (b.chg >= 0 ? '+' : '') + b.chg.toFixed(2) + '%' : '-') + ', CS ' + (b.cs != null ? (b.cs * 100).toFixed(0) + '%' : '-') + ', track 1y WR ' + (b.track && b.track.wr != null ? b.track.wr.toFixed(0) + '% net ' + (b.track.avg >= 0 ? '+' : '') + b.track.avg.toFixed(2) + '%' : '-') + '). ';
    } else { p += 'tidak ada kandidat BSJP hari ini. '; }
    p += '\nALERT TERPICU SEMALAM: ' + (d.alerts.length ? d.alerts.map(function (x) { return x.code; }).join(', ') : 'tidak ada') + '.\n\n';
    p += 'FORMAT WAJIB (persis, tiap baris diawali label):\n';
    p += 'SITUASI: <1 kalimat kondisi pasar & sikap yang disarankan>\n';
    p += 'SWING: <1-2 kalimat, sebut kode kandidat teratas & alasan singkat berbasis ADX/MTF>\n';
    p += 'BSJP: <1 kalimat, sebut kode & apakah layak dieksekusi sore ini>\n';
    p += 'RISIKO: <2 poin risiko hari ini, misal volatilitas/ATR tinggi, event makro, atau "tidak ada sinyal = tunggu">\n';
    p += 'DISIPLIN: <1 kalimat pengingat: risiko maks 1-2% modal per trade, SL dipasang saat entry bukan setelah rugi, tidak ada kepastian arah harga>\n';
    p += '\nAturan: jangan menambah saham di luar data. Jika data kosong, sarankan WAIT / tidak memaksa entry. Ringkas, total maksimal 120 kata.';
    return p;
  }

  function parseMinutes(txt) {
    var out = { situasi: '-', swing: '-', bsjp: '-', risiko: '-', disiplin: '-' };
    var lines = String(txt).split('\n');
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i].trim();
      if (/^SITUASI:/i.test(ln)) out.situasi = ln.replace(/^SITUASI:/i, '').trim();
      else if (/^SWING:/i.test(ln)) out.swing = ln.replace(/^SWING:/i, '').trim();
      else if (/^BSJP:/i.test(ln)) out.bsjp = ln.replace(/^BSJP:/i, '').trim();
      else if (/^RISIKO:/i.test(ln)) out.risiko = ln.replace(/^RISIKO:/i, '').trim();
      else if (/^DISIPLIN:/i.test(ln)) out.disiplin = ln.replace(/^DISIPLIN:/i, '').trim();
    }
    return out;
  }

  function renderBrief(m, when, engine) {
    var h = '';
    h += '<div style="font-weight:900;color:#fff;font-size:1rem;margin-bottom:4px;">☕ NOTULEN RAPAT PAGI</div>';
    h += '<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:10px;">' + when + ' • disusun Master Agent via ' + engine + ' (1 panggilan AI)</div>';
    h += '<div class="rp-line"><strong>🌡 SITUASI:</strong> ' + esc(m.situasi) + '</div>';
    h += '<div class="rp-line"><strong>🌊 SWING:</strong> ' + esc(m.swing) + '</div>';
    h += '<div class="rp-line"><strong>🌙 BSJP:</strong> ' + esc(m.bsjp) + '</div>';
    h += '<div class="rp-line"><strong>⚠ RISIKO:</strong> ' + esc(m.risiko) + '</div>';
    h += '<div class="rp-line" style="border-left:3px solid var(--yellow);padding-left:8px;"><strong>🟨 DISIPLIN:</strong> ' + esc(m.disiplin) + '</div>';
    return h;
  }

  function saveToJournal(when, m) {
    try {
      var entry = {
        t: 'briefing',
        d: Date.now(),
        title: 'Notulen Rapat Pagi — ' + when,
        text: 'SITUASI: ' + m.situasi + '\nSWING: ' + m.swing + '\nBSJP: ' + m.bsjp + '\nRISIKO: ' + m.risiko + '\nDISIPLIN: ' + m.disiplin,
        setup: 'briefing'
      };
      if (typeof journal !== 'undefined') {
        journal.unshift(entry);
        if (journal.length > 200) journal.length = 200;
        saveLS('ihsg_journal', journal);
        if (typeof renderJournal === 'function') renderJournal();
      }
    } catch (e) {}
  }

  /* ===== mesin rapat pagi (menggantikan placeholder office.js) ===== */
  window.runBriefing = async function () {
    var btn = document.getElementById('oaBriefBtn');
    var mount = document.getElementById('officeArtMount');
    if (btn) { btn.disabled = true; btn.innerText = '☕ Rapat berlangsung...'; }
    try {
      if (typeof window.oaWorking === 'function') { window.oaWorking('scout', 'Scan swing...'); window.oaWorking('night', 'Scan BSJP...'); }
      var data = await gatherData();
      if (typeof window.oaDone === 'function') { window.oaDone('scout', 'Scan swing selesai'); window.oaDone('night', 'Scan BSJP selesai'); }
      if (typeof window.oaWorking === 'function') window.oaWorking('master', 'Menyusun notulen...');

      var prompt = buildPrompt(data);
      var engine = 'AI'; var raw = '';
      try {
        if (typeof window.geminiCall === 'function') { raw = await window.geminiCall(prompt); engine = 'Gemini'; }
        else if (typeof window.qwenCall === 'function') { raw = await window.qwenCall(prompt); engine = 'Qwen'; }
        else throw new Error('tidak ada mesin AI');
      } catch (aiErr) {
        raw = 'SITUASI: Mesin AI tidak merespons — pakai data mentah di bawah sebagai acuan, jangan paksa entry.\nSWING: ' + (data.swing.length ? data.swing.map(function (s) { return s.code; }).join(', ') : 'tidak ada kandidat') + '.\nBSJP: ' + (data.bsjp.length ? data.bsjp[0].code : 'tidak ada kandidat') + '.\nRISIKO: Data terbatas; utamakan WAIT dan ukuran posisi kecil.\nDISIPLIN: Risiko maks 1-2% modal per trade; SL dipasang saat entry.';
        engine = 'fallback lokal';
      }
      var minutes = parseMinutes(raw);
      var w = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      var when = w.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) + ' • ' + (w.getHours() < 10 ? '0' : '') + w.getHours() + ':' + (w.getMinutes() < 10 ? '0' : '') + w.getMinutes() + ' WIB';

      var card = document.getElementById('briefCard');
      if (!card) {
        card = document.createElement('div');
        card.id = 'briefCard';
        card.className = 'report-card';
        card.style.marginTop = '14px';
        var holder = document.getElementById('oaLog');
        if (holder && holder.parentElement) holder.parentElement.insertBefore(card, holder);
        else document.body.appendChild(card);
      }
      card.innerHTML = renderBrief(minutes, when, engine) +
        '<div style="display:flex;gap:8px;margin-top:10px;">' +
        '<button class="btn-copy" onclick="printBrief()">🖨 Cetak / Simpan PDF</button>' +
        '<button class="btn-copy" onclick="copyBrief()">📋 Salin Notulen</button></div>';

      saveToJournal(when, minutes);
      if (typeof window.oaDone === 'function') window.oaDone('master', 'Notulen rapat selesai');
      if (typeof toast === 'function') toast('☕ Notulen Rapat Pagi siap — tersimpan di jurnal.');
    } catch (e) {
      alert('Rapat Pagi gagal: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerText = '☕ GELAR RAPAT PAGI'; }
    }
  };

  window.printBrief = function () {
    document.body.classList.add('printbrief');
    window.print();
    setTimeout(function () { document.body.classList.remove('printbrief'); }, 800);
  };
  window.copyBrief = function () {
    var b = document.getElementById('briefCard');
    if (b) navigator.clipboard.writeText(b.innerText).then(function () { alert('Notulen disalin!'); }).catch(function () { alert('Gagal menyalin.'); });
  };
})();
/* END briefing v1 */
