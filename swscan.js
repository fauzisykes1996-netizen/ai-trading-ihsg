/* swscan.js - Swing Core 2/4 (Build v6.7): Swing Setup Scanner + Kartu Swing Plan */
(function () {
  if (!window.P || !window.SW) return;
  var SW = window.SW;

  (function () {
    var st = document.createElement('style');
    st.textContent = '@media print{body.printsw *{visibility:hidden}body.printsw #swPlan,body.printsw #swPlan *{visibility:visible}body.printsw #swPlan{position:absolute;left:0;top:0;width:100%;background:#fff;color:#000;border:none}body.printsw #planCard,body.printsw #planCard *{visibility:hidden}}';
    document.head.appendChild(st);
  })();

  var UNIV = [].concat(typeof SCR_UNIVERSE !== 'undefined' ? SCR_UNIVERSE : []).concat(["AKRA","ARTO","BBTN","BDMS","BRPT","BUKA","DEWA","DOID","EMTK","ESSA","EXCL","GGRM","HRUM","INCO","INDY","IRRA","ISSP","JSMR","KIJA","MAPI","MEDC","MIDI","MYOR","PGEO","PNLF","PPRE","PTPP","RAJA","SCMA","SIDO","SMGR","SRTG","TINS","TKIM","TPIA","WIKA","WSKT","ZINC","BGTG","PNBN","CMRY","AMMN","CUAN"]);
  UNIV = UNIV.filter(function (v, i, self) { return self.indexOf(v) === i; });

  var scrCard = document.getElementById('scrBtn') ? document.getElementById('scrBtn').closest('.card') : null;
  P.card('tab-market',
    '<div class="card-title"><span>\uD83C\uDF0A Swing Setup Scanner</span><span class="agent-pill tech">Buy-on-Dip dalam Tren</span></div>' +
    '<button class="btn-copy" style="margin-top:0;" id="swScanBtn" onclick="runSwingScan()">\uD83C\uDF0A Scan Setup Swing</button>' +
    '<div id="swScanNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Filter: harga &gt; MA20 &gt; MA50 \u2022 ADX &gt;= 20 \u2022 RSI 40-65 \u2022 pullback dekat MA20 \u2022 likuid &gt;= Rp10M. Kandidat + skor Multi-TF.</div>' +
    '<div id="swScanResult" class="hidden" style="margin-top:10px;"></div>',
    scrCard);

  function noteScan(t) { var e = document.getElementById('swScanNote'); if (e) e.innerText = t; }

  window.runSwingScan = async function () {
    var btn = document.getElementById('swScanBtn'); btn.disabled = true; btn.innerText = 'Scanning swing...';
    var out = document.getElementById('swScanResult'); out.classList.remove('hidden'); out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      var cache = lsJSON('swscan_cache', null);
      if (cache && cache.t && Date.now() - cache.t < 600000) { renderScan(cache.rows); noteScan('Cache ' + new Date(cache.t).toLocaleTimeString('id-ID') + ' (10 menit).'); return; }
      var settled = await Promise.allSettled(UNIV.map(function (c) { return SW.candle(c, '1y'); }));
      var rows = [];
      settled.forEach(function (res, i) {
        if (res.status !== 'fulfilled') return;
        var candle = res.value; var code = UNIV[i];
        var A = SW.arrays(candle); var n = A.c.length; if (n < 60) return;
        var q = candle.indicators.quote[0];
        var vol = []; if (q.volume) { for (var vi = 0; vi < q.volume.length; vi++) { if (q.volume[vi] != null) vol.push(q.volume[vi]); } }
        var volLast = vol.length ? vol[vol.length - 1] : 0;
        var volAvg = 0; if (vol.length >= 20) { var vs = 0; for (var vk = vol.length - 20; vk < vol.length; vk++) vs += vol[vk]; volAvg = vs / 20; }
        var ma20 = SW.sma(A.c, 20), ma50 = SW.sma(A.c, 50), rsi = SW.rsi(A.c, 14), adx = SW.adx(A.h, A.l, A.c, 14), atr = SW.atr(A.h, A.l, A.c, 14);
        var last = n - 1; var price = A.c[last];
        var m20 = ma20[last], m50 = ma50[last], r = rsi[last], ax = adx[last], at = atr[last];
        if (m20 == null || m50 == null || r == null || ax == null || at == null) return;
        if (!(price > m20 && m20 > m50)) return;
        if (ax < 20) return;
        if (r < 40 || r > 65) return;
        var dist = (price - m20) / m20 * 100;
        if (dist < -1 || dist > 3) return;
        if (volLast * price < 10e9) return;
        var volDry = volAvg > 0 ? volLast / volAvg : 1;
        var s = 0;
        s += ax >= 30 ? 3 : (ax >= 25 ? 2 : 1);
        s += (dist >= -0.5 && dist <= 1.5) ? 2 : 1;
        s += (r >= 45 && r <= 58) ? 2 : 1;
        s += volDry < 0.9 ? 1 : 0;
        rows.push({ code: code, price: price, chg: ((price - A.c[last - 1]) / A.c[last - 1]) * 100, adx: ax, rsi: r, dist: dist, atrpct: at / price * 100, score: s, candle: candle });
      });
      var top = rows.sort(function (a, b) { return b.score - a.score; }).slice(0, 10);
      var wks = await Promise.allSettled(top.map(function (rr) { return fetchChart(rr.code + '.JK', '1y', '1wk').then(function (j) { return j.chart.result[0]; }); }));
      top.forEach(function (rr, i) { rr.mtf = wks[i].status === 'fulfilled' ? SW.tfScore(rr.candle, wks[i].value) : null; });
      saveLS('swscan_cache', { t: Date.now(), rows: top });
      renderScan(top);
      noteScan('Diperbarui ' + new Date().toLocaleTimeString('id-ID') + ' \u2022 ' + top.length + ' setup swing \u2022 ketuk baris untuk rencana.');
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Scan swing gagal: ' + esc(e.message) + '</div>'; }
    finally { btn.disabled = false; btn.innerText = '\uD83C\uDF0A Scan Setup Swing'; }
  };

  function renderScan(rows) {
    var out = document.getElementById('swScanResult'); if (!out) return;
    window.__swRows = rows;
    if (!rows.length) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada setup swing yang lolos filter saat ini. Disiplin menunggu = keunggulan swing trader.</div>'; return; }
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var badge = r.score >= 7 ? '\uD83D\uDD25' : (r.score >= 5 ? '\uD83D\uDC4D' : '\u2022');
      var mtfSpan = r.mtf != null ? ' <span class="' + (r.mtf >= 70 ? 'green' : (r.mtf >= 45 ? 'yellow' : 'red')) + '">\u2022 MTF ' + r.mtf + '</span>' : '';
      html += '<div class="mkt-row" style="cursor:pointer;" onclick="swingPlanFromScan(' + i + ')">';
      html += '<span><strong>' + r.code + '</strong> <span style="color:var(--text-muted);font-size:0.68rem;">' + badge + ' skor ' + r.score + mtfSpan + '</span><br>';
      html += '<span style="font-size:0.66rem;color:#64748b;font-family:var(--mono);">ADX ' + r.adx.toFixed(0) + ' \u2022 RSI ' + r.rsi.toFixed(0) + ' \u2022 dist MA20 ' + (r.dist >= 0 ? '+' : '') + r.dist.toFixed(1) + '% \u2022 ATR ' + r.atrpct.toFixed(1) + '%</span></span>';
      html += '<span style="text-align:right;"><span style="font-weight:700;font-family:var(--mono);">' + Math.round(r.price).toLocaleString('id-ID') + '</span><br>';
      html += '<span class="' + (r.chg >= 0 ? 'green' : 'red') + '" style="font-size:0.7rem;font-weight:700;font-family:var(--mono);">' + (r.chg >= 0 ? '+' : '') + r.chg.toFixed(2) + '%</span></span></div>';
    }
    html += '<div class="src-note">Setup = kandidat buy-on-dip dalam tren. Konfirmasi lewat Kartu Swing Plan & manajemen risiko Anda.</div>';
    out.innerHTML = html;
  }

  var riskCard = document.getElementById('rRr') ? document.getElementById('rRr').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>\uD83E\uDDFE Kartu Swing Plan</span><span class="agent-pill master">Scale-Out</span></div>' +
    '<div id="swPlan" class="report-card" style="margin-top:0;"><div style="color:var(--text-muted);font-size:0.78rem;">Proses saham atau ketuk baris Swing Scanner - rencana bertahap (T1/T2/T3 + trailing) terisi otomatis & siap cetak.</div></div>' +
    '<button class="btn-copy" onclick="printSwPlan()">\uD83D\uDDA8 Cetak / Simpan PDF</button>' +
    '<button class="btn-copy" onclick="copySwPlan()">\uD83D\uDCCB Salin Plan</button>',
    riskCard);

  window.printSwPlan = function () {
    document.body.classList.add('printsw');
    window.print();
    setTimeout(function () { document.body.classList.remove('printsw'); }, 800);
  };
  window.copySwPlan = function () { var b = document.getElementById('swPlan'); if (b) navigator.clipboard.writeText(b.innerText).then(function () { alert('Swing Plan disalin!'); }).catch(function () { alert('Gagal menyalin.'); }); };

  SW.planFromMetrics = function (code, candle, mtf, setup) {
    var A = SW.arrays(candle); var n = A.c.length; var price = A.c[n - 1];
    var ma20 = SW.sma(A.c, 20)[n - 1];
    var atr = SW.atr(A.h, A.l, A.c, 14)[n - 1] || price * 0.03;
    var swLow = SW.lowest(A.l, n - 10, n);
    var sl = Math.min(swLow - atr * 0.3, price - atr * 1.2);
    var risk = price - sl;
    var t1 = price + risk * 1.5, t2 = price + risk * 2.5, t3 = price + risk * 4;
    var rr = risk > 0 ? (t2 - price) / risk : 0;
    var thesis = setup === 'donchian' ? 'Breakout Donchian 20-hari - momentum lanjutan tren.' : 'Pullback ke MA20 dalam tren naik (ADX kuat) - masuk searah arus saat koreksi sehat.';
    return { code: code, date: new Date().toLocaleString('id-ID'), setup: setup === 'donchian' ? 'Donchian Breakout 20h' : 'Pullback-to-MA20', mtf: mtf, atrpct: (atr / price * 100).toFixed(1), thesis: thesis, entry: price, zoneLo: Math.round(price * 0.99), zoneHi: Math.round(Math.min(price * 1.01, ma20 * 1.01)), sl: sl, slNote: 'di bawah swing low - 0,3xATR', t1: t1, t2: t2, t3: t3, atr: atr, hold: setup === 'donchian' ? '10-25' : '7-20', rr: rr, lot: 1 };
  };

  function buildSwPlan(p) {
    var lotTotal = p.lot || 1;
    var l1 = Math.max(1, Math.round(lotTotal * 0.5));
    var l3 = Math.max(1, Math.round(lotTotal * 0.2));
    var l2 = Math.max(0, lotTotal - l1 - l3);
    var be = p.entry + (p.entry - p.sl) * 0.5;
    var h = '';
    h += '<div style="font-weight:800;color:#fff;font-size:0.95rem;">SWING PLAN - ' + p.code + '.JK</div>';
    h += '<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:8px;">' + p.date + ' \u2022 Setup: ' + p.setup + ' \u2022 Multi-TF ' + (p.mtf != null ? p.mtf + '/100' : '-') + ' \u2022 ATR ' + p.atrpct + '%</div>';
    h += '<div class="rp-line">\u2022 TESIS: ' + p.thesis + '</div>';
    h += '<div class="rp-line">\u2022 ENTRY: zona ' + rp(p.zoneLo) + ' - ' + rp(p.zoneHi) + ' (pullback ke nilai dalam tren)</div>';
    h += '<div class="rp-line">\u2022 STOP LOSS: ' + rp(p.sl) + ' (' + p.slNote + ') - invalidasi tesis, keluar tanpa negosiasi</div>';
    h += '<div class="rp-line">\u2022 TARGET BERTAHAP: T1 ' + rp(p.t1) + ' (jual 50%, ~' + l1 + ' lot) \u2022 T2 ' + rp(p.t2) + ' (jual 30%, ~' + l2 + ' lot) \u2022 T3 ' + rp(p.t3) + ' (20% runner, ~' + l3 + ' lot)</div>';
    h += '<div class="rp-line">\u2022 TRAILING: setelah T1 tembus, geser SL ke break-even ~ ' + rp(be) + '; lalu trail 1,5xATR (' + rp(p.atr * 1.5) + ') di bawah highest high</div>';
    h += '<div class="rp-line">\u2022 HOLD: estimasi ' + p.hold + ' hari \u2022 R/R ke T2 ~ 1:' + p.rr.toFixed(1) + '</div>';
    h += '<div class="rp-line">\u2022 RISIKO: maks 1-2% modal pada risiko awal (entry ke SL)</div>';
    h += '<div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Rencana disiplin, bukan prediksi. Tesis bisa salah - yang dijaga adalah ukuran kerugian per trade.</div>';
    return h;
  }
  function fillSwPlan(p) { var box = document.getElementById('swPlan'); if (box) { box.innerHTML = buildSwPlan(p); sweep(box); } }
  window.swingPlanFromScan = function (i) {
    var r = (window.__swRows || [])[i]; if (!r) return;
    switchTab('analysis');
    setTimeout(function () { fillSwPlan(SW.planFromMetrics(r.code, r.candle, r.mtf, 'pullback')); }, 350);
  };

  var planObs = new MutationObserver(function () {
    clearTimeout(planObs._t);
    planObs._t = setTimeout(async function () {
      var code = window.lastTicker; if (!code) return;
      try {
        var dC = await SW.candle(code, '1y'); var wC = null;
        try { var wj = await fetchChart(code + '.JK', '1y', '1wk'); wC = wj.chart.result[0]; } catch (e2) { wC = null; }
        fillSwPlan(SW.planFromMetrics(code, dC, wC ? SW.tfScore(dC, wC) : null, 'pullback'));
      } catch (e3) {}
    }, 900);
  });
  var trendEl = document.getElementById('valTrend');
  if (trendEl) planObs.observe(trendEl, { childList: true, characterData: true, subtree: true });
})();
/* END swscan v1 */
