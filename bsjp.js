/* bsjp.js v2 — Plugin Screener BSJP (Build v6.6) + fallback server */
(function () {
  if (!window.P) return;
  const UNIV = [...new Set(SCR_UNIVERSE.concat(["AKRA","ARTO","BBTN","BDMS","BRPT","BUKA","DEWA","DOID","EMTK","ESSA","EXCL","GGRM","HRUM","INCO","INDY","IRRA","ISSP","JSMR","KIJA","MAPI","MEDC","MIDI","MYOR","PGEO","PNLF","PPRE","PTPP","RAJA","SCMA","SIDO","SMGR","SRTG","TINS","TKIM","TPIA","WIKA","WSKT","ZINC","BGTG","PNBN","CMRY","AMMN","CUAN"]))];
  const COLS = ["close","change","volume","open","high","low","market_cap_basic","relative_volume_1d_10d"];
  const COLS_FB = ["close","change","volume","open","high","low","market_cap_basic"];

  const scrCard = document.getElementById('scrBtn') ? document.getElementById('scrBtn').closest('.card') : null;
  P.card('tab-market', `
    <div class="card-title"><span>🌙 Screener BSJP (Beli Sore Jual Pagi)</span><span class="agent-pill tech">Struktur Penutupan</span></div>
    <div id="bsjpWindow" class="tf-badge tf-warn" style="margin-bottom:10px;">Memeriksa jam bursa…</div>
    <button class="btn-copy" style="margin-top:0;" id="bsjpBtn" onclick="runBSJP()">🌙 Scan Kandidat BSJP</button>
    <div id="bsjpNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Filter: likuid ≥Rp15M & ≥10jt lembar • naik +1,5–6,5% • closing strength ≥80% & close ≥98,5% high • volume 1,3–5× • close &gt; MA20. Tiap kandidat dilengkapi track record BSJP 1 tahun (net setelah biaya ±0,5%).</div>
    <div id="bsjpResult" class="hidden" style="margin-top:10px;"></div>
    <div id="bsjpPlan" class="hidden report-card"></div>
  `, scrCard);

  function tickWindow() {
    const el = document.getElementById('bsjpWindow'); if (!el) return;
    const s = P.session();
    el.className = 'tf-badge ' + (s.bsjp ? 'tf-ok' : 'tf-warn');
    el.innerText = (s.bsjp ? '🟢 ' : '🌙 ') + s.label;
  }
  tickWindow(); setInterval(tickWindow, 30000);

  function mapRows(j, cols) {
    return (j.data || []).map(row => ({ code: String(row.s || "").replace("IDX:", ""), close: row.d[0], chg: row.d[1], vol: row.d[2], open: row.d[3], high: row.d[4], low: row.d[5], cap: row.d[6], rvol: cols.length > 7 ? row.d[7] : null }));
  }
  async function scan(cols) {
    try {
      const r = await fetchWithTimeout("https://scanner.tradingview.com/indonesia/scan", 15000, { method: "POST", headers: { "Content-Type": "application/json" }, body: tvBody(UNIV, cols) });
      if (r.ok) { const j = await r.json(); if (j && j.data && j.data.length) return mapRows(j, cols); }
    } catch (_) {}
    const r2 = await fetchWithTimeout(GAS_PROXY + "?scan=" + encodeURIComponent(UNIV.join(',')) + "&cols=" + encodeURIComponent(cols.join(',')), 30000);
    if (!r2.ok) throw new Error("HTTP " + r2.status);
    const j2 = await r2.json();
    if (j2.error) throw new Error(j2.error);
    return mapRows(j2, cols);
  }

  function bsjpTrack(cl, hi, lo, vo, op) {
    const n = cl.length; const nets = [];
    for (let i = 20; i < n - 1; i++) {
      const prev = cl[i - 1]; if (!prev) continue;
      const chg = (cl[i] - prev) / prev * 100;
      if (chg < 1.5 || chg > 6.5) continue;
      const rng = hi[i] - lo[i]; if (rng <= 0) continue;
      if ((cl[i] - lo[i]) / rng < 0.8) continue;
      const v20 = vo.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20; if (!v20) continue;
      if (vo[i] < 1.3 * v20) continue;
      const ma20 = cl.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20;
      if (cl[i] <= ma20) continue;
      nets.push(op[i + 1] / cl[i] - 1 - P.fee);
    }
    if (!nets.length) return null;
    return { n: nets.length, wr: nets.filter(x => x > 0).length / nets.length * 100, avg: nets.reduce((a, b) => a + b, 0) / nets.length * 100, worst: Math.min.apply(null, nets) * 100 };
  }

  window.runBSJP = async function () {
    const btn = document.getElementById('bsjpBtn'); btn.disabled = true; btn.innerText = "Scanning BSJP…";
    try {
      const cache = lsJSON('bsjp_cache', null);
      if (cache && cache.t && Date.now() - cache.t < 10 * 60 * 1000) { render(cache.rows); note('Cache ' + new Date(cache.t).toLocaleTimeString('id-ID') + ' (refresh otomatis setelah 10 menit).'); return; }
      let rows;
      try { rows = await scan(COLS); } catch (_) { rows = await scan(COLS_FB); }
      const cand = rows.filter(r => {
        if (!r.code || !hasVal(r.close) || !hasVal(r.chg) || !hasVal(r.vol) || !hasVal(r.high) || !hasVal(r.low)) return false;
        if (r.close < 55) return false;
        if (r.chg < 1.5 || r.chg > 6.5) return false;
        const rng = r.high - r.low; if (rng <= 0) return false;
        const cs = (r.close - r.low) / rng; if (cs < 0.8) return false;
        if (r.close < r.high * 0.985) return false;
        if (r.vol < 10e6) return false;
        if (r.vol * r.close < 15e9) return false;
        if (hasVal(r.rvol) && (r.rvol < 1.3 || r.rvol > 5)) return false;
        r.cs = cs;
        let s = 0;
        s += (r.chg >= 2 && r.chg <= 5) ? 2 : 1;
        s += cs >= 0.9 ? 2 : 1;
        s += hasVal(r.rvol) ? (r.rvol >= 1.5 && r.rvol <= 3.5 ? 2 : 1) : 1;
        s += (r.vol * r.close >= 30e9) ? 1 : 0;
        r.score = s;
        return true;
      }).sort((a, b) => b.score - a.score || b.chg - a.chg).slice(0, 8);
      const box = document.getElementById('bsjpResult');
      if (!cand.length) { box.classList.add('hidden'); note('Tidak ada saham yang lolos filter BSJP saat ini. Wajar — disiplin menunggu adalah inti strategi ini.'); return; }
      const settled = await Promise.allSettled(cand.map(c => fetchChart(c.code + ".JK", "1y")));
      settled.forEach((res, i) => {
        const c = cand[i];
        if (res.status !== 'fulfilled') { c.track = null; c.atr = null; c.above = null; return; }
        try {
          const q = res.value.chart.result[0].indicators.quote[0];
          const cl = [], hi = [], lo = [], vo = [], op = [];
          for (let k = 0; k < q.close.length; k++) { if (q.close[k] == null || q.open[k] == null) continue; cl.push(q.close[k]); hi.push(q.high[k]); lo.push(q.low[k]); vo.push(q.volume[k] || 0); op.push(q.open[k]); }
          c.track = bsjpTrack(cl, hi, lo, vo, op);
          const m = computeMetrics(res.value.chart.result[0]);
          c.atr = m.risk.atrPct; c.above = cl[cl.length - 1] > m.ma20;
        } catch (_) { c.track = null; c.atr = null; c.above = null; }
      });
      const final = cand.filter(c => c.above !== false);
      saveLS('bsjp_cache', { t: Date.now(), rows: final });
      render(final);
      note('Diperbarui ' + new Date().toLocaleTimeString('id-ID') + ' • ' + final.length + ' kandidat • ' + (P.session().bsjp ? 'JENDELA TERBUKA — eksekusi sore ini.' : 'jendela tutup — data penutupan terakhir (mode belajar).'));
    } catch (e) { alert("Scan BSJP gagal: " + e.message); }
    finally { btn.disabled = false; btn.innerText = "🌙 Scan Kandidat BSJP"; }
  };

  function render(rows) {
    window.__bsjpRows = rows;
    const box = document.getElementById('bsjpResult'); box.classList.remove('hidden');
    box.innerHTML = rows.map((r, i) => {
      const badge = r.score >= 6 ? "🔥" : r.score >= 4 ? "👍" : "•";
      const tr = r.track ? (r.track.n >= 6 ? `Track 1y: ${r.track.n} sinyal • WR ${r.track.wr.toFixed(0)}% • net ${r.track.avg >= 0 ? '+' : ''}${r.track.avg.toFixed(2)}% • worst ${r.track.worst.toFixed(1)}%` : `Track 1y: ${r.track.n} sinyal ⚠️ sample kecil`) : 'Track 1y: tidak ada sinyal serupa setahun ini';
      const atrTxt = hasVal(r.atr) ? ` • ATR ${r.atr.toFixed(1)}%${r.atr >= 4 ? ' ⚠️' : ''}` : '';
      return `<div class="mkt-row" style="cursor:pointer;" onclick="bsjpPlan(${i})"><span><strong>${r.code}</strong> <span style="color:var(--text-muted);font-size:0.68rem;">${badge} skor ${r.score} • CS ${(r.cs * 100).toFixed(0)}% • RVOL ${hasVal(r.rvol) ? r.rvol.toFixed(1) + '×' : '-'}</span><br><span style="font-size:0.66rem;color:#64748b;font-family:var(--mono);">${tr}${atrTxt}</span></span><span style="text-align:right;"><span style="font-weight:700;font-family:var(--mono);">${Math.round(r.close).toLocaleString('id-ID')}</span><br><span class="green" style="font-size:0.7rem;font-weight:700;font-family:var(--mono);">+${r.chg.toFixed(2)}%</span></span></div>`;
    }).join('') + `<div class="src-note">BSJP = beli menjelang tutup, jual di pembukaan/15 menit pertama besok. Track record dihitung lokal dari data harian 1 tahun (exit = open berikutnya, NET setelah biaya ±0,5%). BUKAN jaminan — risiko gap-down semalam tetap ada. Ketuk baris untuk rencana trade.</div>`;
  }
  function note(t) { document.getElementById('bsjpNote').innerText = t; }

  window.bsjpPlan = function (i) {
    const r = (window.__bsjpRows || [])[i]; if (!r) return;
    const box = document.getElementById('bsjpPlan'); box.classList.remove('hidden');
    const sl = Math.round(r.close * 0.98);
    box.innerHTML = `<div style="font-size:0.8rem;font-weight:800;color:#fff;margin-bottom:6px;">🌙 Rencana BSJP: ${r.code}</div>
    <div class="rp-line">• Beli: di/bawah Rp ${Math.round(r.close).toLocaleString('id-ID')} (ideal lelang tutup 15:45–15:50 WIB).</div>
    <div class="rp-line">• Jual: 09:00–09:15 WIB besok, atau saat +2% s/d +3% tersentuh.</div>
    <div class="rp-line">• Stop: bila open besok gap-down &gt; −2% (≈ Rp ${sl.toLocaleString('id-ID')}), keluar di open — tanpa negosiasi.</div>
    <div class="rp-line">• Risiko maks 1% modal per trade — hitung lot via Kalkulator Ukuran Posisi.</div>
    ${r.track && r.track.n >= 6 ? `<div class="rp-line">• Bukti 1y saham ini: WR ${r.track.wr.toFixed(0)}%, net rata-rata ${r.track.avg >= 0 ? '+' : ''}${r.track.avg.toFixed(2)}% per trade.</div>` : ''}
    <button class="btn-copy" onclick="bsjpToCalc(${i})">🎯 Isi Kalkulator Posisi</button>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  window.bsjpToCalc = function (i) {
    const r = (window.__bsjpRows || [])[i]; if (!r) return;
    const e = document.getElementById('pcEntry'), s = document.getElementById('pcSl');
    if (e) e.value = Math.round(r.close).toLocaleString('id-ID');
    if (s) s.value = Math.round(r.close * 0.98).toLocaleString('id-ID');
    const det = e ? e.closest('details') : null;
    if (det) { det.open = true; det.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
})();
