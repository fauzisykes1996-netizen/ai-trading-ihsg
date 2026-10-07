/* swing.js — Plugin Swing ALL-IN-ONE (Build v6.7): Scanner + Lab + Plan + Multi-TF + Scaling + Trend Dash + Jurnal Tag + Mode Swing + Alert + Kurva + Fix Ticker */
/* Versi DEFINITIF: 100% TANPA backtick, TANPA ${}. Emoji via kode \u. Aman disalin dari iPhone. */
(function () {
  if (!window.P) return;
  var FEE = P.fee;
  document.querySelectorAll('header strong').forEach(function (el) { el.innerText = 'Build v6.7'; });

  /* ===== indikator seri ===== */
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
  function arrays(candle) { var q = candle.indicators.quote[0]; var c = [], h = [], l = [], o = []; for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null || q.open[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); o.push(q.open[i]); } return { c: c, h: h, l: l, o: o }; }
  async function getCandle(code, range) { var cc = loadCache(code); var json = (cc && cc.json && range === '1y') ? cc.json : null; if (!json) json = await fetchChart(code + '.JK', range); return json.chart.result[0]; }
  function lowestL(l, a, b) { var m = Infinity; for (var i = a; i < b; i++) if (l[i] < m) m = l[i]; return m; }
  function highestH(h, a, b) { var m = -Infinity; for (var i = a; i < b; i++) if (h[i] > m) m = h[i]; return m; }

  /* ===== Multi-TF Score ===== */
  function tfScore(dC, wC) {
    var d = arrays(dC), w = wC ? arrays(wC) : null;
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
  function scoreLabel(s) { if (s >= 70) return { t: 'KUAT - setup swing layak', c: 'green' }; if (s >= 45) return { t: 'SEDANG - konfirmasi tambahan', c: 'yellow' }; return { t: 'LEMAH - hindari swing', c: 'red' }; }

  var tfBadgeCard = document.getElementById('tfBadge') ? document.getElementById('tfBadge').closest('.card') : null;
  P.card('tab-analysis', '<div class="card-title"><span>\uD83D\uDCD0 Multi-TF Alignment Score</span><span class="agent-pill tech">Daily x Weekly</span></div><div id="mtfOut" style="font-size:0.8rem;color:var(--text-muted);">Proses sebuah saham - skor keselarasan tren harian & mingguan (kompas utama swing).</div><div class="src-note">Skor 0-100. &gt;=70 = arus mendukung swing naik.</div>', tfBadgeCard);
  async function renderMTF(code) {
    var box = document.getElementById('mtfOut'); if (!box || !code) return;
    try {
      var dC = await getCandle(code, '1y'); var wC = null;
      try { var wj = await fetchChart(code + '.JK', '1y', '1wk'); wC = wj.chart.result[0]; } catch (_) {}
      var sc = tfScore(dC, wC); var lb = scoreLabel(sc);
      box.innerHTML = '<div style="display:flex;align-items:center;gap:12px;"><div style="font-family:var(--mono);font-size:1.8rem;font-weight:900;color:var(' + lb.c + ');">' + sc + '</div><div><div style="font-weight:800;color:var(' + lb.c + ');">' + lb.t + '</div><div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">Daily x Weekly</div></div></div>';
    } catch (e) { box.innerHTML = '<span style="color:var(--red);">Skor gagal: ' + esc(e.message) + '</span>'; }
  }
  var trendEl = document.getElementById('valTrend');
  var mtfObs = new MutationObserver(function () { clearTimeout(mtfObs._t); mtfObs._t = setTimeout(function () { renderMTF(window.lastTicker); }, 700); });
  if (trendEl) mtfObs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  /* ===== Swing Setup Scanner ===== */
  var UNIV = [].concat(typeof SCR_UNIVERSE !== 'undefined' ? SCR_UNIVERSE : []).concat(["AKRA","ARTO","BBTN","BDMS","BRPT","BUKA","DEWA","DOID","EMTK","ESSA","EXCL","GGRM","HRUM","INCO","INDY","IRRA","ISSP","JSMR","KIJA","MAPI","MEDC","MIDI","MYOR","PGEO","PNLF","PPRE","PTPP","RAJA","SCMA","SIDO","SMGR","SRTG","TINS","TKIM","TPIA","WIKA","WSKT","ZINC","BGTG","PNBN","CMRY","AMMN","CUAN"]);
  UNIV = UNIV.filter(function (v, i, self) { return self.indexOf(v) === i; });
  var scrBtnCard = document.getElementById('scrBtn') ? document.getElementById('scrBtn').closest('.card') : null;
  P.card('tab-market', '<div class="card-title"><span>\uD83C\uDF0A Swing Setup Scanner</span><span class="agent-pill tech">Buy-on-Dip dalam Tren</span></div><button class="btn-copy" style="margin-top:0;" id="swScanBtn" onclick="runSwingScan()">\uD83C\uDF0A Scan Setup Swing</button><div id="swScanNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Filter: harga &gt; MA20 &amp; MA50 \u2022 ADX &gt;= 20 \u2022 RSI 40-65 \u2022 pullback dekat MA20 \u2022 volume kering. Tiap kandidat + skor Multi-TF.</div><div id="swScanResult" class="hidden" style="margin-top:10px;"></div>', scrBtnCard);
  window.runSwingScan = async function () {
    var btn = document.getElementById('swScanBtn'); btn.disabled = true; btn.innerText = 'Scanning swing...';
    var out = document.getElementById('swScanResult'); out.classList.remove('hidden'); out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      var cache = lsJSON('swscan_cache', null);
      if (cache && cache.t && Date.now() - cache.t < 600000) { renderScan(cache.rows); noteScan('Cache ' + new Date(cache.t).toLocaleTimeString('id-ID')); return; }
      var settled = await Promise.allSettled(UNIV.map(function (c) { return getCandle(c, '1y'); }));
      var rows = [];
      settled.forEach(function (res, i) {
        if (res.status !== 'fulfilled') return;
        var code = UNIV[i]; var A = arrays(res.value); var n = A.c.length; if (n < 60) return;
        var ma20 = smaArr(A.c, 20), ma50 = smaArr(A.c, 50), rsi = rsiArr(A.c, 14), adx = adxArr(A.h, A.l, A.c, 14), atr = atrArr(A.h, A.l, A.c, 14);
        var last = n - 1, price = A.c[last]; var m20 = ma20[last], m50 = ma50[last], r = rsi[last], ax = adx[last], at = atr[last];
        if (m20 == null || m50 == null || r == null || ax == null) return;
        if (!(price > m20 && price > m50 && m20 > m50)) return;
        if (ax < 20) return;
        if (r < 40 || r > 65) return;
        var dist = (price - m20) / m20 * 100;
        if (dist < -1 || dist > 3) return;
        var vsum = 0; for (var v = last - 19; v <= last; v++) vsum += A.o[v]; var v20 = vsum / 20; var volDry = v20 > 0 ? (A.o[last] / v20) : 1;
        var s = 0; s += ax >= 30 ? 3 : (ax >= 25 ? 2 : 1); s += (dist >= -0.5 && dist <= 1.5) ? 2 : 1; s += (r >= 45 && r <= 58) ? 2 : 1; s += volDry < 0.85 ? 1 : 0;
        rows.push({ code: code, price: price, chg: ((price - A.c[last - 1]) / A.c[last - 1]) * 100, adx: ax, rsi: r, dist: dist, atrpct: at / price * 100, score: s, candle: res.value });
      });
      var top = rows.sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
      var wks = await Promise.allSettled(top.map(function (rr) { return fetchChart(rr.code + '.JK', '1y', '1wk').then(function (j) { return j.chart.result[0]; }); }));
      top.forEach(function (rr, i) { rr.mtf = wks[i].status === 'fulfilled' ? tfScore(rr.candle, wks[i].value) : null; });
      saveLS('swscan_cache', { t: Date.now(), rows: top }); renderScan(top);
      noteScan('Diperbarui ' + new Date().toLocaleTimeString('id-ID') + ' \u2022 ' + top.length + ' setup swing.');
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Scan gagal: ' + esc(e.message) + '</div>'; }
    finally { btn.disabled = false; btn.innerText = '\uD83C\uDF0A Scan Setup Swing'; }
  };
  function noteScan(t) { var e = document.getElementById('swScanNote'); if (e) e.innerText = t; }
  function renderScan(rows) {
    var out = document.getElementById('swScanResult');
    if (!rows.length) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada setup swing lolos filter. Disiplin menunggu = keunggulan swing trader.</div>'; return; }
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i]; var badge = r.score >= 7 ? '\uD83D\uDD25' : (r.score >= 5 ? '\uD83D\uDC4D' : '\u2022');
      var mtfTxt = r.mtf != null ? ' \u2022 MTF ' + r.mtf : '';
      var mtfCol = r.mtf != null ? (r.mtf >= 70 ? 'green' : (r.mtf >= 45 ? 'yellow' : 'red')) : '';
      var mtfSpan = mtfTxt ? ' <span class="' + mtfCol + '">' + mtfTxt + '</span>' : '';
      html += '<div class="mkt-row" style="cursor:pointer;" onclick="swingPlanFromScan(' + i + ')"><span><strong>' + r.code + '</strong> <span style="color:var(--text-muted);font-size:0.68rem;">' + badge + ' skor ' + r.score + mtfSpan + '</span><br><span style="font-size:0.66rem;color:#64748b;font-family:var(--mono);">ADX ' + r.adx.toFixed(0) + ' \u2022 RSI ' + r.rsi.toFixed(0) + ' \u2022 dist MA20 ' + (r.dist >= 0 ? '+' : '') + r.dist.toFixed(1) + '% \u2022 ATR ' + r.atrpct.toFixed(1) + '%</span></span><span style="text-align:right;"><span style="font-weight:700;font-family:var(--mono);">' + Math.round(r.price).toLocaleString('id-ID') + '</span><br><span class="' + (r.chg >= 0 ? 'green' : 'red') + '" style="font-size:0.7rem;font-weight:700;font-family:var(--mono);">' + (r.chg >= 0 ? '+' : '') + r.chg.toFixed(2) + '%</span></span></div>';
    }
    html += '<div class="src-note">Setup = kandidat buy-on-dip dalam tren. Konfirmasi lewat Swing Plan & manajemen risiko Anda.</div>';
    out.innerHTML = html; window.__swRows = rows;
  }

  /* ===== Kartu Swing Plan ===== */
  var riskCardEl = document.getElementById('rRr') ? document.getElementById('rRr').closest('.card') : null;
  P.card('tab-analysis', '<div class="card-title"><span>\uD83E\uDDFE Kartu Swing Plan</span><span class="agent-pill master">Scale-Out</span></div><div id="swPlan" class="report-card" style="margin-top:0;"><div style="color:var(--text-muted);font-size:0.78rem;">Proses saham atau ketuk baris Swing Scanner - rencana swing bertahap (T1/T2/T3 + trailing) siap cetak.</div></div><button class="btn-copy" onclick="window.print()">\uD83D\uDDA8 Cetak / Simpan PDF</button><button class="btn-copy" onclick="copySwPlan()">\uD83D\uDCCB Salin Plan</button>', riskCardEl);
  function buildSwPlan(p) {
    var sl = p.sl, entry = p.entry, atr = p.atr, lotTotal = p.lot || 1;
    var l1 = Math.max(1, Math.round(lotTotal * 0.5)), l3 = Math.max(1, Math.round(lotTotal * 0.2)), l2 = Math.max(0, lotTotal - l1 - l3);
    var be = entry + (entry - sl) * 0.5;
    var h = '';
    h += '<div style="font-weight:800;color:#fff;font-size:0.95rem;">SWING PLAN - ' + p.code + '.JK</div>';
    h += '<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:8px;">' + p.date + ' \u2022 Setup: ' + p.setup + ' \u2022 Multi-TF ' + (p.mtf != null ? p.mtf + '/100' : '-') + ' \u2022 ATR ' + p.atrpct + '%</div>';
    h += '<div class="rp-line">\u2022 TESIS: ' + p.thesis + '</div>';
    h += '<div class="rp-line">\u2022 ENTRY: zona ' + rp(p.zoneLo) + ' - ' + rp(p.zoneHi) + '</div>';
    h += '<div class="rp-line">\u2022 STOP LOSS: ' + rp(sl) + ' (' + p.slNote + ')</div>';
    h += '<div class="rp-line">\u2022 TARGET: T1 ' + rp(p.t1) + ' (50%, ~' + l1 + ' lot) \u2022 T2 ' + rp(p.t2) + ' (30%, ~' + l2 + ' lot) \u2022 T3 ' + rp(p.t3) + ' (20% runner, ~' + l3 + ' lot)</div>';
    h += '<div class="rp-line">\u2022 TRAILING: setelah T1 tembus, SL ke break-even ~ ' + rp(be) + '; lalu trail 1,5xATR (' + rp(atr * 1.5) + ')</div>';
    h += '<div class="rp-line">\u2022 HOLD: estimasi ' + p.hold + ' hari \u2022 R/R ke T2 ~ 1:' + p.rr.toFixed(1) + '</div>';
    h += '<div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Rencana disiplin, bukan prediksi.</div>';
    return h;
  }
  function fillSwPlan(p) { var box = document.getElementById('swPlan'); if (box) { box.innerHTML = buildSwPlan(p); sweep(box); } }
  window.copySwPlan = function () { var b = document.getElementById('swPlan'); if (b) navigator.clipboard.writeText(b.innerText).then(function () { alert('Swing Plan disalin!'); }).catch(function () { alert('Gagal menyalin.'); }); };
  function planFromMetrics(code, candle, mtf, setup) {
    var A = arrays(candle); var n = A.c.length; var price = A.c[n - 1];
    var ma20 = smaArr(A.c, 20)[n - 1], atr = atrArr(A.h, A.l, A.c, 14)[n - 1] || price * 0.03;
    var swLow = lowestL(A.l, n - 10, n); var sl = Math.min(swLow - atr * 0.3, price - atr * 1.2); var risk = price - sl;
    var t1 = price + risk * 1.5, t2 = price + risk * 2.5, t3 = price + risk * 4; var rr = (t2 - price) / risk;
    var thesis = setup === 'donchian' ? 'Breakout Donchian 20-hari - momentum lanjutan tren.' : 'Pullback ke MA20 dalam tren naik (ADX kuat) - masuk searah arus saat koreksi sehat.';
    return { code: code, date: new Date().toLocaleString('id-ID'), setup: setup === 'donchian' ? 'Donchian Breakout 20h' : 'Pullback-to-MA20', mtf: mtf, atrpct: (atr / price * 100).toFixed(1), thesis: thesis, entry: price, zoneLo: Math.round(price * 0.99), zoneHi: Math.round(Math.min(price * 1.01, ma20 * 1.01)), sl: sl, slNote: 'di bawah swing low - 0,3xATR', t1: t1, t2: t2, t3: t3, atr: atr, hold: setup === 'donchian' ? '10-25' : '7-20', rr: rr, lot: 1 };
  }
  window.swingPlanFromScan = function (i) { var r = (window.__swRows || [])[i]; if (!r) return; switchTab('analysis'); setTimeout(function () { fillSwPlan(planFromMetrics(r.code, r.candle, r.mtf, 'pullback')); }, 350); };
  var swPlanObs = new MutationObserver(function () { clearTimeout(swPlanObs._t); swPlanObs._t = setTimeout(async function () { var code = window.lastTicker; if (!code) return; try { var dC = await getCandle(code, '1y'); var wC = null; try { var wj = await fetchChart(code + '.JK', '1y', '1wk'); wC = wj.chart.result[0]; } catch (_) {} fillSwPlan(planFromMetrics(code, dC, wC ? tfScore(dC, wC) : null, 'pullback')); } catch (_) {} }, 900); });
  if (trendEl) swPlanObs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  /* ===== Swing Lab ===== */
  var labCardEl = document.getElementById('qbBtn') ? document.getElementById('qbBtn').closest('.card') : null;
  P.card('tab-analysis', '<div class="card-title"><span>\uD83C\uDF0A Swing Lab</span><span class="agent-pill tech">Backtest Lokal 2 Tahun</span></div><div class="metric-grid" style="margin-bottom:8px;"><div class="metric-box"><div class="metric-label">Kode (kosong=terakhir)</div><input type="text" id="swCode" class="fv-input" placeholder="auto"></div><div class="metric-box"><div class="metric-label">Strategi</div><select id="swStrat" class="fv-input" onchange="swDefaults()"><option value="pullback">Pullback-to-MA20</option><option value="donchian">Donchian Breakout 20h</option></select></div><div class="metric-box"><div class="metric-label" id="swL1">Max Hold (hari)</div><input type="text" id="swP1" class="fv-input" inputmode="numeric" value="25"></div><div class="metric-box"><div class="metric-label" id="swL2">TP (x risiko)</div><input type="text" id="swP2" class="fv-input" inputmode="decimal" value="2.5"></div></div><button class="btn-copy" style="margin-top:0;" id="swLabBtn" onclick="runSwingLab()">\uD83C\uDF0A Jalankan Swing Backtest</button><div id="swLabOut" class="report-card hidden"></div><div class="src-note">Entry/exit di OPEN berikut; biaya round-trip +/-0,5% dipotong. Profit Factor & Expectancy = edge sesungguhnya.</div>', labCardEl);
  window.swDefaults = function () { var s = document.getElementById('swStrat').value; document.getElementById('swL1').innerText = 'Max Hold (hari)'; document.getElementById('swL2').innerText = 'TP (x risiko)'; document.getElementById('swP1').value = s === 'donchian' ? 30 : 25; document.getElementById('swP2').value = '2.5'; };
  function btPullback(c, h, l, o, maxHold, tpMul) { var ma20 = smaArr(c, 20), ma50 = smaArr(c, 50), rsi = rsiArr(c, 14), adx = adxArr(h, l, c, 14), atr = atrArr(h, l, c, 14); var trades = []; var pos = null; for (var i = 50; i < c.length - 1; i++) { if (!pos) { if (ma20[i] && ma50[i] && adx[i] && rsi[i] && atr[i] && c[i] > ma20[i] && ma20[i] > ma50[i] && adx[i] >= 20 && rsi[i] >= 40 && rsi[i] <= 65) { var dist = (c[i] - ma20[i]) / ma20[i] * 100; if (dist >= -1 && dist <= 3) pos = { entry: o[i + 1], ei: i + 1, sl: Math.min(lowestL(l, i - 9, i + 1) - atr[i] * 0.3, o[i + 1] - atr[i] * 1.2), atr: atr[i] }; } } else { var held = i - pos.ei; var exit = null; if (l[i] <= pos.sl) { exit = pos.sl; } else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) { exit = pos.entry + (pos.entry - pos.sl) * tpMul; } else if (held >= maxHold) { exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; } if (exit != null) { trades.push((exit - pos.entry) / pos.entry - FEE); pos = null; } } } return trades; }
  function btDonchian(c, h, l, o, maxHold, tpMul) { var ma50 = smaArr(c, 50), atr = atrArr(h, l, c, 14); var trades = []; var pos = null; for (var i = 21; i < c.length - 1; i++) { if (!pos) { var hh = highestH(h, i - 20, i); if (ma50[i] && atr[i] && c[i] > ma50[i] && c[i] >= hh * 0.999) pos = { entry: o[i + 1], ei: i + 1, sl: lowestL(l, i - 19, i + 1) - atr[i] * 0.3, atr: atr[i] }; } else { var held = i - pos.ei; var exit = null; if (l[i] <= pos.sl) { exit = pos.sl; } else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) { exit = pos.entry + (pos.entry - pos.sl) * tpMul; } else if (held >= maxHold) { exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; } if (exit != null) { trades.push((exit - pos.entry) / pos.entry - FEE); pos = null; } } } return trades; }
  function swingStats(tr) { if (!tr.length) return null; var n = tr.length; var wins = tr.filter(function (x) { return x > 0; }); var losses = tr.filter(function (x) { return x <= 0; }); var wr = wins.length / n * 100; var avgW = wins.length ? wins.reduce(function (a, b) { return a + b; }, 0) / wins.length : 0; var avgL = losses.length ? losses.reduce(function (a, b) { return a + b; }, 0) / losses.length : 0; var grossW = wins.reduce(function (a, b) { return a + b; }, 0); var grossL = Math.abs(losses.reduce(function (a, b) { return a + b; }, 0)); var pf = grossL > 0 ? grossW / grossL : (grossW > 0 ? 99 : 0); var expectancy = (avgW * wr / 100) + (avgL * (100 - wr) / 100); var cum = 0, peak = 0, mdd = 0; tr.forEach(function (x) { cum += x * 100; if (cum > peak) peak = cum; var dd = cum - peak; if (dd < mdd) mdd = dd; }); return { n: n, wr: wr, avg: tr.reduce(function (a, b) { return a + b; }, 0) / n * 100, pf: pf, expectancy: expectancy * 100, mdd: mdd, worst: Math.min.apply(null, tr) * 100, best: Math.max.apply(null, tr) * 100, trades: tr }; }
  window.runSwingLab = async function () {
    var code = (document.getElementById('swCode').value || '').trim().toUpperCase() || window.lastTicker;
    if (!code) { alert('Isi kode saham atau Proses sebuah saham terlebih dahulu.'); return; }
    var strat = document.getElementById('swStrat').value; var maxHold = parseInt(document.getElementById('swP1').value, 10) || (strat === 'donchian' ? 30 : 25); var tpMul = parseFloat(document.getElementById('swP2').value) || 2.5;
    var out = document.getElementById('swLabOut'); out.classList.remove('hidden'); out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      var candle = await getCandle(code, '2y'); var A = arrays(candle);
      var tr = strat === 'donchian' ? btDonchian(A.c, A.h, A.l, A.o, maxHold, tpMul) : btPullback(A.c, A.h, A.l, A.o, maxHold, tpMul);
      var st = swingStats(tr); var bh = (A.c[A.c.length - 1] - A.c[0]) / A.c[0] * 100;
      if (!st) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada trade swing terpicu 2 tahun ini - disiplin menunggu juga hasil yang sah.</div>'; return; }
      var pfCol = st.pf >= 1.5 ? 'green' : (st.pf >= 1 ? 'yellow' : 'red'); var pfTxt = st.pf >= 99 ? '\u221E' : st.pf.toFixed(2);
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
      h += '<div style="font-size:0.7rem;font-weight:800;color:#fff;margin-top:10px;">\uD83D\uDCC8 Kurva Ekuitas vs Buy & Hold</div>' + renderEquitySvg(st.trades, A.c);
      h += '<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Terburuk ' + st.worst.toFixed(1) + '%. PF &gt; 1,5 + Expectancy positif = edge historis layak (bukan jaminan).</div>';
      out.innerHTML = h; sweep(out);
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Swing backtest gagal: ' + esc(e.message) + '</div>'; }
    finally { document.getElementById('swLabBtn').innerText = '\uD83C\uDF0A Jalankan Swing Backtest'; }
  };
  function renderEquitySvg(trades, closes) {
    var pts = [0]; var cum = 0; trades.forEach(function (t) { cum += t * 100; pts.push(cum); });
    var bhPts = []; var step = Math.max(1, Math.floor(closes.length / pts.length));
    for (var i = 0; i < pts.length; i++) { var idx = Math.min(closes.length - 1, i * step); bhPts.push((closes[idx] - closes[0]) / closes[0] * 100); }
    var all = pts.concat(bhPts); var min = Math.min.apply(null, all), max = Math.max.apply(null, all); var span = (max - min) || 1; var W = 300, H = 90, pad = 6;
    function X(i) { return pad + (i / ((pts.length - 1) || 1)) * (W - 2 * pad); }
    function Y(v) { return H - pad - ((v - min) / span) * (H - 2 * pad); }
    function line(arr, color, cls) { var d = ''; for (var i = 0; i < arr.length; i++) d += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ',' + Y(arr[i]).toFixed(1) + ' '; return '<path class="' + (cls || '') + '" d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'; }
    var zeroY = Y(0).toFixed(1); var last = pts[pts.length - 1];
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:90px;display:block;margin-top:6px;">';
    svg += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + zeroY + '" y2="' + zeroY + '" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="3 3"/>';
    svg += line(bhPts, '#64748b', ''); svg += line(pts, '#22c55e', 'eq-line');
    svg += '<text x="' + (W - pad) + '" y="' + (Y(last) - 3).toFixed(1) + '" fill="#22c55e" font-size="8" text-anchor="end">' + (last >= 0 ? '+' : '') + last.toFixed(1) + '%</text></svg>';
    svg += '<div style="display:flex;gap:12px;font-size:0.62rem;color:#64748b;margin-top:2px;"><span><span style="color:#22c55e;">\u2501\u2501</span> Ekuitas strategi</span><span><span style="color:#64748b;">\u2501\u2501</span> Buy & Hold</span></div>';
    return svg;
  }

  /* ===== Dashboard Kekuatan Tren ===== */
  var tfCardEl = document.getElementById('mtfOut') ? document.getElementById('mtfOut').closest('.card') : null;
  P.card('tab-analysis', '<div class="card-title"><span>\uD83D\uDCCA Dashboard Kekuatan Tren</span><span class="agent-pill tech">Swing Compass</span></div><div id="trendDash" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - kekuatan tren (ADX, slope MA, partisipasi harga, volatilitas).</div>', tfCardEl);
  function trendVerdict(adx, slope20, abovePct, atrpct) { var s = 0; if (adx >= 25) s += 2; else if (adx >= 20) s += 1; if (slope20 >= 0.5) s += 2; else if (slope20 >= 0) s += 1; else s -= 1; if (abovePct >= 70) s += 2; else if (abovePct >= 50) s += 1; if (atrpct <= 3) s += 1; else if (atrpct >= 5) s -= 1; if (s >= 5) return { t: 'TREND KUAT - zona nyaman swing', c: 'green' }; if (s >= 2) return { t: 'TREND SEDANG - pilih-pilih setup', c: 'yellow' }; return { t: 'TREND LEMAH/MENDATAR - hindari swing', c: 'red' }; }
  async function renderTrendDash(code) {
    var box = document.getElementById('trendDash'); if (!box || !code) return;
    try {
      var A = arrays(await getCandle(code, '1y')); var n = A.c.length;
      var ma20 = smaArr(A.c, 20), ma50 = smaArr(A.c, 50), adx = adxArr(A.h, A.l, A.c, 14);
      var atr = atrArr(A.h, A.l, A.c, 14); var last = n - 1, price = A.c[last];
      var ax = adx[last], m20 = ma20[last], m50 = ma50[last], at = atr[last];
      var slope20 = (m20 != null && ma20[last - 5] != null && ma20[last - 5] !== 0) ? (m20 - ma20[last - 5]) / ma20[last - 5] * 100 : 0;
      var above = 0, cnt = 0; for (var i = Math.max(0, n - 20); i < n; i++) { if (ma20[i] != null) { cnt++; if (A.c[i] > ma20[i]) above++; } }
      var abovePct = cnt ? above / cnt * 100 : 0; var atrpct = at ? at / price * 100 : 0;
      var v = trendVerdict(ax || 0, slope20, abovePct, atrpct);
      function cell(lab, val, col) { return '<div class="metric-box"><div class="metric-label">' + lab + '</div><div class="metric-value ' + (col || '') + '">' + val + '</div></div>'; }
      var h = '<div style="font-weight:800;color:var(' + v.c + ');font-size:0.82rem;margin-bottom:8px;">' + v.t + '</div><div class="metric-grid">';
      h += cell('ADX (14)', ax != null ? ax.toFixed(0) + (ax >= 25 ? ' \uD83D\uDD25' : (ax >= 20 ? ' \uD83D\uDC4D' : '')) : '-', ax >= 25 ? 'green' : (ax >= 20 ? 'yellow' : 'red'));
      h += cell('Slope MA20 (5h)', slope20.toFixed(2) + '%', slope20 >= 0.5 ? 'green' : (slope20 >= 0 ? 'yellow' : 'red'));
      h += cell('Harga di atas MA20', abovePct.toFixed(0) + '% (20h)', abovePct >= 70 ? 'green' : (abovePct >= 50 ? 'yellow' : 'red'));
      h += cell('Volatilitas ATR%', atrpct.toFixed(1) + '%', atrpct <= 3 ? 'green' : (atrpct <= 5 ? 'yellow' : 'red'));
      h += cell('MA20 vs MA50', (m20 != null && m50 != null) ? (m20 > m50 ? 'MA20 di atas \u2705' : 'MA20 di bawah \u26A0\uFE0F') : '-', (m20 != null && m50 != null && m20 > m50) ? 'green' : 'red');
      h += cell('Harga vs MA20', m20 != null ? ((price >= m20 ? '+' : '') + ((price - m20) / m20 * 100).toFixed(1) + '%') : '-', price >= m20 ? 'green' : 'yellow');
      h += '</div>'; box.innerHTML = h;
    } catch (e) { box.innerHTML = '<span style="color:var(--red);">Dashboard gagal: ' + esc(e.message) + '</span>'; }
  }
  var dashObs = new MutationObserver(function () { clearTimeout(dashObs._t); dashObs._t = setTimeout(function () { renderTrendDash(window.lastTicker); }, 750); });
  if (trendEl) dashObs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  /* ===== Kalkulator Scaling Posisi ===== */
  (function injectScaling() {
    var det = null; var all = document.querySelectorAll('details.agent-detail');
    for (var i = 0; i < all.length; i++) { if (/Kalkulator Ukuran Posisi/.test(all[i].textContent)) { det = all[i]; break; } }
    if (!det) return;
    var wrap = document.createElement('div'); wrap.style.marginTop = '10px';
    wrap.innerHTML = '<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:6px;">\uD83E\uDDEE Mode Scaling (Swing)</div><div class="metric-grid" style="margin-bottom:8px;"><div class="metric-box"><div class="metric-label">Risiko Total Modal (%)</div><input type="text" inputmode="decimal" class="fv-input" id="scRisk" value="1.5"></div><div class="metric-box"><div class="metric-label">Tahap 1 / 2 / 3 (%)</div><input type="text" inputmode="text" class="fv-input" id="scSplit" value="50/30/20"></div></div><button class="btn-copy" style="margin-top:0;" onclick="calcScaling()">\uD83E\uDDEE Hitung Scaling Position</button><div id="scOut" class="report-card hidden" style="margin-top:8px;"></div>';
    det.appendChild(wrap);
  })();
  window.calcScaling = function () {
    var cap = parseNumID(document.getElementById('pcCap') ? document.getElementById('pcCap').value : '');
    var entry = parseNumID(document.getElementById('pcEntry') ? document.getElementById('pcEntry').value : '') || window.lastPrice;
    var sl = parseNumID(document.getElementById('pcSl') ? document.getElementById('pcSl').value : '');
    var riskPct = parseNumID(document.getElementById('scRisk').value);
    var split = (document.getElementById('scSplit').value || '50/30/20').split('/').map(function (x) { return parseFloat(x); });
    var out = document.getElementById('scOut'); out.classList.remove('hidden');
    if (!cap || !entry || !sl || !riskPct || entry <= sl || split.reduce(function (a, b) { return a + (b || 0); }, 0) <= 0) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Isi Modal, Entry, Stop Loss di atas + Risiko % dan tahap (50/30/20). Entry harus &gt; SL.</div>'; return; }
    var riskBudget = cap * riskPct / 100; var riskPerShare = entry - sl;
    var totalShares = Math.floor(riskBudget / riskPerShare / 100) * 100; var sumPct = split.reduce(function (a, b) { return a + (b || 0); }, 0);
    var labels = ['T1 (entry)', 'T2 (add-on)', 'T3 (runner)']; var stages = [];
    for (var i = 0; i < split.length; i++) { var sh = Math.floor(totalShares * (split[i] || 0) / sumPct / 100) * 100; stages.push({ pct: split[i] || 0, shares: sh, lot: sh / 100, label: labels[i] || ('Tahap ' + (i + 1)) }); }
    var be = entry + riskPerShare * 0.5; var trail = entry + riskPerShare * 1.5;
    var h = '<div class="metric-grid"><div class="metric-box"><div class="metric-label">Total Posisi</div><div class="metric-value green">' + totalShares.toLocaleString('id-ID') + ' lembar (' + (totalShares / 100) + ' lot)</div></div><div class="metric-box"><div class="metric-label">Risiko Riil (ke SL)</div><div class="metric-value red">' + rp(totalShares * riskPerShare) + ' (' + riskPct + '%)</div></div></div><div style="margin-top:8px;font-size:0.78rem;line-height:1.7;">';
    for (var k = 0; k < stages.length; k++) { if (stages[k].shares > 0) h += '<div class="rp-line">\u2022 <strong>' + stages[k].label + '</strong> ' + stages[k].pct + '% \u2192 ' + stages[k].lot + ' lot @ \u2264 ' + rp(entry) + '</div>'; }
    h += '<div class="rp-line">\u2022 Setelah T1 tembus: geser SL sisa ke break-even \u2248 ' + rp(be) + '</div>';
    h += '<div class="rp-line">\u2022 Trail runner di ' + rp(trail) + ' atau 1,5xATR di bawah highest high</div></div>';
    h += '<div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Risiko dikunci di awal; add-on hanya bila trade terbukti benar (di atas break-even).</div>';
    out.innerHTML = h; sweep(out);
  };

  /* ===== Jurnal ber-tag per setup ===== */
  var SETUPS = ['pullback', 'donchian', 'breakout', 'reversal', 'bsjp', 'lainnya'];
  var journalListEl = document.getElementById('journalList');
  if (journalListEl) {
    var ctrl = document.createElement('div'); ctrl.style.marginBottom = '10px';
    var btns = ''; for (var bi = 0; bi < SETUPS.length; bi++) btns += '<button class="btn-mini" onclick="tagLatest(\'' + SETUPS[bi] + '\')">' + SETUPS[bi] + '</button>';
    ctrl.innerHTML = '<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:6px;">\uD83C\uDFF7\uFE0F Tag Setup Entri Terbaru</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">' + btns + '</div><button class="btn-copy" style="margin-top:0;" onclick="renderSetupStats()">\uD83D\uDCCA Statistik Win-Rate per Setup</button><div id="setupStats" class="hidden" style="margin-top:10px;"></div>';
    journalListEl.parentElement.insertBefore(ctrl, journalListEl);
  }
  window.tagLatest = function (setup) { if (!journal.length) { alert('Belum ada entri jurnal. Proses/analisis saham dulu.'); return; } journal[0].setup = setup; saveLS('ihsg_journal', journal); renderJournal(); toast('\uD83C\uDFF7\uFE0F Entri terbaru di-tag: ' + setup); };
  async function enrichWithOutcome() {
    var cand = journal.filter(function (e) { return e.p && (Date.now() - e.d) > 2 * 86400000 && e.outcome == null; });
    var tickers = []; var seen = {}; for (var i = 0; i < cand.length && tickers.length < 12; i++) { if (!seen[cand[i].t]) { seen[cand[i].t] = 1; tickers.push(cand[i].t); } }
    var cur = {}; for (var j = 0; j < tickers.length; j++) { cur[tickers[j]] = cachePrice(tickers[j]) || (await tvSnapshot(tickers[j]]) && (await tvSnapshot(tickers[j]]).price) || null; }
    var changed = false;
    journal.forEach(function (e) { if (e.p && (Date.now() - e.d) > 2 * 86400000 && e.outcome == null && cur[e.t]) { e.outcome = (cur[e.t] - e.p) / e.p * 100; changed = true; } });
    if (changed) saveLS('ihsg_journal', journal);
  }
  window.renderSetupStats = async function () {
    var box = document.getElementById('setupStats'); box.classList.remove('hidden'); box.innerHTML = '<div class="skel-box" style="height:60px"></div>';
    try {
      await enrichWithOutcome(); var groups = {};
      journal.forEach(function (e) { if (e.outcome == null) return; var key = e.setup || 'tanpa-tag'; (groups[key] = groups[key] || []).push(e.outcome); });
      var keys = Object.keys(groups);
      if (!keys.length) { box.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Belum ada entri berusia &gt;=2 hari dengan outcome. Tag beberapa entri (\uD83C\uDFF7\uFE0F) dan tunggu 2 hari.</div>'; return; }
      var rows = keys.map(function (k) { var arr = groups[k]; var n = arr.length; var wr = arr.filter(function (x) { return x > 0; }).length / n * 100; var avg = arr.reduce(function (a, b) { return a + b; }, 0) / n; return { k: k, n: n, wr: wr, avg: avg }; }).sort(function (a, b) { return b.avg - a.avg; });
      var h = '<div style="font-size:0.72rem;font-weight:800;color:#fff;margin-bottom:6px;">Performa per Jenis Setup (outcome riil)</div>';
      for (var i = 0; i < rows.length; i++) { var rr = rows[i]; h += '<div class="mkt-row"><span><strong>' + rr.k + '</strong> <span style="color:var(--text-muted);font-size:0.68rem;">' + rr.n + ' entri</span></span><span style="text-align:right;font-family:var(--mono);"><span class="' + (rr.wr >= 50 ? 'green' : 'red') + '" style="font-weight:700;">WR ' + rr.wr.toFixed(0) + '%</span> \u2022 <span class="' + (rr.avg >= 0 ? 'green' : 'red') + '" style="font-weight:700;">' + (rr.avg >= 0 ? '+' : '') + rr.avg.toFixed(2) + '%</span></span></div>'; }
      h += '<div class="src-note">Cermin keputusan ANDA: setup mana paling cuan di tangan Anda. Fokuskan yang expectancy positif. Sampel &lt;5 baca hati-hati.</div>';
      box.innerHTML = h;
    } catch (e) { box.innerHTML = '<div style="color:var(--red);">Statistik gagal: ' + esc(e.message) + '</div>'; }
  };
  var jObs = new MutationObserver(function () { clearTimeout(jObs._t); jObs._t = setTimeout(function () { var tag = autoSetupTag(); if (tag && journal.length && journal[0].setup == null) { journal[0].setup = tag; saveLS('ihsg_journal', journal); } }, 800); });
  function autoSetupTag() { if (window.__lastSwingSetup) return window.__lastSwingSetup; var pb = document.getElementById('swPlan'); if (pb && /Donchian Breakout/.test(pb.innerText)) return 'donchian'; if (pb && /Pullback-to-MA20/.test(pb.innerText)) return 'pullback'; return null; }
  if (journalListEl) jObs.observe(journalListEl, { childList: true, characterData: true, subtree: true });

  /* ===== Mode Swing satu-klik ===== */
  var headerEl = document.getElementById('appHeader') || document.querySelector('header');
  if (headerEl) {
    var btn = document.createElement('button'); btn.id = 'swingModeBtn';
    btn.style.cssText = 'margin-left:6px;font-size:0.7rem;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.4);padding:5px 10px;border-radius:12px;font-weight:700;cursor:pointer;';
    btn.innerText = '\uD83D\uDC22 Swing'; btn.onclick = toggleSwingMode;
    var keyBtn = document.getElementById('keyStatusBtn');
    if (keyBtn && keyBtn.parentElement) keyBtn.parentElement.insertBefore(btn, keyBtn.nextSibling); else headerEl.appendChild(btn);
  }
  function applySwingMode(on) {
    var b = document.getElementById('swingModeBtn');
    if (b) { b.style.background = on ? 'rgba(34,197,94,.28)' : 'rgba(34,197,94,.15)'; b.style.boxShadow = on ? '0 0 12px rgba(34,197,94,.4)' : 'none'; b.innerText = on ? '\uD83D\uDC22 Swing ON' : '\uD83D\uDC22 Swing'; }
    try { var strat = document.getElementById('swStrat'); if (strat && on) { strat.value = 'pullback'; if (typeof window.swDefaults === 'function') window.swDefaults(); } var p1 = document.getElementById('swP1'), p2 = document.getElementById('swP2'); if (on) { if (p1) p1.value = 25; if (p2) p2.value = '2.5'; } var scRisk = document.getElementById('scRisk'), scSplit = document.getElementById('scSplit'); if (on) { if (scRisk) scRisk.value = '1.5'; if (scSplit) scSplit.value = '50/30/20'; } } catch (_) {}
    toast(on ? '\uD83D\uDC22 Mode Swing AKTIF - preset diselaraskan (hold 7-25 hari, scale-out 50/30/20).' : '\uD83D\uDC22 Mode Swing non-aktif.');
  }
  function toggleSwingMode() { var on = localStorage.getItem('ihsg_swingmode') !== '1'; localStorage.setItem('ihsg_swingmode', on ? '1' : '0'); applySwingMode(on); }
  setTimeout(function () { applySwingMode(localStorage.getItem('ihsg_swingmode') === '1'); }, 600);

  /* ===== Alert Kondisi Swing ===== */
  var alertHTML = '<div class="card-title"><span>\uD83D\uDD14 Alert Kondisi Swing</span><span class="agent-pill tech">Cek Tiap 5 Menit</span></div><div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">Alert ketika kondisi swing terpenuhi: sentuh MA20, ADX tembus 20, atau breakout Donchian 20h. Dicek tiap 5 menit saat aplikasi terbuka.</div><div class="metric-grid" style="margin-bottom:8px;"><div class="metric-box"><div class="metric-label">Kode Saham</div><input type="text" id="alCode" class="fv-input" placeholder="contoh: TLKM" maxlength="6"></div><div class="metric-box"><div class="metric-label">Kondisi</div><select id="alCond" class="fv-input"><option value="ma20">Harga sentuh MA20</option><option value="adx">ADX tembus 20</option><option value="donchian">Breakout Donchian 20h</option><option value="price">Target harga (manual)</option></select></div></div><div class="metric-grid" style="margin-bottom:8px;"><div class="metric-box"><div class="metric-label">Target Harga (hanya utk Target harga)</div><input type="text" inputmode="decimal" id="alPrice" class="fv-input" placeholder="opsional"></div><div class="metric-box" style="display:flex;align-items:flex-end;"><button class="btn-copy" style="margin-top:0;" onclick="addSwingAlert()">\uD83D\uDD14 Tambah Alert Swing</button></div></div><div id="alList"></div><div class="src-note">Alert tersimpan lokal & dicek selama aplikasi terbuka (banner + getar).</div>';
  P.card('tab-info', alertHTML, document.querySelector('#tab-info .disclaimer-box'));
  function swingAlerts() { return lsJSON('ihsg_swing_alerts', []); }
  function saveSwingAlerts(a) { saveLS('ihsg_swing_alerts', a); }
  function condLabel(x) { if (x.cond === 'ma20') return 'sentuh MA20'; if (x.cond === 'adx') return 'ADX >= 20'; if (x.cond === 'donchian') return 'breakout Donchian 20h'; return 'harga ' + (x.dir === 'above' ? '>=' : '<=') + ' ' + rp(x.price); }
  function renderSwingAlerts() { var box = document.getElementById('alList'); if (!box) return; var a = swingAlerts(); if (!a.length) { box.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);">Belum ada alert kondisi swing.</div>'; return; } var html = ''; for (var i = 0; i < a.length; i++) { var x = a[i]; html += '<div class="mkt-row"><span><strong>' + x.code + '</strong> <span style="color:var(--text-muted);font-size:0.7rem;">' + condLabel(x) + (x.done ? ' <span class="green">\u2705 terpenuhi</span>' : '') + '</span></span><button class="btn-mini" style="color:var(--red);" onclick="removeSwingAlert(' + i + ')">\u2715</button></div>'; } box.innerHTML = html; }
  window.addSwingAlert = function () { var code = (document.getElementById('alCode').value || '').trim().toUpperCase(); var cond = document.getElementById('alCond').value; if (!code) { alert('Isi kode saham.'); return; } var a = swingAlerts(); var entry = { code: code, cond: cond, done: false, created: Date.now() }; if (cond === 'price') { var p = parseNumID(document.getElementById('alPrice').value); if (!p) { alert('Isi target harga.'); return; } entry.price = p; entry.dir = 'above'; } a.push(entry); saveSwingAlerts(a); renderSwingAlerts(); toast('\uD83D\uDD14 Alert swing: ' + code + ' - ' + condLabel(entry)); };
  window.removeSwingAlert = function (i) { var a = swingAlerts(); a.splice(i, 1); saveSwingAlerts(a); renderSwingAlerts(); };
  async function checkOne(x) { try { var f = await tvSnapshot(x.code); if (!f || !hasVal(f.price)) return false; var price = f.price; if (x.cond === 'price') return (x.dir === 'above' ? price >= x.price : price <= x.price); var cc = loadCache(x.code); var json = (cc && cc.json) ? cc.json : null; if (!json) json = await fetchChart(x.code + '.JK', '1y'); var q = json.chart.result[0].indicators.quote[0]; var c = [], h = [], l = []; for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); } var n = c.length; if (n < 30) return false; if (x.cond === 'ma20') { var s = 0; for (var k = n - 20; k < n; k++) s += c[k]; var ma20 = s / 20; return Math.abs(price - ma20) / ma20 <= 0.012; } if (x.cond === 'adx') { var p = 14, pdm = [], mdm = [], tr = []; for (var j = 0; j < n; j++) { if (j === 0) { pdm.push(0); mdm.push(0); tr.push(h[j] - l[j]); continue; } var up = h[j] - h[j - 1], dn = l[j - 1] - l[j]; pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0); tr.push(Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1]))); } var smf = function (arr) { var o = []; var e = null; for (var m = 0; m < arr.length; m++) { e = (e === null) ? arr[m] : (arr[m] + (p - 1) * e) / p; o.push(e); } return o; }; var str = smf(tr), spd = smf(pdm), smd = smf(mdm); var adxLast = null; for (var z = p; z < n; z++) { var pdi = spd[z] / (str[z] || 1) * 100, mdi = smd[z] / (str[z] || 1) * 100; var dx = Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100; adxLast = (adxLast === null) ? dx : (dx + (p - 1) * adxLast) / p; } return adxLast != null && adxLast >= 20; } if (x.cond === 'donchian') { var hh = -Infinity; for (var dd = n - 21; dd < n - 1; dd++) if (h[dd] > hh) hh = h[dd]; return price >= hh; } return false; } catch (_) { return false; } }
  async function runSwingAlertCheck() { var a = swingAlerts(); var pending = a.filter(function (x) { return !x.done; }); if (!pending.length) return; for (var i = 0; i < pending.length; i++) { if (await checkOne(pending[i])) { pending[i].done = true; toast('\uD83D\uDD14 ALERT SWING: ' + pending[i].code + ' - ' + condLabel(pending[i]) + ' TERPENUHI!'); if (navigator.vibrate) navigator.vibrate([80, 40, 80]); } } saveSwingAlerts(a); renderSwingAlerts(); }
  renderSwingAlerts(); setInterval(runSwingAlertCheck, 300000); setTimeout(runSwingAlertCheck, 8000);

  /* ===== Fix Ticker Tape (perubahan harian) ===== */
  (function patchTicker() {
    var tickerWrap = document.querySelector('.ticker-wrap');
    if (!tickerWrap) { tickerWrap = document.createElement('div'); tickerWrap.className = 'ticker-wrap'; document.body.insertBefore(tickerWrap, document.body.firstChild); }
    var codes = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'ANTM', 'PTBA', 'GOTO', 'ADMR', 'NCKL'];
    function render(items) { if (!items.length) return; var html = ''; for (var i = 0; i < items.length; i++) { var it = items[i]; var cls = it.chg >= 0 ? 'ticker-up' : 'ticker-down'; var arrow = it.chg >= 0 ? '\u25B2' : '\u25BC'; html += '<span class="ticker-item"><span class="ticker-code">' + it.code + '</span><span class="ticker-price">Rp ' + Math.round(it.price).toLocaleString('id-ID') + '</span><span class="' + cls + '">' + arrow + ' ' + Math.abs(it.chg).toFixed(1) + '%</span></span>'; } tickerWrap.innerHTML = '<div class="ticker-track"><span class="ticker-item"><span class="pulse-dot"></span>LIVE</span>' + html + html + '</div>'; tickerWrap.classList.add('active'); document.body.classList.add('has-ticker'); }
    async function upd() { if (!marketOpenWIB()) { tickerWrap.classList.remove('active'); document.body.classList.remove('has-ticker'); return; } var items = []; var settled = await Promise.allSettled(codes.map(function (c) { return fetchChart(c + '.JK', '5d'); })); settled.forEach(function (res, i) { if (res.status !== 'fulfilled') return; var meta = res.value && res.value.chart && res.value.chart.result && res.value.chart.result[0] ? res.value.chart.result[0].meta : null; if (meta && meta.regularMarketPrice && meta.chartPreviousClose) items.push({ code: codes[i], price: meta.regularMarketPrice, chg: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 }); }); if (items.length) render(items); }
    upd(); setInterval(upd, 90000);
    var wraps = document.querySelectorAll('.ticker-wrap'); for (var i = 1; i < wraps.length; i++) wraps[i].style.display = 'none';
  })();

  /* ===== CSS kurva ===== */
  (function () { var st = document.createElement('style'); st.textContent = '.eq-line{stroke-dasharray:1400;stroke-dashoffset:1400;animation:eqDraw 1.4s ease forwards;}@keyframes eqDraw{to{stroke-dashoffset:0;}}'; document.head.appendChild(st); })();
})();
