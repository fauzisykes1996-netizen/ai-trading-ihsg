/* polish.js — Plugin Polish Pack (Build v6.7): Mode Swing + Alert Kondisi + Kurva Ekuitas + Fix Ticker */
/* Versi DEFINITIF anti-korup: 100% TANPA backtick dan TANPA ${} — aman disalin dari iPhone. */
(function () {
  if (!window.P) return;
  document.querySelectorAll('header strong').forEach(function (el) { el.innerText = 'Build v6.7'; });

  /* ================= 1) MODE SWING SATU-KLIK ================= */
  var headerEl = document.getElementById('appHeader') || document.querySelector('header');
  if (headerEl) {
    var btn = document.createElement('button');
    btn.id = 'swingModeBtn';
    btn.style.cssText = 'margin-left:6px;font-size:0.7rem;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.4);padding:5px 10px;border-radius:12px;font-weight:700;cursor:pointer;';
    btn.innerText = '\uD83D\uDC22 Swing';
    btn.onclick = toggleSwingMode;
    var keyBtn = document.getElementById('keyStatusBtn');
    if (keyBtn && keyBtn.parentElement) keyBtn.parentElement.insertBefore(btn, keyBtn.nextSibling);
    else headerEl.appendChild(btn);
  }
  function applySwingMode(on) {
    var b = document.getElementById('swingModeBtn');
    if (b) {
      b.style.background = on ? 'rgba(34,197,94,.28)' : 'rgba(34,197,94,.15)';
      b.style.boxShadow = on ? '0 0 12px rgba(34,197,94,.4)' : 'none';
      b.innerText = on ? '\uD83D\uDC22 Swing ON' : '\uD83D\uDC22 Swing';
    }
    try {
      var strat = document.getElementById('swStrat');
      if (strat && on) { strat.value = 'pullback'; if (typeof window.swDefaults === 'function') window.swDefaults(); }
      var p1 = document.getElementById('swP1'), p2 = document.getElementById('swP2');
      if (on) { if (p1) p1.value = 25; if (p2) p2.value = '2.5'; }
      var scRisk = document.getElementById('scRisk'), scSplit = document.getElementById('scSplit');
      if (on) { if (scRisk) scRisk.value = '1.5'; if (scSplit) scSplit.value = '50/30/20'; }
    } catch (_) {}
    toast(on ? '\uD83D\uDC22 Mode Swing AKTIF — preset Lab & Scaling diselaraskan (hold 7-25 hari, scale-out 50/30/20).' : '\uD83D\uDC22 Mode Swing non-aktif — kembali ke preset default.');
  }
  function toggleSwingMode() {
    var on = localStorage.getItem('ihsg_swingmode') !== '1';
    localStorage.setItem('ihsg_swingmode', on ? '1' : '0');
    applySwingMode(on);
  }
  setTimeout(function () { applySwingMode(localStorage.getItem('ihsg_swingmode') === '1'); }, 600);

  /* ================= 2) ALERT BERBASIS KONDISI SWING ================= */
  var alertHTML =
    '<div class="card-title"><span>\uD83D\uDD14 Alert Kondisi Swing</span><span class="agent-pill tech">Cek Tiap 5 Menit</span></div>' +
    '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">Bukan sekadar target harga — alert ketika kondisi swing terpenuhi: harga menyentuh MA20, ADX menembus 20, atau breakout Donchian 20-hari. Dicek otomatis tiap 5 menit saat aplikasi terbuka.</div>' +
    '<div class="metric-grid" style="margin-bottom:8px;">' +
    '<div class="metric-box"><div class="metric-label">Kode Saham</div><input type="text" id="alCode" class="fv-input" placeholder="contoh: TLKM" maxlength="6"></div>' +
    '<div class="metric-box"><div class="metric-label">Kondisi</div><select id="alCond" class="fv-input"><option value="ma20">Harga sentuh MA20</option><option value="adx">ADX tembus 20</option><option value="donchian">Breakout Donchian 20h</option><option value="price">Target harga (manual)</option></select></div>' +
    '</div>' +
    '<div class="metric-grid" style="margin-bottom:8px;">' +
    '<div class="metric-box"><div class="metric-label">Target Harga (hanya utk Target harga)</div><input type="text" inputmode="decimal" id="alPrice" class="fv-input" placeholder="opsional"></div>' +
    '<div class="metric-box" style="display:flex;align-items:flex-end;"><button class="btn-copy" style="margin-top:0;" onclick="addSwingAlert()">\uD83D\uDD14 Tambah Alert Swing</button></div>' +
    '</div>' +
    '<div id="alList"></div>' +
    '<div class="src-note">Alert tersimpan lokal & dicek selama aplikasi terbuka (banner + getar). Pemantauan 24/7 saat aplikasi tertutup butuh Service Worker (rencana v6.8).</div>';
  P.card('tab-info', alertHTML, document.querySelector('#tab-info .disclaimer-box'));

  function swingAlerts() { return lsJSON('ihsg_swing_alerts', []); }
  function saveSwingAlerts(a) { saveLS('ihsg_swing_alerts', a); }
  function condLabel(x) {
    if (x.cond === 'ma20') return 'sentuh MA20';
    if (x.cond === 'adx') return 'ADX >= 20';
    if (x.cond === 'donchian') return 'breakout Donchian 20h';
    return 'harga ' + (x.dir === 'above' ? '>=' : '<=') + ' ' + rp(x.price);
  }
  function renderSwingAlerts() {
    var box = document.getElementById('alList'); if (!box) return;
    var a = swingAlerts();
    if (!a.length) { box.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);">Belum ada alert kondisi swing.</div>'; return; }
    var html = '';
    for (var i = 0; i < a.length; i++) {
      var x = a[i];
      html += '<div class="mkt-row"><span><strong>' + x.code + '</strong> <span style="color:var(--text-muted);font-size:0.7rem;">' + condLabel(x) + (x.done ? ' <span class="green">✅ terpenuhi</span>' : '') + '</span></span><button class="btn-mini" style="color:var(--red);" onclick="removeSwingAlert(' + i + ')">✕</button></div>';
    }
    box.innerHTML = html;
  }
  window.addSwingAlert = function () {
    var code = (document.getElementById('alCode').value || '').trim().toUpperCase();
    var cond = document.getElementById('alCond').value;
    if (!code) { alert('Isi kode saham.'); return; }
    var a = swingAlerts();
    var entry = { code: code, cond: cond, done: false, created: Date.now() };
    if (cond === 'price') {
      var p = parseNumID(document.getElementById('alPrice').value);
      if (!p) { alert('Isi target harga untuk kondisi Target harga.'); return; }
      entry.price = p; entry.dir = 'above';
    }
    a.push(entry); saveSwingAlerts(a); renderSwingAlerts();
    toast('\uD83D\uDD14 Alert swing ditambahkan: ' + code + ' — ' + condLabel(entry));
  };
  window.removeSwingAlert = function (i) { var a = swingAlerts(); a.splice(i, 1); saveSwingAlerts(a); renderSwingAlerts(); };

  async function checkOne(x) {
    try {
      var f = await tvSnapshot(x.code);
      if (!f || !hasVal(f.price)) return false;
      var price = f.price;
      if (x.cond === 'price') return (x.dir === 'above' ? price >= x.price : price <= x.price);
      var cc = loadCache(x.code); var json = (cc && cc.json) ? cc.json : null;
      if (!json) json = await fetchChart(x.code + '.JK', '1y');
      var q = json.chart.result[0].indicators.quote[0];
      var c = [], h = [], l = [];
      for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); }
      var n = c.length; if (n < 30) return false;
      if (x.cond === 'ma20') { var s = 0; for (var k = n - 20; k < n; k++) s += c[k]; var ma20 = s / 20; return Math.abs(price - ma20) / ma20 <= 0.012; }
      if (x.cond === 'adx') {
        var p = 14, pdm = [], mdm = [], tr = [];
        for (var j = 0; j < n; j++) {
          if (j === 0) { pdm.push(0); mdm.push(0); tr.push(h[j] - l[j]); continue; }
          var up = h[j] - h[j - 1], dn = l[j - 1] - l[j];
          pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0);
          tr.push(Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])));
        }
        var sm = function (arr) { var o = []; var e = null; for (var m = 0; m < arr.length; m++) { e = (e === null) ? arr[m] : (arr[m] + (p - 1) * e) / p; o.push(e); } return o; };
        var str = sm(tr), spd = sm(pdm), smd = sm(mdm);
        var adxLast = null;
        for (var z = p; z < n; z++) {
          var pdi = spd[z] / (str[z] || 1) * 100, mdi = smd[z] / (str[z] || 1) * 100;
          var dx = Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100;
          adxLast = (adxLast === null) ? dx : (dx + (p - 1) * adxLast) / p;
        }
        return adxLast != null && adxLast >= 20;
      }
      if (x.cond === 'donchian') { var hh = -Infinity; for (var dd = n - 21; dd < n - 1; dd++) if (h[dd] > hh) hh = h[dd]; return price >= hh; }
      return false;
    } catch (_) { return false; }
  }
  async function runSwingAlertCheck() {
    var a = swingAlerts(); var pending = a.filter(function (x) { return !x.done; });
    if (!pending.length) return;
    for (var i = 0; i < pending.length; i++) {
      if (await checkOne(pending[i])) {
        pending[i].done = true;
        toast('\uD83D\uDD14 ALERT SWING: ' + pending[i].code + ' — ' + condLabel(pending[i]) + ' TERPENUHI!');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      }
    }
    saveSwingAlerts(a); renderSwingAlerts();
  }
  renderSwingAlerts();
  setInterval(runSwingAlertCheck, 5 * 60 * 1000);
  setTimeout(runSwingAlertCheck, 8000);

  /* ================= 3) KURVA EKUITAS ANIMASI (Swing Lab) ================= */
  function smaEq(a, p) { var o = new Array(a.length).fill(null); var s = 0; for (var i = 0; i < a.length; i++) { s += a[i]; if (i >= p) s -= a[i - p]; if (i >= p - 1) o[i] = s / p; } return o; }
  function emaEq(a, p) { var o = new Array(a.length).fill(null); var k = 2 / (p + 1); var e = null; for (var i = 0; i < a.length; i++) { e = (e === null) ? a[i] : a[i] * k + e * (1 - k); if (i >= p - 1) o[i] = e; } return o; }
  function atrEq(h, l, c, p) { var tr = []; for (var i = 0; i < c.length; i++) tr.push(i === 0 ? h[i] - l[i] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))); return emaEq(tr, p); }
  function rsiEqLocal(a, p) {
    var o = new Array(a.length).fill(null); var g = 0, l = 0;
    for (var i = 1; i <= p; i++) { var d = a[i] - a[i - 1]; if (d >= 0) g += d; else l -= d; }
    g /= p; l /= p; o[p] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    for (var j = p + 1; j < a.length; j++) { var d2 = a[j] - a[j - 1]; g = (g * (p - 1) + Math.max(d2, 0)) / p; l = (l * (p - 1) + Math.max(-d2, 0)) / p; o[j] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
    return o;
  }
  function adxEq(h, l, c, p) {
    var n = c.length, pdm = new Array(n).fill(0), mdm = new Array(n).fill(0), tr = new Array(n).fill(0);
    for (var i = 1; i < n; i++) { var up = h[i] - h[i - 1], dn = l[i - 1] - l[i]; pdm[i] = (up > dn && up > 0) ? up : 0; mdm[i] = (dn > up && dn > 0) ? dn : 0; tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])); }
    var sm = function (arr) { var o = new Array(n).fill(null); var e = null; for (var m = 0; m < n; m++) { e = (e === null) ? arr[m] : (arr[m] + (p - 1) * e) / p; if (m >= p) o[m] = e; } return o; };
    var str = sm(tr), spd = sm(pdm), smd = sm(mdm), dx = [];
    for (var j = 0; j < n; j++) { if (str[j] == null || str[j] === 0) { dx.push(null); continue; } var pdi = spd[j] / str[j] * 100, mdi = smd[j] / str[j] * 100; dx.push(Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100); }
    var raw = sm(dx.map(function (v) { return v === null ? 0 : v; }));
    return raw.map(function (v, i2) { return dx[i2] === null ? null : v; });
  }
  function lowestLEq(l, a, b) { var m = Infinity; for (var i = a; i < b; i++) if (l[i] < m) m = l[i]; return m; }
  function highestHEq(h, a, b) { var m = -Infinity; for (var i = a; i < b; i++) if (h[i] > m) m = h[i]; return m; }
  function btPullbackEq(c, h, l, o, maxHold, tpMul) {
    var ma20 = smaEq(c, 20), ma50 = smaEq(c, 50), rsi = rsiEqLocal(c, 14), adx = adxEq(h, l, c, 14), atr = atrEq(h, l, c, 14);
    var trades = []; var pos = null;
    for (var i = 50; i < c.length - 1; i++) {
      if (!pos) {
        if (ma20[i] && ma50[i] && adx[i] && rsi[i] && atr[i] && c[i] > ma20[i] && ma20[i] > ma50[i] && adx[i] >= 20 && rsi[i] >= 40 && rsi[i] <= 65) {
          var dist = (c[i] - ma20[i]) / ma20[i] * 100;
          if (dist >= -1 && dist <= 3) pos = { entry: o[i + 1], ei: i + 1, sl: Math.min(lowestLEq(l, i - 9, i + 1) - atr[i] * 0.3, o[i + 1] - atr[i] * 1.2), atr: atr[i] };
        }
      } else {
        var held = i - pos.ei; var exit = null;
        if (l[i] <= pos.sl) exit = pos.sl;
        else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) exit = pos.entry + (pos.entry - pos.sl) * tpMul;
        else if (held >= maxHold) exit = o[i + 1] < c[i] ? o[i + 1] : c[i];
        if (exit != null) { trades.push((exit - pos.entry) / pos.entry - P.fee); pos = null; }
      }
    }
    return trades;
  }
  function btDonchianEq(c, h, l, o, maxHold, tpMul) {
    var ma50 = smaEq(c, 50), atr = atrEq(h, l, c, 14);
    var trades = []; var pos = null;
    for (var i = 21; i < c.length - 1; i++) {
      if (!pos) {
        var hh = highestHEq(h, i - 20, i);
        if (ma50[i] && atr[i] && c[i] > ma50[i] && c[i] >= hh * 0.999) pos = { entry: o[i + 1], ei: i + 1, sl: lowestLEq(l, i - 19, i + 1) - atr[i] * 0.3, atr: atr[i] };
      } else {
        var held = i - pos.ei; var exit = null;
        if (l[i] <= pos.sl) exit = pos.sl;
        else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) exit = pos.entry + (pos.entry - pos.sl) * tpMul;
        else if (held >= maxHold) exit = o[i + 1] < c[i] ? o[i + 1] : c[i];
        if (exit != null) { trades.push((exit - pos.entry) / pos.entry - P.fee); pos = null; }
      }
    }
    return trades;
  }
  async function getCandleEq(code) { var cc = loadCache(code); var j = (cc && cc.json) ? cc.json : null; if (!j) j = await fetchChart(code + '.JK', '2y'); return j.chart.result[0]; }
  function arraysEq(candle) { var q = candle.indicators.quote[0]; var c = [], h = [], l = [], o = []; for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null || q.open[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); o.push(q.open[i]); } return { c: c, h: h, l: l, o: o }; }

  function renderEquitySvg(pts, bhPts) {
    var all = pts.concat(bhPts || []);
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    var span = (max - min) || 1; var W = 300, H = 90, pad = 6;
    function X(i) { return pad + (i / ((pts.length - 1) || 1)) * (W - 2 * pad); }
    function Y(v) { return H - pad - ((v - min) / span) * (H - 2 * pad); }
    function line(arr, color, cls) {
      var d = '';
      for (var i = 0; i < arr.length; i++) d += (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ',' + Y(arr[i]).toFixed(1) + ' ';
      return '<path class="' + (cls || '') + '" d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    var zeroY = Y(0).toFixed(1);
    var last = pts[pts.length - 1];
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:90px;display:block;margin-top:8px;">';
    svg += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + zeroY + '" y2="' + zeroY + '" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="3 3"/>';
    if (bhPts) svg += line(bhPts, '#64748b', '');
    svg += line(pts, '#22c55e', 'eq-line');
    svg += '<text x="' + (W - pad) + '" y="' + (Y(last) - 3).toFixed(1) + '" fill="#22c55e" font-size="8" text-anchor="end">' + (last >= 0 ? '+' : '') + last.toFixed(1) + '%</text>';
    svg += '</svg>';
    svg += '<div style="display:flex;gap:12px;font-size:0.62rem;color:#64748b;margin-top:2px;"><span><span style="color:#22c55e;">━━</span> Ekuitas strategi</span>' + (bhPts ? '<span><span style="color:#64748b;">━━</span> Buy & Hold</span>' : '') + '</div>';
    return svg;
  }
  var swLabOut = document.getElementById('swLabOut');
  if (swLabOut) {
    var eqObs = new MutationObserver(function () {
      clearTimeout(eqObs._t);
      eqObs._t = setTimeout(async function () {
        if (swLabOut.innerText.indexOf('Jumlah Trade') < 0) return;
        if (swLabOut.querySelector('.eq-line')) return;
        try {
          var code = (document.getElementById('swCode').value || '').trim().toUpperCase() || window.lastTicker;
          var strat = document.getElementById('swStrat').value;
          var maxHold = parseInt(document.getElementById('swP1').value, 10) || (strat === 'donchian' ? 30 : 25);
          var tpMul = parseFloat(document.getElementById('swP2').value) || 2.5;
          var candle = await getCandleEq(code);
          var A = arraysEq(candle);
          var tr = (strat === 'donchian') ? btDonchianEq(A.c, A.h, A.l, A.o, maxHold, tpMul) : btPullbackEq(A.c, A.h, A.l, A.o, maxHold, tpMul);
          var pts = [0]; var cum = 0;
          tr.forEach(function (t) { cum += t * 100; pts.push(cum); });
          var bhPts = []; var step = Math.max(1, Math.floor(A.c.length / pts.length));
          for (var i = 0; i < pts.length; i++) { var idx = Math.min(A.c.length - 1, i * step); bhPts.push((A.c[idx] - A.c[0]) / A.c[0] * 100); }
          var wrap = document.createElement('div');
          wrap.innerHTML = '<div style="font-size:0.7rem;font-weight:800;color:#fff;margin-top:10px;">\uD83D\uDCC8 Kurva Ekuitas vs Buy & Hold</div>' + renderEquitySvg(pts, bhPts);
          swLabOut.appendChild(wrap);
        } catch (_) {}
      }, 500);
    });
    eqObs.observe(swLabOut, { childList: true, characterData: true, subtree: true });
  }

  /* ================= 4) FIX TICKER TAPE (perubahan harian) ================= */
  (function patchTicker() {
    var tickerWrap = document.querySelector('.ticker-wrap');
    if (!tickerWrap) { tickerWrap = document.createElement('div'); tickerWrap.className = 'ticker-wrap'; document.body.insertBefore(tickerWrap, document.body.firstChild); }
    var codes = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'ANTM', 'PTBA', 'GOTO', 'ADMR', 'NCKL'];
    function render(items) {
      if (!items.length) return;
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var cls = it.chg >= 0 ? 'ticker-up' : 'ticker-down';
        var arrow = it.chg >= 0 ? '▲' : '▼';
        html += '<span class="ticker-item"><span class="ticker-code">' + it.code + '</span><span class="ticker-price">Rp ' + Math.round(it.price).toLocaleString('id-ID') + '</span><span class="' + cls + '">' + arrow + ' ' + Math.abs(it.chg).toFixed(1) + '%</span></span>';
      }
      tickerWrap.innerHTML = '<div class="ticker-track"><span class="ticker-item"><span class="pulse-dot"></span>LIVE</span>' + html + html + '</div>';
      tickerWrap.classList.add('active');
      document.body.classList.add('has-ticker');
    }
    async function upd() {
      if (!marketOpenWIB()) { tickerWrap.classList.remove('active'); document.body.classList.remove('has-ticker'); return; }
      var items = [];
      var settled = await Promise.allSettled(codes.map(function (c) { return fetchChart(c + '.JK', '5d'); }));
      settled.forEach(function (res, i) {
        if (res.status !== 'fulfilled') return;
        var meta = res.value && res.value.chart && res.value.chart.result && res.value.chart.result[0] ? res.value.chart.result[0].meta : null;
        if (meta && meta.regularMarketPrice && meta.chartPreviousClose) {
          items.push({ code: codes[i], price: meta.regularMarketPrice, chg: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 });
        }
      });
      if (items.length) render(items);
    }
    upd(); setInterval(upd, 90000);
    var wraps = document.querySelectorAll('.ticker-wrap');
    for (var i = 1; i < wraps.length; i++) wraps[i].style.display = 'none';
  })();

  /* ================= CSS animasi kurva ================= */
  (function () {
    var st = document.createElement('style');
    st.textContent = '.eq-line{stroke-dasharray:1400;stroke-dashoffset:1400;animation:eqDraw 1.4s ease forwards;}@keyframes eqDraw{to{stroke-dashoffset:0;}}';
    document.head.appendChild(st);
  })();
})();
