/* swcore.js - Swing Core 1/4 (Build v6.7): indikator + Multi-TF Score + Dashboard Tren */
(function () {
  if (!window.P) return;
  var SW = {};
  window.SW = SW;
  SW.sma = function (a, p) { var o = new Array(a.length).fill(null); var s = 0; for (var i = 0; i < a.length; i++) { s += a[i]; if (i >= p) s -= a[i - p]; if (i >= p - 1) o[i] = s / p; } return o; };
  SW.ema = function (a, p) { var o = new Array(a.length).fill(null); var k = 2 / (p + 1); var e = null; for (var i = 0; i < a.length; i++) { e = (e === null) ? a[i] : a[i] * k + e * (1 - k); if (i >= p - 1) o[i] = e; } return o; };
  SW.rsi = function (a, p) { var o = new Array(a.length).fill(null); if (a.length <= p) return o; var g = 0, l = 0; for (var i = 1; i <= p; i++) { var d = a[i] - a[i - 1]; if (d >= 0) g += d; else l -= d; } g /= p; l /= p; o[p] = l === 0 ? 100 : 100 - 100 / (1 + g / l); for (var j = p + 1; j < a.length; j++) { var d2 = a[j] - a[j - 1]; g = (g * (p - 1) + Math.max(d2, 0)) / p; l = (l * (p - 1) + Math.max(-d2, 0)) / p; o[j] = l === 0 ? 100 : 100 - 100 / (1 + g / l); } return o; };
  SW.atr = function (h, l, c, p) { var tr = []; for (var i = 0; i < c.length; i++) { tr.push(i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); } return SW.ema(tr, p); };
  SW.adx = function (h, l, c, p) {
    var n = c.length; var pdm = new Array(n).fill(0); var mdm = new Array(n).fill(0); var tr = new Array(n).fill(0);
    var i;
    for (i = 1; i < n; i++) {
      var up = h[i] - h[i - 1]; var dn = l[i - 1] - l[i];
      pdm[i] = (up > dn && up > 0) ? up : 0;
      mdm[i] = (dn > up && dn > 0) ? dn : 0;
      tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]));
    }
    var sm = function (arr) { var o = new Array(n).fill(null); var e = null; for (var m = 0; m < n; m++) { e = (e === null) ? arr[m] : (arr[m] + (p - 1) * e) / p; if (m >= p) o[m] = e; } return o; };
    var str = sm(tr); var spd = sm(pdm); var smd = sm(mdm); var dx = [];
    for (i = 0; i < n; i++) {
      if (str[i] == null || str[i] === 0) { dx.push(null); continue; }
      var pdi = spd[i] / str[i] * 100; var mdi = smd[i] / str[i] * 100;
      dx.push(Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100);
    }
    var raw = sm(dx.map(function (v) { return v === null ? 0 : v; }));
    return raw.map(function (v, i2) { return dx[i2] === null ? null : v; });
  };
  SW.slope = function (ma) { var o = new Array(ma.length).fill(null); for (var i = 5; i < ma.length; i++) { if (ma[i] == null || ma[i - 5] == null || ma[i - 5] === 0) continue; o[i] = (ma[i] - ma[i - 5]) / ma[i - 5] * 100; } return o; };
  SW.arrays = function (candle) { var q = candle.indicators.quote[0]; var c = [], h = [], l = [], o = []; for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null || q.open[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); o.push(q.open[i]); } return { c: c, h: h, l: l, o: o }; };
  SW.candle = async function (code, range) { var cc = loadCache(code); var json = (cc && cc.json && range === '1y') ? cc.json : null; if (!json) json = await fetchChart(code + '.JK', range); return json.chart.result[0]; };
  SW.lowest = function (l, a, b) { var m = Infinity; for (var i = a; i < b; i++) { if (l[i] < m) m = l[i]; } return m; };
  SW.highest = function (h, a, b) { var m = -Infinity; for (var i = a; i < b; i++) { if (h[i] > m) m = h[i]; } return m; };
  SW.tfScore = function (dC, wC) {
    var d = SW.arrays(dC); var w = wC ? SW.arrays(wC) : null;
    var dma = SW.sma(d.c, 20); var dwma = w ? SW.sma(w.c, 10) : null;
    var dLast = d.c[d.c.length - 1]; var wLast = w ? w.c[w.c.length - 1] : null;
    var s = 50;
    if (dma[dma.length - 1] != null) { s += dLast > dma[dma.length - 1] ? 18 : -18; }
    if (dwma && dwma[dwma.length - 1] != null) { s += wLast > dwma[dwma.length - 1] ? 22 : -22; }
    var dsl = SW.slope(dma); var wsl = dwma ? SW.slope(dwma) : null;
    var ds = dsl[dsl.length - 1]; var ws = wsl ? wsl[wsl.length - 1] : null;
    if (ds != null) { s += ds > 0.5 ? 6 : (ds < -0.5 ? -6 : 0); }
    if (ws != null) { s += ws > 0.5 ? 8 : (ws < -0.5 ? -8 : 0); }
    if (ds != null && ws != null && ((ds > 0 && ws > 0) || (ds < 0 && ws < 0))) { s += 6; }
    return Math.max(0, Math.min(100, Math.round(s)));
  };
  SW.scoreLabel = function (s) {
    if (s >= 70) return { t: 'KUAT - setup swing layak', c: 'green' };
    if (s >= 45) return { t: 'SEDANG - konfirmasi tambahan', c: 'yellow' };
    return { t: 'LEMAH - hindari swing', c: 'red' };
  };

  var tfCard = document.getElementById('tfBadge') ? document.getElementById('tfBadge').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>\uD83D\uDCD0 Multi-TF Alignment Score</span><span class="agent-pill tech">Daily x Weekly</span></div>' +
    '<div id="mtfOut" style="font-size:0.8rem;color:var(--text-muted);">Proses sebuah saham - skor keselarasan tren harian & mingguan (kompas utama swing).</div>' +
    '<div class="src-note">Skor 0-100. >=70 = arus mendukung swing naik.</div>',
    tfCard);

  async function renderMTF(code) {
    var box = document.getElementById('mtfOut'); if (!box || !code) return;
    try {
      var dC = await SW.candle(code, '1y'); var wC = null;
      try { var wj = await fetchChart(code + '.JK', '1y', '1wk'); wC = wj.chart.result[0]; } catch (e1) { wC = null; }
      var sc = SW.tfScore(dC, wC); var lb = SW.scoreLabel(sc);
      box.innerHTML = '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div style="font-family:var(--mono);font-size:1.8rem;font-weight:900;color:var(--' + lb.c + ');">' + sc + '</div>' +
        '<div><div style="font-weight:800;color:var(--' + lb.c + ');">' + lb.t + '</div>' +
        '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">Daily x Weekly - perbarui tiap Proses</div></div></div>';
    } catch (e) { box.innerHTML = '<span style="color:var(--red);">Skor gagal: ' + esc(e.message) + '</span>'; }
  }

  P.card('tab-analysis',
    '<div class="card-title"><span>\uD83D\uDCCA Dashboard Kekuatan Tren</span><span class="agent-pill tech">Swing Compass</span></div>' +
    '<div id="trendDash" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - ADX, slope MA, partisipasi harga, volatilitas.</div>',
    document.getElementById('mtfOut') ? document.getElementById('mtfOut').closest('.card') : null);

  function verdict(adx, slope20, abovePct, atrpct) {
    var s = 0;
    if (adx >= 25) { s += 2; } else if (adx >= 20) { s += 1; }
    if (slope20 >= 0.5) { s += 2; } else if (slope20 >= 0) { s += 1; } else { s -= 1; }
    if (abovePct >= 70) { s += 2; } else if (abovePct >= 50) { s += 1; }
    if (atrpct <= 3) { s += 1; } else if (atrpct >= 5) { s -= 1; }
    if (s >= 5) return { t: 'TREND KUAT - zona nyaman swing', c: 'green' };
    if (s >= 2) return { t: 'TREND SEDANG - pilih-pilih setup', c: 'yellow' };
    return { t: 'TREND LEMAH/MENDATAR - hindari swing', c: 'red' };
  }
  async function renderDash(code) {
    var box = document.getElementById('trendDash'); if (!box || !code) return;
    try {
      var A = SW.arrays(await SW.candle(code, '1y')); var n = A.c.length;
      var ma20 = SW.sma(A.c, 20); var ma50 = SW.sma(A.c, 50); var adx = SW.adx(A.h, A.l, A.c, 14); var atr = SW.atr(A.h, A.l, A.c, 14);
      var last = n - 1; var price = A.c[last];
      var ax = adx[last]; var m20 = ma20[last]; var m50 = ma50[last]; var at = atr[last];
      var slope20 = (m20 != null && ma20[last - 5] != null && ma20[last - 5] !== 0) ? (m20 - ma20[last - 5]) / ma20[last - 5] * 100 : 0;
      var above = 0; var cnt = 0;
      for (var i = Math.max(0, n - 20); i < n; i++) { if (ma20[i] != null) { cnt++; if (A.c[i] > ma20[i]) above++; } }
      var abovePct = cnt ? above / cnt * 100 : 0;
      var atrpct = at ? at / price * 100 : 0;
      var v = verdict(ax || 0, slope20, abovePct, atrpct);
      function cell(lab, val, col) { return '<div class="metric-box"><div class="metric-label">' + lab + '</div><div class="metric-value ' + (col || '') + '">' + val + '</div></div>'; }
      var h = '<div style="font-weight:800;color:var(--' + v.c + ');font-size:0.82rem;margin-bottom:8px;">' + v.t + '</div><div class="metric-grid">';
      h += cell('ADX (14)', ax != null ? ax.toFixed(0) : '-', ax >= 25 ? 'green' : (ax >= 20 ? 'yellow' : 'red'));
      h += cell('Slope MA20 (5h)', slope20.toFixed(2) + '%', slope20 >= 0.5 ? 'green' : (slope20 >= 0 ? 'yellow' : 'red'));
      h += cell('Di atas MA20', abovePct.toFixed(0) + '% (20h)', abovePct >= 70 ? 'green' : (abovePct >= 50 ? 'yellow' : 'red'));
      h += cell('ATR%', atrpct.toFixed(1) + '%', atrpct <= 3 ? 'green' : (atrpct <= 5 ? 'yellow' : 'red'));
      h += cell('MA20 vs MA50', (m20 != null && m50 != null) ? (m20 > m50 ? 'MA20 atas' : 'MA20 bawah') : '-', (m20 != null && m50 != null && m20 > m50) ? 'green' : 'red');
      h += cell('Harga vs MA20', m20 != null ? ((price >= m20 ? '+' : '') + ((price - m20) / m20 * 100).toFixed(1) + '%') : '-', price >= m20 ? 'green' : 'yellow');
      h += '</div>';
      box.innerHTML = h;
    } catch (e) { box.innerHTML = '<span style="color:var(--red);">Dashboard gagal: ' + esc(e.message) + '</span>'; }
  }

  var trendEl = document.getElementById('valTrend');
  var obs = new MutationObserver(function () {
    clearTimeout(obs._t);
    obs._t = setTimeout(function () { renderMTF(window.lastTicker); renderDash(window.lastTicker); }, 700);
  });
  if (trendEl) obs.observe(trendEl, { childList: true, characterData: true, subtree: true });
})();
/* END swcore v1 */
