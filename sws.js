/* swx.js - Swing Core 4/4 (Build v6.7): Mode Swing + Scaling + Alert + Jurnal + Ticker */
(function () {
  if (!window.P || !window.SW) return;
  var SW = window.SW;

  document.querySelectorAll('header strong').forEach(function (el) { el.innerText = 'Build v6.7'; });

  /* ===== Mode Swing satu-klik ===== */
  var headerEl = document.getElementById('appHeader') || document.querySelector('header');
  if (headerEl) {
    var btn = document.createElement('button');
    btn.id = 'swingModeBtn';
    btn.style.cssText = 'margin-left:6px;font-size:0.7rem;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.4);padding:5px 10px;border-radius:12px;font-weight:700;cursor:pointer;';
    btn.innerText = '🐢 Swing';
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
      b.innerText = on ? '🐢 Swing ON' : '🐢 Swing';
    }
    try {
      var strat = document.getElementById('swStrat');
      if (strat && on) { strat.value = 'pullback'; if (typeof window.swDefaults === 'function') window.swDefaults(); }
      var p1 = document.getElementById('swP1'); if (p1 && on) p1.value = 25;
      var p2 = document.getElementById('swP2'); if (p2 && on) p2.value = '2.5';
      var scRisk = document.getElementById('scRisk'); if (scRisk && on) scRisk.value = '1.5';
      var scSplit = document.getElementById('scSplit'); if (scSplit && on) scSplit.value = '50/30/20';
    } catch (ex) {}
    toast(on ? '🐢 Mode Swing AKTIF - preset diselaraskan (hold 7-25 hari, scale-out 50/30/20).' : '🐢 Mode Swing non-aktif.');
  }
  function toggleSwingMode() {
    var on = localStorage.getItem('ihsg_swingmode') !== '1';
    localStorage.setItem('ihsg_swingmode', on ? '1' : '0');
    applySwingMode(on);
  }
  setTimeout(function () { applySwingMode(localStorage.getItem('ihsg_swingmode') === '1'); }, 600);

  /* ===== Alert Kondisi Swing ===== */
  var alertHTML = '<div class="card-title"><span>🔔 Alert Kondisi Swing</span><span class="agent-pill tech">Cek Tiap 5 Menit</span></div>';
  alertHTML += '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">Alert ketika kondisi swing terpenuhi: sentuh MA20, ADX tembus 20, atau breakout Donchian 20h. Dicek otomatis tiap 5 menit.</div>';
  alertHTML += '<div class="metric-grid" style="margin-bottom:8px;">';
  alertHTML += '<div class="metric-box"><div class="metric-label">Kode Saham</div><input type="text" id="alCode" class="fv-input" placeholder="contoh: TLKM" maxlength="6"></div>';
  alertHTML += '<div class="metric-box"><div class="metric-label">Kondisi</div><select id="alCond" class="fv-input"><option value="ma20">Harga sentuh MA20</option><option value="adx">ADX tembus 20</option><option value="donchian">Breakout Donchian 20h</option><option value="price">Target harga (manual)</option></select></div>';
  alertHTML += '</div>';
  alertHTML += '<div class="metric-grid" style="margin-bottom:8px;">';
  alertHTML += '<div class="metric-box"><div class="metric-label">Target Harga</div><input type="text" inputmode="decimal" id="alPrice" class="fv-input" placeholder="opsional"></div>';
  alertHTML += '<div class="metric-box" style="display:flex;align-items:flex-end;"><button class="btn-copy" style="margin-top:0;" onclick="addSwingAlert()">🔔 Tambah Alert Swing</button></div>';
  alertHTML += '</div>';
  alertHTML += '<div id="alList"></div>';
  alertHTML += '<div class="src-note">Alert tersimpan lokal & dicek selama aplikasi terbuka (banner + getar).</div>';
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
      if (!p) { alert('Isi target harga.'); return; }
      entry.price = p; entry.dir = 'above';
    }
    a.push(entry); saveSwingAlerts(a); renderSwingAlerts();
    toast('🔔 Alert swing: ' + code + ' - ' + condLabel(entry));
  };
  window.removeSwingAlert = function (i) { var a = swingAlerts(); a.splice(i, 1); saveSwingAlerts(a); renderSwingAlerts(); };

  async function checkOne(x) {
    try {
      var f = await tvSnapshot(x.code);
      if (!f || !hasVal(f.price)) return false;
      var price = f.price;
      if (x.cond === 'price') return (x.dir === 'above' ? price >= x.price : price <= x.price);
      var cc = loadCache(x.code);
      var json = (cc && cc.json) ? cc.json : null;
      if (!json) json = await fetchChart(x.code + '.JK', '1y');
      var q = json.chart.result[0].indicators.quote[0];
      var c = [], h = [], l = [];
      for (var i = 0; i < q.close.length; i++) { if (q.close[i] == null) continue; c.push(q.close[i]); h.push(q.high[i]); l.push(q.low[i]); }
      var n = c.length; if (n < 30) return false;
      if (x.cond === 'ma20') {
        var s = 0; for (var k = n - 20; k < n; k++) s += c[k]; var ma20 = s / 20;
        return Math.abs(price - ma20) / ma20 <= 0.012;
      }
      if (x.cond === 'adx') {
        var p = 14; var pdm = [], mdm = [], tr = [];
        for (var j = 0; j < n; j++) {
          if (j === 0) { pdm.push(0); mdm.push(0); tr.push(h[j] - l[j]); continue; }
          var up = h[j] - h[j - 1]; var dn = l[j - 1] - l[j];
          pdm.push((up > dn && up > 0) ? up : 0);
          mdm.push((dn > up && dn > 0) ? dn : 0);
          tr.push(Math.max(h[j] - l[j], Math.abs(h[j] - c[j - 1]), Math.abs(l[j] - c[j - 1])));
        }
        function sm(arr) { var o = []; var e = null; for (var m = 0; m < arr.length; m++) { e = (e === null) ? arr[m] : (arr[m] + (p - 1) * e) / p; o.push(e); } return o; }
        var str = sm(tr); var spd = sm(pdm); var smd = sm(mdm);
        var adxLast = null;
        for (var z = p; z < n; z++) {
          var pdi = spd[z] / (str[z] || 1) * 100; var mdi = smd[z] / (str[z] || 1) * 100;
          var dx = Math.abs(pdi - mdi) / ((pdi + mdi) || 1) * 100;
          adxLast = (adxLast === null) ? dx : (dx + (p - 1) * adxLast) / p;
        }
        return adxLast != null && adxLast >= 20;
      }
      if (x.cond === 'donchian') {
        var hh = -Infinity; for (var dd = n - 21; dd < n - 1; dd++) if (h[dd] > hh) hh = h[dd];
        return price >= hh;
      }
      return false;
    } catch (ex) { return false; }
  }
  async function runSwingAlertCheck() {
    var a = swingAlerts(); var pending = [];
    for (var i = 0; i < a.length; i++) if (!a[i].done) pending.push(a[i]);
    if (!pending.length) return;
    for (var j = 0; j < pending.length; j++) {
      if (await checkOne(pending[j])) {
        pending[j].done = true;
        toast('🔔 ALERT SWING: ' + pending[j].code + ' - ' + condLabel(pending[j]) + ' TERPENUHI!');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      }
    }
    saveSwingAlerts(a); renderSwingAlerts();
  }
  renderSwingAlerts();
  setInterval(runSwingAlertCheck, 300000);
  setTimeout(runSwingAlertCheck, 8000);

  /* ===== Kalkulator Scaling ===== */
  (function injectScaling() {
    var det = null;
    var all = document.querySelectorAll('details.agent-detail');
    for (var i = 0; i < all.length; i++) {
      if (/Kalkulator Ukuran Posisi/.test(all[i].textContent)) { det = all[i]; break; }
    }
    if (!det) return;
    var wrap = document.createElement('div'); wrap.style.marginTop = '10px';
    var html = '<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:6px;">🧮 Mode Scaling (Swing)</div>';
    html += '<div class="metric-grid" style="margin-bottom:8px;">';
    html += '<div class="metric-box"><div class="metric-label">Risiko Total Modal (%)</div><input type="text" inputmode="decimal" class="fv-input" id="scRisk" value="1.5"></div>';
    html += '<div class="metric-box"><div class="metric-label">Tahap 1 / 2 / 3 (%)</div><input type="text" inputmode="text" class="fv-input" id="scSplit" value="50/30/20"></div>';
    html += '</div>';
    html += '<button class="btn-copy" style="margin-top:0;" onclick="calcScaling()">🧮 Hitung Scaling Position</button>';
    html += '<div id="scOut" class="report-card hidden" style="margin-top:8px;"></div>';
    wrap.innerHTML = html;
    det.appendChild(wrap);
  })();

  window.calcScaling = function () {
    var capEl = document.getElementById('pcCap');
    var entryEl = document.getElementById('pcEntry');
    var slEl = document.getElementById('pcSl');
    var cap = capEl ? parseNumID(capEl.value) : 0;
    var entry = entryEl ? parseNumID(entryEl.value) : 0;
    var sl = slEl ? parseNumID(slEl.value) : 0;
    var riskEl = document.getElementById('scRisk');
    var riskPct = riskEl ? parseNumID(riskEl.value) : 0;
    var splitEl = document.getElementById('scSplit');
    var splitTxt = splitEl ? (splitEl.value || '50/30/20') : '50/30/20';
    var split = splitTxt.split('/').map(function (x) { return parseFloat(x); });
    var out = document.getElementById('scOut'); out.classList.remove('hidden');
    var sumPct = 0;
    for (var si = 0; si < split.length; si++) sumPct += (split[si] || 0);
    if (!cap || !entry || !sl || !riskPct || entry <= sl || sumPct <= 0) {
      out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Isi Modal, Entry, Stop Loss di atas + Risiko % dan tahap (50/30/20). Entry harus &gt; SL.</div>';
      return;
    }
    var riskBudget = cap * riskPct / 100;
    var riskPerShare = entry - sl;
    var totalShares = Math.floor(riskBudget / riskPerShare / 100) * 100;
    var labels = ['T1 (entry)', 'T2 (add-on)', 'T3 (runner)'];
    var stages = [];
    for (var i = 0; i < split.length; i++) {
      var sh = Math.floor(totalShares * (split[i] || 0) / sumPct / 100) * 100;
      stages.push({ pct: split[i] || 0, shares: sh, lot: sh / 100, label: labels[i] || ('Tahap ' + (i + 1)) });
    }
    var be = entry + riskPerShare * 0.5;
    var trail = entry + riskPerShare * 1.5;
    var h = '<div class="metric-grid">';
    h += '<div class="metric-box"><div class="metric-label">Total Posisi</div><div class="metric-value green">' + totalShares.toLocaleString('id-ID') + ' lembar (' + (totalShares / 100) + ' lot)</div></div>';
    h += '<div class="metric-box"><div class="metric-label">Risiko Riil (ke SL)</div><div class="metric-value red">' + rp(totalShares * riskPerShare) + ' (' + riskPct + '%)</div></div>';
    h += '</div>';
    h += '<div style="margin-top:8px;font-size:0.78rem;line-height:1.7;">';
    for (var k = 0; k < stages.length; k++) {
      if (stages[k].shares > 0) h += '<div class="rp-line">• <strong>' + stages[k].label + '</strong> ' + stages[k].pct + '% → ' + stages[k].lot + ' lot @ ≤ ' + rp(entry) + '</div>';
    }
    h += '<div class="rp-line">• Setelah T1 tembus: geser SL sisa ke break-even ≈ ' + rp(be) + '</div>';
    h += '<div class="rp-line">• Trail runner di ' + rp(trail) + ' atau 1,5xATR di bawah highest high</div>';
    h += '</div>';
    h += '<div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Risiko dikunci di awal; add-on hanya bila trade terbukti benar (di atas break-even).</div>';
    out.innerHTML = h; sweep(out);
  };

  /* ===== Jurnal ber-tag per setup ===== */
  var SETUPS = ['pullback', 'donchian', 'breakout', 'reversal', 'bsjp', 'lainnya'];
  var journalListEl = document.getElementById('journalList');
  if (journalListEl) {
    var ctrl = document.createElement('div'); ctrl.style.marginBottom = '10px';
    var btns = '';
    for (var bi = 0; bi < SETUPS.length; bi++) btns += '<button class="btn-mini" onclick="tagLatest(\'' + SETUPS[bi] + '\')">' + SETUPS[bi] + '</button>';
    var html = '<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:6px;">🏷️ Tag Setup Entri Terbaru</div>';
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">' + btns + '</div>';
    html += '<button class="btn-copy" style="margin-top:0;" onclick="renderSetupStats()">📊 Statistik Win-Rate per Setup</button>';
    html += '<div id="setupStats" class="hidden" style="margin-top:10px;"></div>';
    ctrl.innerHTML = html;
    journalListEl.parentElement.insertBefore(ctrl, journalListEl);
  }
  window.tagLatest = function (setup) {
    if (!journal.length) { alert('Belum ada entri jurnal. Proses/analisis saham dulu.'); return; }
    journal[0].setup = setup; saveLS('ihsg_journal', journal); renderJournal();
    toast('🏷️ Entri terbaru di-tag: ' + setup);
  };
  async function enrichWithOutcome() {
    var cand = [];
    for (var ci = 0; ci < journal.length; ci++) {
      var e = journal[ci];
      if (e.p && (Date.now() - e.d) > 2 * 86400000 && e.outcome == null) cand.push(e);
    }
    var tickers = []; var seen = {};
    for (var ti = 0; ti < cand.length && tickers.length < 12; ti++) {
      if (!seen[cand[ti].t]) { seen[cand[ti].t] = 1; tickers.push(cand[ti].t); }
    }
    var cur = {};
    for (var tj = 0; tj < tickers.length; tj++) {
      var cached = cachePrice(tickers[tj]);
      if (cached) { cur[tickers[tj]] = cached; continue; }
      try {
        var sn = await tvSnapshot(tickers[tj]);
        cur[tickers[tj]] = (sn && sn.price) ? sn.price : null;
      } catch (ex) { cur[tickers[tj]] = null; }
    }
    var changed = false;
    for (var ji = 0; ji < journal.length; ji++) {
      var j = journal[ji];
      if (j.p && (Date.now() - j.d) > 2 * 86400000 && j.outcome == null && cur[j.t]) {
        j.outcome = (cur[j.t] - j.p) / j.p * 100; changed = true;
      }
    }
    if (changed) saveLS('ihsg_journal', journal);
  }
  window.renderSetupStats = async function () {
    var box = document.getElementById('setupStats'); box.classList.remove('hidden');
    box.innerHTML = '<div class="skel-box" style="height:60px"></div>';
    try {
      await enrichWithOutcome();
      var groups = {};
      for (var gi = 0; gi < journal.length; gi++) {
        var e = journal[gi];
        if (e.outcome == null) continue;
        var key = e.setup || 'tanpa-tag';
        if (!groups[key]) groups[key] = [];
        groups[key].push(e.outcome);
      }
      var keys = Object.keys(groups);
      if (!keys.length) { box.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Belum ada entri berusia &gt;=2 hari dengan outcome. Tag beberapa entri (🏷️) dan tunggu 2 hari.</div>'; return; }
      var rows = [];
      for (var ki = 0; ki < keys.length; ki++) {
        var arr = groups[keys[ki]]; var n = arr.length; var winCount = 0; var sum = 0;
        for (var ai = 0; ai < arr.length; ai++) { if (arr[ai] > 0) winCount++; sum += arr[ai]; }
        rows.push({ k: keys[ki], n: n, wr: winCount / n * 100, avg: sum / n });
      }
      rows.sort(function (a, b) { return b.avg - a.avg; });
      var h = '<div style="font-size:0.72rem;font-weight:800;color:#fff;margin-bottom:6px;">Performa per Jenis Setup (outcome riil)</div>';
      for (var ri = 0; ri < rows.length; ri++) {
        var r = rows[ri];
        h += '<div class="mkt-row"><span><strong>' + r.k + '</strong> <span style="color:var(--text-muted);font-size:0.68rem;">' + r.n + ' entri</span></span>';
        h += '<span style="text-align:right;font-family:var(--mono);"><span class="' + (r.wr >= 50 ? 'green' : 'red') + '" style="font-weight:700;">WR ' + r.wr.toFixed(0) + '%</span> • <span class="' + (r.avg >= 0 ? 'green' : 'red') + '" style="font-weight:700;">' + (r.avg >= 0 ? '+' : '') + r.avg.toFixed(2) + '%</span></span></div>';
      }
      h += '<div class="src-note">Cermin keputusan ANDA: setup mana paling cuan di tangan Anda. Fokuskan yang expectancy positif. Sampel &lt;5 baca hati-hati.</div>';
      box.innerHTML = h;
    } catch (ex) { box.innerHTML = '<div style="color:var(--red);">Statistik gagal: ' + esc(ex.message) + '</div>'; }
  };

  /* ===== Fix Ticker Tape (perubahan harian) ===== */
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
        if (meta && meta.regularMarketPrice && meta.chartPreviousClose) items.push({ code: codes[i], price: meta.regularMarketPrice, chg: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 });
      });
      if (items.length) render(items);
    }
    upd(); setInterval(upd, 90000);
    var wraps = document.querySelectorAll('.ticker-wrap');
    for (var i = 1; i < wraps.length; i++) wraps[i].style.display = 'none';
  })();
})();
/* END swx v1 */
