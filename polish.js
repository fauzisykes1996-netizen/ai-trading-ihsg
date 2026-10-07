/* polish.js — Plugin Polish Pack (Build v6.7): Mode Swing + Alert Kondisi + Kurva Ekuitas + Fix Ticker */
(function () {
  if (!window.P) return;

  /* =================  MODE SWING SATU-KLIK ================= */
  const headerEl = document.getElementById('appHeader') || document.querySelector('header');
  if (headerEl) {
    const btn = document.createElement('button');
    btn.id = 'swingModeBtn';
    btn.className = 'btn-key';
    btn.style.cssText = 'margin-left:6px;font-size:0.7rem;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.4);padding:5px 10px;border-radius:12px;font-weight:700;cursor:pointer;';
    btn.innerText = '🐢 Swing';
    btn.onclick = toggleSwingMode;
    const keyBtn = document.getElementById('keyStatusBtn');
    if (keyBtn && keyBtn.parentElement) keyBtn.parentElement.insertBefore(btn, keyBtn.nextSibling);
    else headerEl.appendChild(btn);
  }
  function applySwingMode(on) {
    const btn = document.getElementById('swingModeBtn');
    if (btn) { btn.style.background = on ? 'rgba(34,197,94,.28)' : 'rgba(34,197,94,.15)'; btn.style.boxShadow = on ? '0 0 12px rgba(34,197,94,.4)' : 'none'; btn.innerText = on ? '🐢 Swing ON' : '🐢 Swing'; }
    // Preset Swing Lab
    try {
      const strat = document.getElementById('swStrat');
      if (strat && on) { strat.value = 'pullback'; if (typeof swDefaults === 'function') swDefaults(); }
      const p1 = document.getElementById('swP1'), p2 = document.getElementById('swP2');
      if (on) { if (p1) p1.value = 25; if (p2) p2.value = '2.5'; }
    } catch (_) {}
    // Preset Scaling
    try {
      const scRisk = document.getElementById('scRisk'), scSplit = document.getElementById('scSplit');
      if (on) { if (scRisk) scRisk.value = '1.5'; if (scSplit) scSplit.value = '50/30/20'; }
    } catch (_) {}
    toast(on ? '🐢 Mode Swing AKTIF — preset Lab & Scaling diselaraskan untuk swing (hold 7–25 hari, scale-out 50/30/20).' : '🐢 Mode Swing non-aktif — kembali ke preset default.');
  }
  function toggleSwingMode() {
    const on = localStorage.getItem('ihsg_swingmode') !== '1';
    localStorage.setItem('ihsg_swingmode', on ? '1' : '0');
    applySwingMode(on);
  }
  // Terapkan status saat load
  setTimeout(() => applySwingMode(localStorage.getItem('ihsg_swingmode') === '1'), 600);

  /* ================= 🔔 ALERT BERBASIS KONDISI SWING ================= */
  P.card('tab-info', `
    <div class="card-title"><span>🔔 Alert Kondisi Swing</span><span class="agent-pill tech">Cek Tiap 5 Menit</span></div>
    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">Bukan sekadar target harga — alert ketika kondisi swing terpenuhi: harga menyentuh MA20, ADX menembus 20, atau breakout Donchian 20-hari. Dicek otomatis tiap 5 menit saat aplikasi terbuka.</div>
    <div class="metric-grid" style="margin-bottom:8px;">
      <div class="metric-box"><div class="metric-label">Kode Saham</div><input type="text" id="alCode" class="fv-input" placeholder="contoh: TLKM" maxlength="6"></div>
      <div class="metric-box"><div class="metric-label">Kondisi</div><select id="alCond" class="fv-input"><option value="ma20">Harga sentuh MA20</option><option value="adx">ADX tembus 20</option><option value="donchian">Breakout Donchian 20h</option><option value="price">Target harga (manual)</option></select></div>
    </div>
    <div class="metric-grid" style="margin-bottom:8px;">
      <div class="metric-box"><div class="metric-label">Target Harga (hanya utk "Target harga")</div><input type="text" inputmode="decimal" id="alPrice" class="fv-input" placeholder="opsional"></div>
      <div class="metric-box" style="display:flex;align-items:flex-end;"><button class="btn-copy" style="margin-top:0;" onclick="addSwingAlert()">🔔 Tambah Alert Swing</button></div>
    </div>
    <div id="alList" style="margin-size:0.78rem;"></div>
    <div class="src-note">Alert tersimpan lokal & dicek selama aplikasi terbuka. Notifikasi muncul sebagai banner + getar. Untuk pemantauan 24/7 bahkan saat aplikasi tertutup, butuh Service Worker (fitur v6.8 mendatang).</div>
  `, document.querySelector('#tab-info .disclaimer-box'));

  function swingAlerts() { return lsJSON('ihsg_swing_alerts', []); }
  function saveSwingAlerts(a) { saveLS('ihsg_swing_alerts', a); }
  function renderSwingAlerts() {
    const box = document.getElementById('alList'); if (!box) return;
    const a = swingAlerts();
    if (!a.length) { box.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);">Belum ada alert kondisi swing.</div>'; return; }
    box.innerHTML = a.map((x, i) => `<div class="mkt-row"><span><strong>${x.code}</strong> <span style="color:var(--text-muted);font-size:0.7rem;">${condLabel(x)}${x.done ? ' <span class="green">✅ terpenuhi</span>' : ''}</span></span><button class="btn-mini" style="color:var(--red);" onclick="removeSwingAlert(${i})">✕</button></div>`).join('');
  }
  function condLabel(x) {
    if (x.cond === 'ma20') return 'sentuh MA20';
    if (x.cond === 'adx') return 'ADX ≥ 20';
    if (x.cond === 'donchian') return 'breakout Donchian 20h';
    return 'harga ' + (x.dir === 'above' ? '≥' : '≤') + ' ' + rp(x.price);
  }
  window.addSwingAlert = function () {
    const code = (document.getElementById('alCode').value || '').trim().toUpperCase();
    const cond = document.getElementById('alCond').value;
    if (!code) return alert('Isi kode saham.');
    const a = swingAlerts();
    const entry = { code, cond, done: false, created: Date.now() };
    if (cond === 'price') {
      const p = parseNumID(document.getElementById('alPrice').value);
      if (!p) return alert('Isi target harga untuk kondisi "Target harga".');
      entry.price = p; entry.dir = 'above';
    }
    a.push(entry); saveSwingAlerts(a); renderSwingAlerts();
    toast('🔔 Alert swing ditambahkan: ' + code + ' — ' + condLabel(entry));
  };
  window.removeSwingAlert = function (i) { const a = swingAlerts(); a.splice(i, 1); saveSwingAlerts(a); renderSwingAlerts(); };

  // Engine pengecekan kondisi (1 request TV per alert per siklus)
  async function checkOne(x) {
    try {
      const f = await tvSnapshot(x.code);
      if (!f || !hasVal(f.price)) return false;
      const price = f.price;
      if (x.cond === 'price') return (x.dir === 'above' ? price >= x.price : price <= x.price);
      // Kondisi berbasis indikator → butuh chart harian
      const cc = loadCache(x.code); let json = cc && cc.json ? cc.json : null;
      if (!json) json = await fetchChart(x.code + '.JK', '1y');
      const q = json.chart.result[0].indicators.quote[0];
      const c = [], h = [], l = [];
      for (let i = 0; i < q.close.length; i++) { if (q.close[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); }
      const n = c.length; if (n < 30) return false;
      if (x.cond === 'ma20') { let s = 0; for (let i = n - 20; i < n; i++) s += c[i]; const ma20 = s / 20; return Math.abs(price - ma20) / ma20 <= 0.012; }
      if (x.cond === 'adx') {
        const p = 14, pdm = [], mdm = [], tr = [];
        for (let i = 0; i < n; i++) { if (i === 0) { pdm.push(0); mdm.push(0); tr.push(h[i] - l[i]); continue; } const up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0); tr.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); }
        const sm = arr => { const o = []; let e = null; for (let i = 0; i < arr.length; i++) { e = e === null ? arr[i] : (arr[i] + (p - 1) * e) / p; o.push(e); } return o; };
        const str = sm(tr), spd = sm(pdm), smd = sm(mdm);
        const adxLast = (() => { let e = null; for (let i = p; i < n; i++) { const pdi = spd[i] / (str[i] || 1) * 100, mdi = smd[i] / (str[i] || 1) * 100; const dx = Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100; e = e === null ? dx : (dx + (p - 1) * e) / p; } return e; })();
        return adxLast != null && adxLast >= 20;
      }
      if (x.cond === 'donchian') { let hh = -Infinity; for (let i = n - 21; i < n - 1; i++) if (h[i] > hh) hh = h[i]; return price >= hh; }
      return false;
    } catch (_) { return false; }
  }
  async function runSwingAlertCheck() {
    const a = swingAlerts(); const pending = a.filter(x => !x.done);
    if (!pending.length) return;
    for (const x of pending) {
      if (await checkOne(x)) {
        x.done = true;
        toast('🔔 ALERT SWING: ' + x.code + ' — ' + condLabel(x) + ' TERPENUHI!');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      }
    }
    saveSwingAlerts(a); renderSwingAlerts();
  }
  renderSwingAlerts();
  setInterval(runSwingAlertCheck, 5 * 60 * 1000);
  setTimeout(runSwingAlertCheck, 8000); // cek awal sekali setelah load

  /* ================= 📈 KURVA EKUITAS ANIMASI (Swing Lab) ================= */
  function equityCurve(trades) {
    const pts = [0]; let cum = 0;
    trades.forEach(t => { cum += t * 100; pts.push(cum); });
    return pts;
  }
  function renderEquitySvg(pts, bhPts) {
    const all = pts.concat(bhPts || []);
    const min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    const span = (max - min) || 1; const W = 300, H = 90, pad = 6;
    const X = i => pad + (i / (pts.length - 1 || 1)) * (W - 2 * pad);
    const Y = v => H - pad - ((v - min) / span) * (H - 2 * pad);
    const line = (arr, color, cls) => {
      const d = arr.map((v, i) => (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
      return `<path class="${cls || ''}" d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    };
    const zeroY = Y(0);
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:90px;display:block;margin-top:8px;">
      <line x1="${pad}" x2="${W - pad}" y1="${zeroY.toFixed(1)}" y2="${zeroY.toFixed(1)}" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="3 3"/>
      ${bhPts ? line(bhPts, '#64748b', '') : ''}
      ${line(pts, '#22c55e', 'eq-line')}
      <text x="${W - pad}" y="${Y(pts[pts.length - 1]) - 3}" fill="#22c55e" font-size="8" text-anchor="end">${pts[pts.length - 1] >= 0 ? '+' : ''}${pts[pts.length - 1].toFixed(1)}%</text>
    </svg>
    <div style="display:flex;gap:12px;font-size:0.62rem;color:#64748b;margin-top:2px;"><span><span style="color:#22c55e;">━━</span> Ekuitas strategi</span>${bhPts ? '<span><span style="color:#64748b;">━━</span> Buy & Hold</span>' : ''}</div>`;
  }
  // Sisipkan kurva ke dalam output Swing Lab setelah backtest selesai (observer)
  const swLabOut = document.getElementById('swLabOut');
  if (swLabOut) {
    const eqObs = new MutationObserver(() => {
      clearTimeout(eqObs._t);
      eqObs._t = setTimeout(async () => {
        if (!swLabOut.innerText.includes('Jumlah Trade')) return;
        if (swLabOut.querySelector('.eq-line')) return; // sudah ada
        try {
          const code = (document.getElementById('swCode').value || '').trim().toUpperCase() || window.lastTicker;
          const strat = document.getElementById('swStrat').value;
          const maxHold = parseInt(document.getElementById('swP1').value, 10) || (strat === 'donchian' ? 30 : 25);
          const tpMul = parseFloat(document.getElementById('swP2').value) || 2.5;
          const candle = await getCandleEq(code);
          const A = arraysEq(candle);
          const tr = strat === 'donchian' ? btDonchianEq(A.c, A.h, A.l, A.o, maxHold, tpMul) : btPullbackEq(A.c, A.h, A.l, A.o, maxHold, tpMul);
          const pts = equityCurve(tr);
          // buy & hold curve (sampling sejajar jumlah trade)
          const bhPts = []; const step = Math.max(1, Math.floor(A.c.length / pts.length));
          for (let i = 0; i < pts.length; i++) { const idx = Math.min(A.c.length - 1, i * step); bhPts.push((A.c[idx] - A.c[0]) / A.c[0] * 100); }
          const wrap = document.createElement('div');
          wrap.innerHTML = '<div style="font-size:0.7rem;font-weight:800;color:#fff;margin-top:10px;">📈 Kurva Ekuitas vs Buy & Hold</div>' + renderEquitySvg(pts, bhPts);
          swLabOut.appendChild(wrap);
        } catch (_) {}
      }, 500);
    });
    eqObs.observe(swLabOut, { childList: true, characterData: true, subtree: true });
  }
  // Re-implementasi ringan backtest untuk kurva (mandiri, tidak bergantung scope swing.js)
  async function getCandleEq(code) { const cc = loadCache(code); let j = cc && cc.json ? cc.json : null; if (!j) j = await fetchChart(code + '.JK', '2y'); return j.chart.result[0]; }
  function arraysEq(candle) { const q = candle.indicators.quote[0]; const c = [], h = [], l = [], o = []; for (let i = 0; i < q.close.length; i++) { if (q.close[i] == null || q.open[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); o.push(q.open[i]); } return { c, h, l, o }; }
  function smaEq(a, p) { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= p) s -= a[i - p]; if (i >= p - 1) o[i] = s / p; } return o; }
  function emaEq(a, p) { const o = new Array(a.length).fill(null); const k = 2 / (p + 1); let e = null; for (let i = 0; i < a.length; i++) { e = e === null ? a[i] : a[i] * k + e * (1 - k); if (i >= p - 1) o[i] = e; } return o; }
  function rsiEq(a, p) { const o = new Array(a.length).fill(null); let g = 0, l = 0; for (let i = 1; i <= p; i++) { const d = a[i] - a[i - 1]; if (d >= 0) g += d; else l -= d; } g /= p; l /= p; o[p] = l === 0 ? 100 : 100 - 100 / (1 + g / l); for (let i = p + 1; i < a.length; i++) { const d = a[i] - a[i - 1]; g = (g * (p - 1) + Math.max(d, 0)) / p; l = (l * (p - 1) + Math.max(-d, 0)) / p; o[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } return o; }
  function atrEq(h, l, c, p) { const tr = []; for (let i = 0; i < c.length; i++) tr.push(i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); return emaEq(tr, p); }
  function adxEq(h, l, c, p) { const n = c.length, pdm = new Array(n).fill(0), mdm = new Array(n).fill(0), tr = new Array(n).fill(0); for (let i = 1; i < n; i++) { const up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm[i] = up > dn && up > 0 ? up : 0; mdm[i] = dn > up && dn > 0 ? dn : 0; tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); } const sm = arr => { const o = new Array(n).fill(null); let e = null; for (let i = 0; i < n; i++) { e = e === null ? arr[i] : (arr[i] + (p - 1) * e) / p; if (i >= p) o[i] = e; } return o; }; const str = sm(tr), spd = sm(pdm), smd = sm(mdm), dx = []; for (let i = 0; i < n; i++) { if (str[i] == null || str[i] === 0) { dx.push(null); continue; } const pdi = spd[i] / str[i] * 100, mdi = smd[i] / str[i] * 100; dx.push(Math.abs(pdi - mdi) / (pdi + mdi || 1) * 100); } return sm(dx.map(v => v === null ? 0 : v)).map((v, i) => (dx[i] === null ? null : v)); }
  function lowestLEq(l, a, b) { let m = Infinity; for (let i = a; i < b; i++) if (l[i] < m) m = l[i]; return m; }
  function highestHEq(h, a, b) { let m = -Infinity; for (let i = a; i < b; i++) if (h[i] > m) m = h[i]; return m; }
  function btPullbackEq(c, h, l, o, maxHold, tpMul) { const ma20 = smaEq(c, 20), ma50 = smaEq(c, 50), rsi = rsiEq(c, 14), adx = adxEq(h, l, c, 14), atr = atrEq(h, l, c, 14); const trades = []; let pos = null; for (let i = 50; i < c.length - 1; i++) { if (!pos) { if (ma20[i] && ma50[i] && adx[i] && rsi[i] && atr[i] && c[i] > ma20[i] && ma20[i] > ma50[i] && adx[i] >= 20 && rsi[i] >= 40 && rsi[i] <= 65) { const dist = (c[i] - ma20[i]) / ma20[i] * 100; if (dist >= -1 && dist <= 3) pos = { entry: o[i + 1], ei: i + 1, sl: Math.min(lowestLEq(l, i - 9, i + 1) - atr[i] * 0.3, o[i + 1] - atr[i] * 1.2), atr: atr[i] }; } } else { const held = i - pos.ei; let exit = null; if (l[i] <= pos.sl) exit = pos.sl; else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) exit = pos.entry + (pos.entry - pos.sl) * tpMul; else if (held >= maxHold) exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; if (exit != null) { trades.push((exit - pos.entry) / pos.entry - P.fee); pos = null; } } } return trades; }
  function btDonchianEq(c, h, l, o, maxHold, tpMul) { const ma50 = smaEq(c, 50), atr = atrEq(h, l, c, 14); const trades = []; let pos = null; for (let i = 21; i < c.length - 1; i++) { if (!pos) { const hh = highestHEq(h, i - 20, i); if (ma50[i] && atr[i] && c[i] > ma50[i] && c[i] >= hh * 0.999) pos = { entry: o[i + 1], ei: i + 1, sl: lowestLEq(l, i - 19, i + 1) - atr[i] * 0.3, atr: atr[i] }; } else { const held = i - pos.ei; let exit = null; if (l[i] <= pos.sl) exit = pos.sl; else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) exit = pos.entry + (pos.entry - pos.sl) * tpMul; else if (held >= maxHold) exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; if (exit != null) { trades.push((exit - pos.entry) / pos.entry - P.fee); pos = null; } } } return trades; }

  /* ================= 🛠 FIX TICKER TAPE (perubahan harian) ================= */
  // Override fungsi ticker bawaan agar memakai perubahan harian (chart 5d), bukan 1 tahun
  (function patchTicker() {
    const origUpdTicker = window.__origUpdTicker;
    // Cari interval ticker lama tidak bisa; sebagai gantinya kita bangun ulang ticker dengan data 5d
    let tickerWrap = document.querySelector('.ticker-wrap');
    if (!tickerWrap) { tickerWrap = document.createElement('div'); tickerWrap.className = 'ticker-wrap'; document.body.insertBefore(tickerWrap, document.body.firstChild); }
    const codes = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'ANTM', 'PTBA', 'GOTO', 'ADMR', 'NCKL'];
    function render(items) {
      if (!items.length) return;
      const html = items.map(i => { const cls = i.chg >= 0 ? 'ticker-up' : 'ticker-down'; const arrow = i.chg >= 0 ? '▲' : '▼'; return `<span class="ticker-item"><span class="ticker-code">${i.code}</span><span class="ticker-price">Rp ${Math.round(i.price).toLocaleString('id-ID')}</span><span class="${cls}">${arrow} ${Math.abs(i.chg).toFixed(1)}%</span></span>`; }).join('');
      tickerWrap.innerHTML = `<div class="ticker-track"><span class="ticker-item"><span class="pulse-dot"></span>LIVE</span>${html}${html}</div>`;
      tickerWrap.classList.add('active'); document.body.classList.add('has-ticker');
    }
    async function upd() {
      if (!marketOpenWIB()) { tickerWrap.classList.remove('active'); document.body.classList.remove('has-ticker'); return; }
      const items = [];
      const settled = await Promise.allSettled(codes.map(c => fetchChart(c + '.JK', '5d')));
      settled.forEach((res, i) => {
        if (res.status !== 'fulfilled') return;
        const meta = res.value?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice && meta.chartPreviousClose) {
          items.push({ code: codes[i], price: meta.regularMarketPrice, chg: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 });
        }
      });
      if (items.length) render(items);
    }
    upd(); setInterval(upd, 90000);
    // Sembunyikan ticker lama bila ada duplikat (punya class sama) — cukup satu yang aktif
    document.querySelectorAll('.ticker-wrap').forEach((w, i) => { if (i > 0) w.style.display = 'none'; });
  })();

  /* ================= 🎨 CSS animasi kurva ekuitas ================= */
  (function () {
    const st = document.createElement('style');
    st.textContent = '.eq-line{stroke-dasharray:1400;stroke-dashoffset:1400;animation:eqDraw 1.4s ease forwards;}@keyframes eqDraw{to{stroke-dashoffset:0;}}';
    document.head.appendChild(st);
  })();
})();
