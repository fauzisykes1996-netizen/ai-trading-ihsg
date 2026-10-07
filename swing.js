/* swing.js — Plugin Swing Core (Build v6.7): Scanner + Lab + Plan + Multi-TF Score */
/* Versi DEFINITIF anti-korup: 100% TANPA backtick dan TANPA ${} — aman disalin dari iPhone. */
(function () {
  if (!window.P) return;
  var FEE = P.fee;

  /* ---------- indikator seri ---------- */
  function smaArr(a, p) { var o = new Array(a.length).fill(null); var s = 0; for (var i = 0; i < a.length; i++) { s += a[i]; if (i >= p) s -= a[i - p]; if (i >= p - 1) o[i] = s / p; } return o; }
  function emaArr(a, p) { var o = new Array(a.length).fill(null); var k = 2 / (p + 1); var e = null; for (var i = 0; i < a.length; i++) { e = (e === null) ? a[i] : a[i] * k + e * (1 - k); if (i >= p - 1) o[i] = e; } return o; }
  function rsiArr(a, p) { var o = new Array(a.length).fill(null); if (a.length <= p) return o; var g = 0, l = 0; for (var i = 1; i <= p; i++) { var d = a[i] - a[i - 1]; if (d >= 0) g += d; else l -= d; } g /= p; l /= p; o[p] = l === 0 ? 100 : 100 - 100 / (1 + g / l); for (var j = p + 1; j < a.length; j++) { var d2 = a[j] - a[j - 1]; g = (g * (p - 1) + Math.max(d2, 0)) / p; l = (l * (p - 1) + Math.max(-d2, 0)) / p; o[j] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } return o; }
  function atrArr(h, l, c, p) { var tr = []; for (var i = 0; i < c.length; i++) tr.push(i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); return emaArr(tr, p); }
  function adxArr(h, l, c, p) {
    var n = c.length, pdm = new Array(n).fill(0), mdm = new Array(n).fill(0), tr = new Array(n).fill(0);
    for (var i = 1; i < n; i++) { var up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm[i] = (up > dn && up > 0) ? up : 0; mdm[i] = (dn > up && dn > 0) ? dn : 0; tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); }
    var sm = function (arr) { var o = new Array(n).fill(null); var e = null; for (var m = 0; m < n; m++) { e = (e === null) ? arr[m] : (arr[m] + (p - 1) * e) / p; if (m >= p) o[m] = e; } return o; };
    var str = sm(tr), spd = sm(pdm), smd = sm(mdm), dx = [];
    for (var j = 0; j < n; j++) { if (str[j] == null || str[j] === 0) { dx.push(null); continue; } var pdi = spd[j] / str[j] * 100, mdi = smd[j] / str[j] * 100; dx.push(Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100); }
    var raw = sm(dx.map(function (v) { return v === null ? 0 : v; }));
    return raw.map(function (v, i2) { return dx[i2] === null ? null : v; });
  }
  function slopePct(ma) { var o = new Array(ma.length).fill(null); for (var i = 5; i < ma.length; i++) { if (ma[i] == null || ma[i - 5] == null || ma[i - 5] === 0) continue; o[i] = (ma[i] - ma[i - 5]) / ma[i - 5] * 100; } return o; }

  function arrays(candle) {
    var q = candle.indicators.quote[0]; var c = [], h = [], l = [], o = [];
    for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null || q.open[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); o.push(q.open[i]); }
    return { c: c, h: h, l: l, o: o };
  }
  async function getCandle(code, range) {
    var cc = loadCache(code);
    var json = (cc && cc.json && range === '1y') ? cc.json : null;
    if (!json) json = await fetchChart(code + '.JK', range);
    return json.chart.result[0];
  }
  function lowestL(l, from, to) { var m = Infinity; for (var i = from; i < to; i++) if (l[i] < m) m = l[i]; return m; }
  function highestH(h, from, to) { var m = -Infinity; for (var i = from; i < to; i++) if (h[i] > m) m = h[i]; return m; }

  /* ---------- Multi-TF Alignment Score (0-100) ---------- */
  function tfScore(dCandle, wCandle) {
    var d = arrays(dCandle), w = wCandle ? arrays(wCandle) : null;
    var dma20 = smaArr(d.c, 20), dwma = w ? smaArr(w.c, 10) : null;
    var dLast = d.c[d.c.length - 1], wLast = w ? w.c[w.c.length - 1] : null;
    var s = 50;
    if (dma20[dma20.length - 1] != null) s += dLast > dma20[dma20.length - 1] ? 18 : -18;
    if (dwma && dwma[dwma.length - 1] != null) s += wLast > dwma[dwma.length - 1] ? 22 : -22;
    var dsl = slopePct(dma20), wsl = dwma ? slopePct(dwma) : null;
    var ds = dsl[dsl.length - 1], ws = wsl ? wsl[wsl.length - 1] : null;
    if (ds != null) s += ds > 0.5 ? 6 : (ds < -0.5 ? -6 : 0);
    if (ws != null) s += ws > 0.5 ? 8 : (ws < -0.5 ? -8 : 0);
    if (ds != null && ws != null && ((ds > 0 && ws > 0) || (ds < 0 && ws < 0))) s += 6;
    return Math.max(0, Math.min(100, Math.round(s)));
  }
  function scoreLabel(s) {
    if (s >= 70) return { t: 'KUAT - setup swing layak', c: 'green' };
    if (s >= 45) return { t: 'SEDANG - konfirmasi tambahan', c: 'yellow' };
    return { t: 'LEMAH - hindari swing', c: 'red' };
  }

  var tfBadgeCard = document.getElementById('tfBadge') ? document.getElementById('tfBadge').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>\uD83D\uDCD0 Multi-TF Alignment Score</span><span class="agent-pill tech">Daily x Weekly</span></div>' +
    '<div id="mtfOut" style="font-size:0.8rem;color:var(--text-muted);">Proses sebuah saham - skor keselarasan tren harian & mingguan muncul di sini (kompas utama swing).</div>' +
    '<div class="src-note">Skor 0-100: posisi vs MA + kemiringan MA + keselarasan arah Daily x Weekly. >=70 = arus mendukung swing naik.</div>',
    tfBadgeCard);

  async function renderMTF(code) {
    var box = document.getElementById('mtfOut'); if (!box || !code) return;
    try {
      var dC = await getCandle(code, '1y'); var wC = null;
      try { var wj = await fetchChart(code + '.JK', '1y', '1wk'); wC = wj.chart.result[0]; } catch (_) {}
      var sc = tfScore(dC, wC); var lb = scoreLabel(sc);
      box.innerHTML = '<div style="display:flex;align-items:center;gap:12px;"><div style="font-family:var(--mono);font-size:1.8rem;font-weight:900;color:var(-- + lb.c + );">' + sc + '</div><div><div style="font-weight:800;color:var(' + lb.c + ');">' + lb.t + '</div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">Daily x Weekly - perbarui tiap Proses</div></div></div>';
    } catch (e) { box.innerHTML = '<span style="color:var(--red);">Skor gagal: ' + esc(e.message) + '</span>'; }
  }
  var mtfObs = new MutationObserver(function () { clearTimeout(mtfObs._t); mtfObs._t = setTimeout(function () { renderMTF(window.lastTicker); }, 700); });
  var trendEl = document.getElementById('valTrend');
  if (trendEl) mtfObs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  /* ================= SWING SETUP SCANNER (tab Market) ================= */
  var UNIV = [].concat(typeof SCR_UNIVERSE !== 'undefined' ? SCR_UNIVERSE : []).concat(["AKRA","ARTO","BBTN","BDMS","BRPT","BUKA","DEWA","DOID","EMTK","ESSA","EXCL","GGRM","HRUM","INCO","INDY","IRRA","ISSP","JSMR","KIJA","MAPI","MEDC","MIDI","MYOR","PGEO","PNLF","PPRE","PTPP","RAJA","SCMA","SIDO","SMGR","SRTG","TINS","TKIM","TPIA","WIKA","WSKT","ZINC","BGTG","PNBN","CMRY","AMMN","CUAN"]);
  // dedup
  UNIV = UNIV.filter(function (v, i, self) { return self.indexOf(v) === i; });

  var scrBtnCard = document.getElementById('scrBtn') ? document.getElementById('scrBtn').closest('.card') : null;
  P.card('tab-market',
    '<div class="card-title"><span>\uD83C\uDF0A Swing Setup Scanner</span><span class="agent-pill tech">Buy-on-Dip dalam Tren</span></div>' +
    '<button class="btn-copy" style="margin-top:0;" id="swScanBtn" onclick="runSwingScan()">\uD83C\uDF0A Scan Setup Swing</button>' +
    '<div id="swScanNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Filter: harga &gt; MA20 &amp; MA50 (tren naik) - ADX &gt;= 20 (tren kuat) - RSI 40-65 (belum jenuh) - pullback dekat MA20 (&lt;=3%) - volume kering saat koreksi. Tiap kandidat dilengkapi skor Multi-TF.</div>' +
    '<div id="swScanResult" class="hidden" style="margin-top:10px;"></div>',
    scrBtnCard);

  window.runSwingScan = async function () {
    var btn = document.getElementById('swScanBtn'); btn.disabled = true; btn.innerText = 'Scanning swing...';
    var out = document.getElementById('swScanResult'); out.classList.remove('hidden');
    out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      var cache = lsJSON('swscan_cache', null);
      if (cache && cache.t && Date.now() - cache.t < 10 * 60 * 1000) { renderScan(cache.rows); noteScan('Cache ' + new Date(cache.t).toLocaleTimeString('id-ID') + ' (refresh otomatis 10 menit).'); return; }
      var settled = await Promise.allSettled(UNIV.map(function (c) { return getCandle(c, '1y'); }));
      var rows = [];
      settled.forEach(function (res, i) {
        if (res.status !== 'fulfilled') return;
        var code = UNIV[i]; var A = arrays(res.value); var n = A.c.length; if (n < 60) return;
        var ma20 = smaArr(A.c, 20), ma50 = smaArr(A.c, 50), rsi = rsiArr(A.c, 14), adx = adxArr(A.h, A.l, A.c, 14), atr = atrArr(A.h, A.l, A.c, 14);
        var last = n - 1, price = A.c[last];
        var m20 = ma20[last], m50 = ma50[last], r = rsi[last], ax = adx[last], at = atr[last];
        if (m20 == null || m50 == null || r == null || ax == null) return;
        if (!(price > m20 && price > m50 && m20 > m50)) return;
        if (ax < 20) return;
        if (r < 40 || r > 65) return;
        var dist = (price - m20) / m20 * 100;
        if (dist < -1 || dist > 3) return;
        var vsum = 0; for (var v = last - 19; v <= last; v++) vsum += A.o[v]; var v20 = vsum / 20;
        var volDry = v20 > 0 ? (A.o[last] / v20) : 1;
        var s = 0;
        s += ax >= 30 ? 3 : (ax >= 25 ? 2 : 1);
        s += (dist >= -0.5 && dist <= 1.5) ? 2 : 1;
        s += (r >= 45 && r <= 58) ? 2 : 1;
        s += volDry < 0.85 ? 1 : 0;
        rows.push({ code: code, price: price, chg: ((price - A.c[last - 1]) / A.c[last - 1]) * 100, adx: ax, rsi: r, dist: dist, volDry: volDry, atrpct: at / price * 100, score: s, candle: res.value });
      });
      var top = rows.sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
      var wks = await Promise.allSettled(top.map(function (r) { return fetchChart(r.code + '.JK', '1y', '1wk').then(function (j) { return j.chart.result[0]; }); }));
      top.forEach(function (r, i) { r.mtf = wks[i].status === 'fulfilled' ? tfScore(r.candle, wks[i].value) : null; });
      saveLS('swscan_cache', { t: Date.now(), rows: top });
      renderScan(top);
      noteScan('Diperbarui ' + new Date().toLocaleTimeString('id-ID') + ' - ' + top.length + ' setup swing - ketuk baris untuk rencana.');
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Scan swing gagal: ' + esc(e.message) + '</div>'; }
    finally { btn.disabled = false; btn.innerText = '\uD83C\uDF0A Scan Setup Swing'; }
  };
  function noteScan(t) { var e = document.getElementById('swScanNote'); if (e) e.innerText = t; }
  function renderScan(rows) {
    var out = document.getElementById('swScanResult');
    if (!rows.length) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada setup swing yang lolos filter saat ini. Disiplin menunggu di zona nyaman adalah keunggulan swing trader.</div>'; return; }
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var badge = r.score >= 7 ? '\uD83D\uDD25' : (r.score >= 5 ? '\uD83D\uDC4D' : '\u2022');
      var mtfTxt = r.mtf != null ? ' \u2022 MTF ' + r.mtf : '';
      var mtfCol = r.mtf != null ? (r.mtf >= 70 ? 'green' : (r.mtf >= 45 ? 'yellow' : 'red')) : '';
      var mtfSpan = mtfTxt ? ' <span class="' + mtfCol + '">' + mtfTxt + '</span>' : '';
      html += '<div class="mkt-row" style="cursor:pointer;" onclick="swingPlanFromScan(' + i + ')">';
      html += '<span><strong>' + r.code + '</strong> <span style="color:var(--text-muted);font-size:0.68rem;">' + badge + ' skor ' + r.score + mtfSpan + '</span><br>';
      html += '<span style="font-size:0.66rem;color:#64748b;font-family:var(--mono);">ADX ' + r.adx.toFixed(0) + ' \u2022 RSI ' + r.rsi.toFixed(0) + ' \u2022 dist MA20 ' + (r.dist >= 0 ? '+' : '') + r.dist.toFixed(1) + '% \u2022 ATR ' + r.atrpct.toFixed(1) + '%</span></span>';
      html += '<span style="text-align:right;"><span style="font-weight:700;font-family:var(--mono);">' + Math.round(r.price).toLocaleString('id-ID') + '</span><br>';
      html += '<span class="' + (r.chg >= 0 ? 'green' : 'red') + '" style="font-size:0.7rem;font-weight:700;font-family:var(--mono);">' + (r.chg >= 0 ? '+' : '') + r.chg.toFixed(2) + '%</span></span>';
      html += '</div>';
    }
    html += '<div class="src-note">Setup = kandidat buy-on-dip dalam tren. Bukan sinyal beli otomatis - konfirmasi lewat Swing Plan & manajemen risiko Anda.</div>';
    out.innerHTML = html;
    window.__swRows = rows;
  }

  /* ================= KARTU SWING PLAN (tab Analisis) ================= */
  var riskCardEl = document.getElementById('rRr') ? document.getElementById('rRr').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>\uD83E\uDDFE Kartu Swing Plan</span><span class="agent-pill master">Scale-Out</span></div>' +
    '<div id="swPlan" class="report-card" style="margin-top:0;"><div style="color:var(--text-muted);font-size:0.78rem;">Proses saham atau ketuk baris Swing Scanner - kartu rencana swing bertahap (T1/T2/T3 + trailing) terisi otomatis & siap cetak.</div></div>' +
    '<button class="btn-copy" onclick="window.print()">\uD83D\uDDA8 Cetak / Simpan PDF</button>' +
    '<button class="btn-copy" onclick="copySwPlan()">\uD83D\uDCCB Salin Plan</button>',
    riskCardEl);

  function buildSwPlan(p) {
    var sl = p.sl, t1 = p.t1, t2 = p.t2, t3 = p.t3, entry = p.entry, atr = p.atr;
    var lotTotal = p.lot || 1;
    var l1 = Math.max(1, Math.round(lotTotal * 0.5));
    var l3 = Math.max(1, Math.round(lotTotal * 0.2));
    var l2 = Math.max(0, lotTotal - l1 - l3);
    var be = entry + (entry - sl) * 0.5;
    var h = '';
    h += '<div style="font-weight:800;color:#fff;font-size:0.95rem;">SWING PLAN - ' + p.code + '.JK</div>';
    h += '<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:8px;">' + p.date + ' \u2022 Setup: ' + p.setup + ' \u2022 Multi-TF ' + (p.mtf != null ? p.mtf + '/100' : '-') + ' \u2022 ATR ' + p.atrpct + '%</div>';
    h += '<div class="rp-line">\u2022 TESIS: ' + p.thesis + '</div>';
    h += '<div class="rp-line">\u2022 ENTRY: zona ' + rp(p.zoneLo) + ' - ' + rp(p.zoneHi) + ' (pullback ke nilai dalam tren)</div>';
    h += '<div class="rp-line">\u2022 STOP LOSS: ' + rp(sl) + ' (' + p.slNote + ') - invalidasi tesis, keluar tanpa negosiasi</div>';
    h += '<div class="rp-line">\u2022 TARGET BERTAHAP: T1 ' + rp(t1) + ' (jual 50%, ~' + l1 + ' lot) \u2022 T2 ' + rp(t2) + ' (jual 30%, ~' + l2 + ' lot) \u2022 T3 ' + rp(t3) + ' (20% runner, ~' + l3 + ' lot)</div>';
    h += '<div class="rp-line">\u2022 TRAILING: setelah T1 tembus, geser SL ke break-even ~ ' + rp(be) + '; selanjutnya trail 1,5xATR (' + rp(atr * 1.5) + ') di bawah harga tertinggi</div>';
    h += '<div class="rp-line">\u2022 HOLD: estimasi ' + p.hold + ' hari \u2022 R/R ke T2 ~ 1:' + p.rr.toFixed(1) + '</div>';
    h += '<div class="rp-line">\u2022 RISIKO: maks 1-2% modal pada risiko awal (entry ke SL); gunakan Kalkulator Ukuran Posisi / Scaling</div>';
    h += '<div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Rencana disiplin, bukan prediksi. Tesis bisa salah - yang dijaga adalah ukuran kerugian per trade.</div>';
    return h;
  }
  function fillSwPlan(p) { var box = document.getElementById('swPlan'); if (box) { box.innerHTML = buildSwPlan(p); sweep(box); } }
  window.copySwPlan = function () { var b = document.getElementById('swPlan'); if (b) navigator.clipboard.writeText(b.innerText).then(function () { alert('Swing Plan disalin!'); }).catch(function () { alert('Gagal menyalin.'); }); };

  function planFromMetrics(code, candle, mtf, setup) {
    var A = arrays(candle); var n = A.c.length; var price = A.c[n - 1];
    var ma20 = smaArr(A.c, 20)[n - 1], atr = atrArr(A.h, A.l, A.c, 14)[n - 1] || price * 0.03;
    var swLow = lowestL(A.l, n - 10, n);
    var sl = Math.min(swLow - atr * 0.3, price - atr * 1.2);
    var risk = price - sl;
    var t1 = price + risk * 1.5, t2 = price + risk * 2.5, t3 = price + risk * 4;
    var rr = (t2 - price) / risk;
    var thesis = setup === 'donchian' ? 'Breakout Donchian 20-hari - momentum lanjutan tren.' : 'Pullback ke MA20 dalam tren naik (ADX kuat) - masuk searah arus saat koreksi sehat.';
    return { code: code, date: new Date().toLocaleString('id-ID'), setup: setup === 'donchian' ? 'Donchian Breakout 20h' : 'Pullback-to-MA20', mtf: mtf, atrpct: (atr / price * 100).toFixed(1),
      thesis: thesis, entry: price, zoneLo: Math.round(price * 0.99), zoneHi: Math.round(Math.min(price * 1.01, ma20 * 1.01)),
      sl: sl, slNote: 'di bawah swing low - 0,3xATR', t1: t1, t2: t2, t3: t3, atr: atr, hold: setup === 'donchian' ? '10-25' : '7-20', rr: rr, lot: 1 };
  }
  window.swingPlanFromScan = function (i) {
    var r = (window.__swRows || [])[i]; if (!r) return;
    switchTab('analysis');
    setTimeout(function () { fillSwPlan(planFromMetrics(r.code, r.candle, r.mtf, 'pullback')); }, 350);
  };
  var swPlanObs = new MutationObserver(function () { clearTimeout(swPlanObs._t); swPlanObs._t = setTimeout(async function () {
    var code = window.lastTicker; if (!code) return;
    try { var dC = await getCandle(code, '1y'); var wC = null; try { var wj = await fetchChart(code + '.JK', '1y', '1wk'); wC = wj.chart.result[0]; } catch (_) {}
      fillSwPlan(planFromMetrics(code, dC, wC ? tfScore(dC, wC) : null, 'pullback')); } catch (_) {}
  }, 900); });
  if (trendEl) swPlanObs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  /* ================= SWING LAB (tab Analisis) ================= */
  var labCardEl = document.getElementById('qbBtn') ? document.getElementById('qbBtn').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>\uD83C\uDF0A Swing Lab</span><span class="agent-pill tech">Backtest Lokal 2 Tahun</span></div>' +
    '<div class="metric-grid" style="margin-bottom:8px;">' +
    '<div class="metric-box"><div class="metric-label">Kode (kosong=terakhir)</div><input type="text" id="swCode" class="fv-input" placeholder="auto"></div>' +
    '<div class="metric-box"><div class="metric-label">Strategi</div><select id="swStrat" class="fv-input" onchange="swDefaults()"><option value="pullback">Pullback-to-MA20</option><option value="donchian">Donchian Breakout 20h</option></select></div>' +
    '<div class="metric-box"><div class="metric-label" id="swL1">Max Hold (hari)</div><input type="text" id="swP1" class="fv-input" inputmode="numeric" value="25"></div>' +
    '<div class="metric-box"><div class="metric-label" id="swL2">TP (x risiko)</div><input type="text" id="swP2" class="fv-input" inputmode="decimal" value="2.5"></div>' +
    '</div>' +
    '<button class="btn-copy" style="margin-top:0;" id="swLabBtn" onclick="runSwingLab()">\uD83C\uDF0A Jalankan Swing Backtest</button>' +
    '<div id="swLabOut" class="report-card hidden"></div>' +
    '<div class="src-note">Entry di open berikut setelah sinyal; exit saat kena SL (swing-low - 0,3ATR), TP, atau max hold. Biaya round-trip +/-0,5% sudah dipotong. Profit Factor & Expectancy = ukuran edge sesungguhnya (bukan win rate kosmetik).</div>',
    labCardEl);

  window.swDefaults = function () {
    var s = document.getElementById('swStrat').value;
    document.getElementById('swL1').innerText = 'Max Hold (hari)';
    document.getElementById('swL2').innerText = 'TP (x risiko)';
    document.getElementById('swP1').value = s === 'donchian' ? 30 : 25;
    document.getElementById('swP2').value = '2.5';
  };

  function backtestPullback(c, h, l, o, maxHold, tpMul) {
    var ma20 = smaArr(c, 20), ma50 = smaArr(c, 50), rsi = rsiArr(c, 14), adx = adxArr(h, l, c, 14), atr = atrArr(h, l, c, 14);
    var trades = []; var pos = null;
    for (var i = 50; i < c.length - 1; i++) {
      if (!pos) {
        if (ma20[i] && ma50[i] && adx[i] && rsi[i] && atr[i] && c[i] > ma20[i] && ma20[i] > ma50[i] && adx[i] >= 20 && rsi[i] >= 40 && rsi[i] <= 65) {
          var dist = (c[i] - ma20[i]) / ma20[i] * 100;
          if (dist >= -1 && dist <= 3) pos = { entry: o[i + 1], ei: i + 1, sl: Math.min(lowestL(l, i - 9, i + 1) - atr[i] * 0.3, o[i + 1] - atr[i] * 1.2), atr: atr[i] };
        }
      } else {
        var held = i - pos.ei; var exit = null;
        if (l[i] <= pos.sl) { exit = pos.sl; }
        else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) { exit = pos.entry + (pos.entry - pos.sl) * tpMul; }
        else if (held >= maxHold) { exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; }
        if (exit != null) { trades.push((exit - pos.entry) / pos.entry - FEE); pos = null; }
      }
    }
    return trades;
  }
  function backtestDonchian(c, h, l, o, maxHold, tpMul) {
    var ma50 = smaArr(c, 50), atr = atrArr(h, l, c, 14);
    var trades = []; var pos = null;
    for (var i = 21; i < c.length - 1; i++) {
      if (!pos) {
        var hh = highestH(h, i - 20, i);
        if (ma50[i] && atr[i] && c[i] > ma50[i] && c[i] >= hh * 0.999) pos = { entry: o[i + 1], ei: i + 1, sl: lowestL(l, i - 19, i + 1) - atr[i] * 0.3, atr: atr[i] };
      } else {
        var held = i - pos.ei; var exit = null;
        if (l[i] <= pos.sl) { exit = pos.sl; }
        else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) { exit = pos.entry + (pos.entry - pos.sl) * tpMul; }
        else if (held >= maxHold) { exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; }
        if (exit != null) { trades.push((exit - pos.entry) / pos.entry - FEE); pos = null; }
      }
    }
    return trades;
  }
  function swingStats(tr) {
    if (!tr.length) return null;
    var n = tr.length; var wins = tr.filter(function (x) { return x > 0; }); var losses = tr.filter(function (x) { return x <= 0; });
    var wr = wins.length / n * 100;
    var avgW = wins.length ? wins.reduce(function (a, b) { return a + b; }, 0) / wins.length : 0;
    var avgL = losses.length ? losses.reduce(function (a, b) { return a + b; }, 0) / losses.length : 0;
    var grossW = wins.reduce(function (a, b) { return a + b; }, 0);
    var grossL = Math.abs(losses.reduce(function (a, b) { return a + b; }, 0));
    var pf = grossL > 0 ? grossW / grossL : (grossW > 0 ? 99 : 0);
    var expectancy = (avgW * wr / 100) + (avgL * (100 - wr) / 100);
    var cum = 0, peak = 0, mdd = 0;
    tr.forEach(function (x) { cum += x * 100; if (cum > peak) peak = cum; var dd = cum - peak; if (dd < mdd) mdd = dd; });
    return { n: n, wr: wr, avg: tr.reduce(function (a, b) { return a + b; }, 0) / n * 100, pf: pf, expectancy: expectancy * 100, mdd: mdd, worst: Math.min.apply(null, tr) * 100, best: Math.max.apply(null, tr) * 100 };
  }

  window.runSwingLab = async function () {
    var code = (document.getElementById('swCode').value || '').trim().toUpperCase() || window.lastTicker;
    if (!code) { alert('Isi kode saham atau Proses sebuah saham terlebih dahulu.'); return; }
    var strat = document.getElementById('swStrat').value;
    var maxHold = parseInt(document.getElementById('swP1').value, 10) || (strat === 'donchian' ? 30 : 25);
    var tpMul = parseFloat(document.getElementById('swP2').value) || 2.5;
    var out = document.getElementById('swLabOut'); out.classList.remove('hidden'); out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      var candle = await getCandle(code, '2y');
      var A = arrays(candle);
      var tr = strat === 'donchian' ? backtestDonchian(A.c, A.h, A.l, A.o, maxHold, tpMul) : backtestPullback(A.c, A.h, A.l, A.o, maxHold, tpMul);
      var st = swingStats(tr);
      var bh = (A.c[A.c.length - 1] - A.c[0]) / A.c[0] * 100;
      if (!st) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada trade swing terpicu 2 tahun ini dengan parameter tersebut - disiplin menunggu juga hasil yang sah.</div>'; return; }
      var pfCol = st.pf >= 1.5 ? 'green' : (st.pf >= 1 ? 'yellow' : 'red');
      var pfTxt = st.pf >= 99 ? '\u221E' : st.pf.toFixed(2);
      var h = '<div class="metric-grid">';
      h += '<div class="metric-box"><div class="metric-label">Jumlah Trade</div><div class="metric-value">' + st.n + '</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Win Rate (net)</div><div class="metric-value ' + (st.wr >= 50 ? 'green' : 'red') + '">' + st.wr.toFixed(0) + '%</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Profit Factor</div><div class="metric-value ' + pfCol + '">' + pfTxt + '</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Expectancy / trade</div><div class="metric-value ' + (st.expectancy >= 0 ? 'green' : 'red') + '">' + (st.expectancy >= 0 ? '+' : '') + st.expectancy.toFixed(2) + '%</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Net rata-rata / trade</div><div class="metric-value ' + (st.avg >= 0 ? 'green' : 'red') + '">' + (st.avg >= 0 ? '+' : '') + st.avg.toFixed(2) + '%</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Max DD equity</div><div class="metric-value red">' + st.mdd.toFixed(1) + '%</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Trade terbaik</div><div class="metric-value green">+' + st.best.toFixed(1) + '%</div></div>';
      h += '<div class="metric-box"><div class="metric-label">Buy & Hold 2y</div><div class="metric-value ' + (bh >= 0 ? 'green' : 'red') + '">' + (bh >= 0 ? '+' : '') + bh.toFixed(1) + '%</div></div>';
      h += '</div>';
      h += '<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Terburuk ' + st.worst.toFixed(1) + '%. Profit Factor &gt; 1,5 + Expectancy positif = edge historis yang layak (bukan jaminan masa depan). Bandingkan dengan Buy & Hold untuk melihat nilai aktif manajemen.</div>';
      out.innerHTML = h;
      sweep(out);
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Swing backtest gagal: ' + esc(e.message) + '</div>'; }
    finally { document.getElementById('swLabBtn').innerText = '\uD83C\uDF0A Jalankan Swing Backtest'; }
  };
})();
