/* swingtools.js — Plugin Swing Tools (Build v6.7): Scaling Calculator + Trend Dashboard + Journal Tagging */
(function () {
  if (!window.P) return;

  /* ---------- helper indikator (ringan, mandiri) ---------- */
  function smaA(a, p) { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= p) s -= a[i - p]; if (i >= p - 1) o[i] = s / p; } return o; }
  function emaA(a, p) { const o = new Array(a.length).fill(null); const k = 2 / (p + 1); let e = null; for (let i = 0; i < a.length; i++) { e = e === null ? a[i] : a[i] * k + e * (1 - k); if (i >= p - 1) o[i] = e; } return o; }
  function adxA(h, l, c, p) {
    const n = c.length, pdm = new Array(n).fill(0), mdm = new Array(n).fill(0), tr = new Array(n).fill(0);
    for (let i = 1; i < n; i++) { const up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm[i] = up > dn && up > 0 ? up : 0; mdm[i] = dn > up && dn > 0 ? dn : 0; tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); }
    const sm = arr => { const o = new Array(n).fill(null); let e = null; for (let i = 0; i < n; i++) { e = e === null ? arr[i] : (arr[i] + (p - 1) * e) / p; if (i >= p) o[i] = e; } return o; };
    const str = sm(tr), spd = sm(pdm), smd = sm(mdm), dx = [];
    for (let i = 0; i < n; i++) { if (str[i] == null || str[i] === 0) { dx.push(null); continue; } const pdi = spd[i] / str[i] * 100, mdi = smd[i] / str[i] * 100; dx.push(Math.abs(pdi - mdi) / (pdi + mdi || 1) * 100); }
    return sm(dx.map(v => v === null ? 0 : v)).map((v, i) => (dx[i] === null ? null : v));
  }
  function arrays(candle) { const q = candle.indicators.quote[0]; const c = [], h = [], l = []; for (let i = 0; i < q.close.length; i++) { if (q.close[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); } return { c, h, l }; }
  async function getCandle(code) { const cc = loadCache(code); let j = (cc && cc.json) ? cc.json : null; if (!j) j = await fetchChart(code + '.JK', '1y'); return j.chart.result[0]; }

  /* ================= 📊 DASHBOARD KEKUATAN TREN (tab Analisis) ================= */
  const tfCardEl = document.getElementById('mtfOut') ? document.getElementById('mtfOut').closest('.card') : null;
  P.card('tab-analysis', `
    <div class="card-title"><span>📊 Dashboard Kekuatan Tren</span><span class="agent-pill tech">Swing Compass</span></div>
    <div id="trendDash" style="font-size:0.8rem;color:var(--text-muted);">Proses sebuah saham — kekuatan & kualitas tren ditampilkan di sini (ADX, kemiringan MA, partisipasi harga, volatilitas).</div>
    <div class="src-note">Tren Kuat = ADX tinggi + MA menanjak + harga konsisten di atas MA + volatilitas terkendali. Kompas untuk memutuskan "layak di-swing atau tidak".</div>
  `, tfCardEl);

  function trendVerdict(adx, slope20, abovePct, atrpct) {
    let s = 0;
    if (adx >= 25) s += 2; else if (adx >= 20) s += 1;
    if (slope20 >= 0.5) s += 2; else if (slope20 >= 0) s += 1; else s -= 1;
    if (abovePct >= 70) s += 2; else if (abovePct >= 50) s += 1;
    if (atrpct <= 3) s += 1; else if (atrpct >= 5) s -= 1;
    if (s >= 5) return { t: 'TREND KUAT — zona nyaman swing', c: 'green' };
    if (s >= 2) return { t: 'TREND SEDANG — pilih-pilih setup', c: 'yellow' };
    return { t: 'TREND LEMAH/MENDATAR — hindari swing', c: 'red' };
  }
  async function renderTrendDash(code) {
    const box = document.getElementById('trendDash'); if (!box || !code) return;
    try {
      const A = arrays(await getCandle(code)); const n = A.c.length;
      const ma20 = smaA(A.c, 20), ma50 = smaA(A.c, 50), adx = adxA(A.h, A.l, A.c, 14);
      const atr = emaA(A.c.map((c, i) => i === 0 ? A.h[i] - A.l[i] : Math.max(A.h[i] - A.l[i], Math.abs(A.h[i] - A.c[i - 1]), Math.abs(A.l[i] - A.c[i - 1]))), 14);
      const last = n - 1, price = A.c[last];
      const ax = adx[last], m20 = ma20[last], m50 = ma50[last], at = atr[last];
      const slope20 = (m20 != null && ma20[last - 5] != null && ma20[last - 5] !== 0) ? (m20 - ma20[last - 5]) / ma20[last - 5] * 100 : 0;
      let above = 0, cnt = 0; for (let i = Math.max(0, n - 20); i < n; i++) { if (ma20[i] != null) { cnt++; if (A.c[i] > ma20[i]) above++; } }
      const abovePct = cnt ? above / cnt * 100 : 0;
      const atrpct = at ? at / price * 100 : 0;
      const v = trendVerdict(ax || 0, slope20, abovePct, atrpct);
      const cell = (lab, val, col) => `<div class="metric-box"><div class="metric-label">${lab}</div><div class="metric-value ${col || ''}">${val}</div></div>`;
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><div style="font-weight:800;color:var(--${v.c});font-size:0.82rem;">${v.t}</div></div>
        <div class="metric-grid">
          ${cell('ADX (14)', ax != null ? ax.toFixed(0) + (ax >= 25 ? ' 🔥' : ax >= 20 ? ' 👍' : ''), ax >= 25 ? 'green' : ax >= 20 ? 'yellow' : 'red')}
          ${cell('Slope MA20 (5h)', slope20.toFixed(2) + '%', slope20 >= 0.5 ? 'green' : slope20 >= 0 ? 'yellow' : 'red')}
          ${cell('Harga di atas MA20', abovePct.toFixed(0) + '% (20h)', abovePct >= 70 ? 'green' : abovePct >= 50 ? 'yellow' : 'red')}
          ${cell('Volatilitas ATR%', atrpct.toFixed(1) + '%', atrpct <= 3 ? 'green' : atrpct <= 5 ? 'yellow' : 'red')}
          ${cell('MA20 vs MA50', (m20 != null && m50 != null) ? (m20 > m50 ? 'MA20 di atas ✅' : 'MA20 di bawah ⚠️') : '-', (m20 != null && m50 != null && m20 > m50) ? 'green' : 'red')}
          ${cell('Harga vs MA20', m20 != null ? ((price >= m20 ? '+' : '') + ((price - m20) / m20 * 100).toFixed(1) + '%') : '-', price >= m20 ? 'green' : 'yellow')}
        </div>`;
    } catch (e) { box.innerHTML = '<span style="color:var(--red);">Dashboard gagal: ' + esc(e.message) + '</span>'; }
  }
  const dashObs = new MutationObserver(() => { clearTimeout(dashObs._t); dashObs._t = setTimeout(() => renderTrendDash(window.lastTicker), 750); });
  const trendEl = document.getElementById('valTrend');
  if (trendEl) dashObs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  /* ================= 🧮 KALKULATOR SCALING POSISI ================= */
  const posCalcBtn = document.querySelector('details.agent-detail summary');
  // Sisipkan panel scaling di dalam details Kalkulator Ukuran Posisi yang sudah ada
  (function injectScaling() {
    const det = [...document.querySelectorAll('details.agent-detail')].find(d => /Kalkulator Ukuran Posisi/.test(d.textContent));
    if (!det) return;
    const wrap = document.createElement('div');
    wrap.style.marginTop = '10px';
    wrap.innerHTML = `
      <div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:6px;">🧮 Mode Scaling (Swing)</div>
      <div class="metric-grid" style="margin-bottom:8px;">
        <div class="metric-box"><div class="metric-label">Risiko Total Modal (%)</div><input type="text" inputmode="decimal" class="fv-input" id="scRisk" value="1.5"></div>
        <div class="metric-box"><div class="metric-label">Tahap 1 / 2 / 3 (%)</div><input type="text" inputmode="text" class="fv-input" id="scSplit" value="50/30/20"></div>
      </div>
      <button class="btn-copy" style="margin-top:0;" onclick="calcScaling()">🧮 Hitung Scaling Position</button>
      <div id="scOut" class="report-card hidden" style="margin-top:8px;"></div>`;
    det.appendChild(wrap);
  })();

  window.calcScaling = function () {
    const cap = parseNumID(document.getElementById('pcCap') ? document.getElementById('pcCap').value : '');
    const entry = parseNumID(document.getElementById('pcEntry') ? document.getElementById('pcEntry').value : '') || window.lastPrice;
    const sl = parseNumID(document.getElementById('pcSl') ? document.getElementById('pcSl').value : '');
    const riskPct = parseNumID(document.getElementById('scRisk').value);
    const split = (document.getElementById('scSplit').value || '50/30/20').split('/').map(x => parseFloat(x));
    const out = document.getElementById('scOut'); out.classList.remove('hidden');
    if (!cap || !entry || !sl || !riskPct || entry <= sl || split.reduce((a, b) => a + (b || 0), 0) <= 0) {
      out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Isi Modal, Entry, Stop Loss di atas + Risiko % dan pembagian tahap (contoh 50/30/20). Pastikan Entry &gt; SL.</div>';
      return;
    }
    const riskBudget = cap * riskPct / 100;
    const riskPerShare = entry - sl;
    const totalShares = Math.floor(riskBudget / riskPerShare / 100) * 100;
    const sumPct = split.reduce((a, b) => a + (b || 0), 0);
    const stages = split.map((p, i) => {
      const shares = Math.floor(totalShares * (p || 0) / sumPct / 100) * 100;
      return { pct: p || 0, shares, lot: shares / 100, label: ['T1 (entry)', 'T2 (add-on)', 'T3 (runner)'][i] || ('Tahap ' + (i + 1)) };
    });
    const be = entry + riskPerShare * 0.5;
    const trail = entry + riskPerShare * 1.5;
    out.innerHTML = `
      <div class="metric-grid">
        <div class="metric-box"><div class="metric-label">Total Posisi</div><div class="metric-value green">${totalShares.toLocaleString('id-ID')} lembar (${totalShares / 100} lot)</div></div>
        <div class="metric-box"><div class="metric-label">Risiko Riil (ke SL)</div><div class="metric-value red">${rp(totalShares * riskPerShare)} (${riskPct}%)</div></div>
      </div>
      <div style="margin-top:8px;font-size:0.78rem;line-height:1.7;">
        ${stages.filter(s => s.shares > 0).map(s => `<div class="rp-line">• <strong>${s.label}</strong> ${s.pct}% → ${s.lot} lot (${s.shares.toLocaleString('id-ID')} lembar) @ ≤ ${rp(entry)}</div>`).join('')}
        <div class="rp-line">• Setelah T1 tembus target: geser SL sisa ke <strong>break-even ≈ ${rp(be)}</strong></div>
        <div class="rp-line">• Trail runner (T3) di <strong>${rp(trail)}</strong> atau 1,5×ATR di bawah highest high</div>
      </div>
      <div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Risiko total dikunci di awal (entry→SL); add-on hanya dilakukan bila trade sudah terbukti benar (di atas break-even). Disiplin = ukuran kerugian tetap kecil walau menambah posisi pemenang.</div>`;
    sweep(out);
  };

  /* ================= ️ JURNAL BER-TAG PER SETUP (tab Jurnal) ================= */
  const SETUPS = ['pullback', 'donchian', 'breakout', 'reversal', 'bsjp', 'lainnya'];
  // Upgrade pushJournal agar menyimpan tag setup (monkey-patch aman)
  const _origPush = window.pushJournalRaw || (typeof pushJournal === 'function' ? pushJournal : null);
  // Kita tidak bisa override pushJournal global dengan mudah; sebagai gantinya, sediakan fungsi tag manual + auto-tag dari konteks
  function autoSetupTag() {
    // Tebak setup dari konteks terakhir: jika __swRows/__lastSwingSetup ada pakai itu; sinonim dari strategi lab/scanner
    if (window.__lastSwingSetup) return window.__lastSwingSetup;
    const planBox = document.getElementById('swPlan');
    if (planBox && /Donchian Breakout/.test(planBox.innerText)) return 'donchian';
    if (planBox && /Pullback-to-MA20/.test(planBox.innerText)) return 'pullback';
    return null;
  }
  // Sisipkan kontrol tag + statistik ke tab Jurnal
  const journalListEl = document.getElementById('journalList');
  if (journalListEl) {
    const ctrl = document.createElement('div');
    ctrl.style.marginBottom = '10px';
    ctrl.innerHTML = `
      <div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:6px;">🏷️ Tag Setup pada Entri Terbaru</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        ${SETUPS.map(s => `<button class="btn-mini" onclick="tagLatest('${s}')">${s}</button>`).join('')}
      </div>
      <button class="btn-copy" style="margin-top:0;" onclick="renderSetupStats()">📊 Statistik Win-Rate per Setup</button>
      <div id="setupStats" class="hidden" style="margin-top:10px;"></div>`;
    journalListEl.parentElement.insertBefore(ctrl, journalListEl);
  }

  window.tagLatest = function (setup) {
    if (!journal.length) { alert('Belum ada entri jurnal untuk di-tag. Proses/analisis sebuah saham dulu.'); return; }
    journal[0].setup = setup;
    saveLS('ihsg_journal', journal);
    renderJournal();
    toast('🏷️ Entri terbaru di-tag: ' + setup);
  };

  async function enrichWithOutcome() {
    // Untuk entri berusia >=2 hari yang punya harga awal (p) tapi belum punya outcome, hitung delta sekarang
    const tickers = [...new Set(journal.filter(e => e.p && (Date.now() - e.d) > 2 * 86400000 && e.outcome == null).map(e => e.t))].slice(0, 12);
    const cur = {};
    for (const t of tickers) { cur[t] = cachePrice(t) || (await tvSnapshot(t))?.price || null; }
    let changed = false;
    journal.forEach(e => {
      if (e.p && (Date.now() - e.d) > 2 * 86400000 && e.outcome == null && cur[e.t]) {
        e.outcome = (cur[e.t] - e.p) / e.p * 100;
        changed = true;
      }
    });
    if (changed) saveLS('ihsg_journal', journal);
  }

  window.renderSetupStats = async function () {
    const box = document.getElementById('setupStats'); box.classList.remove('hidden');
    box.innerHTML = '<div class="skel-box" style="height:60px"></div>';
    try {
      await enrichWithOutcome();
      const groups = {};
      journal.forEach(e => {
        if (e.outcome == null) return;
        const key = e.setup || 'tanpa-tag';
        (groups[key] = groups[key] || []).push(e.outcome);
      });
      const keys = Object.keys(groups);
      if (!keys.length) { box.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Belum ada entri berusia ≥2 hari dengan outcome terhitung. Tag beberapa entri (🏷️) dan tunggu 2 hari, atau proses lebih banyak saham — statistik akan bermakna saat sampel terkumpul.</div>'; return; }
      const rows = keys.map(k => {
        const arr = groups[k]; const n = arr.length;
        const wr = arr.filter(x => x > 0).length / n * 100;
        const avg = arr.reduce((a, b) => a + b, 0) / n;
        return { k, n, wr, avg };
      }).sort((a, b) => b.avg - a.avg);
      box.innerHTML = `
        <div style="font-size:0.72rem;font-weight:800;color:#fff;margin-bottom:6px;">Performa per Jenis Setup (outcome riil)</div>
        ${rows.map(r => `<div class="mkt-row"><span><strong>${r.k}</strong> <span style="color:var(--text-muted);font-size:0.68rem;">${r.n} entri</span></span><span style="text-align:right;font-family:var(--mono);"><span class="${r.wr >= 50 ? 'green' : 'red'}" style="font-weight:700;">WR ${r.wr.toFixed(0)}%</span> • <span class="${r.avg >= 0 ? 'green' : 'red'}" style="font-weight:700;">${r.avg >= 0 ? '+' : ''}${r.avg.toFixed(2)}%</span></span></div>`).join('')}
        <div class="src-note">Ini cermin keputusan ANDA sendiri: setup mana yang paling sering cuan di tangan Anda. Fokuskan waktu pada setup dengan expectancy positif; tinggalkan yang rutin rugi. Sampel kecil (&lt;5) baca hati-hati.</div>`;
    } catch (e) { box.innerHTML = '<div style="color:var(--red);">Statistik gagal: ' + esc(e.message) + '</div>'; }
  };

  // Auto-tag entri yang baru dibuat dari konteks swing (observer pada journalList)
  const jObs = new MutationObserver(() => {
    clearTimeout(jObs._t);
    jObs._t = setTimeout(() => {
      const tag = autoSetupTag();
      if (tag && journal.length && journal[0].setup == null) {
        journal[0].setup = tag; saveLS('ihsg_journal', journal);
      }
    }, 800);
  });
  if (journalListEl) jObs.observe(journalListEl, { childList: true, characterData: true, subtree: true });
})();
