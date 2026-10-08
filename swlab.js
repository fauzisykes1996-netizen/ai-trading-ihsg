/* swlab.js - Swing Core 3/4 (Build v6.7): Swing Lab backtest 2 tahun + kurva ekuitas */
(function () {
  if (!window.P || !window.SW) return;
  var SW = window.SW;

  (function () {
    var st = document.createElement('style');
    st.textContent = '.eq-line{stroke-dasharray:1400;stroke-dashoffset:1400;animation:eqDraw 1.4s ease forwards;}@keyframes eqDraw{to{stroke-dashoffset:0;}}';
    document.head.appendChild(st);
  })();

  var labCard = document.getElementById('qbBtn') ? document.getElementById('qbBtn').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>🌊 Swing Lab</span><span class="agent-pill tech">Backtest Lokal 2 Tahun</span></div>' +
    '<div class="metric-grid" style="margin-bottom:8px;">' +
    '<div class="metric-box"><div class="metric-label">Kode (kosong=terakhir)</div><input type="text" id="swCode" class="fv-input" placeholder="auto"></div>' +
    '<div class="metric-box"><div class="metric-label">Strategi</div><select id="swStrat" class="fv-input" onchange="swDefaults()"><option value="pullback">Pullback-to-MA20</option><option value="donchian">Donchian Breakout 20h</option></select></div>' +
    '<div class="metric-box"><div class="metric-label">Max Hold (hari)</div><input type="text" id="swP1" class="fv-input" inputmode="numeric" value="25"></div>' +
    '<div class="metric-box"><div class="metric-label">TP (x risiko)</div><input type="text" id="swP2" class="fv-input" inputmode="decimal" value="2.5"></div>' +
    '</div>' +
    '<button class="btn-copy" style="margin-top:0;" id="swLabBtn" onclick="runSwingLab()">🌊 Jalankan Swing Backtest</button>' +
    '<div id="swLabOut" class="report-card hidden"></div>' +
    '<div class="src-note">Entry/exit di harga OPEN hari berikut; SL = swing low - 0,3xATR; biaya round-trip +/-0,5% dipotong. Profit Factor & Expectancy = ukuran edge sesungguhnya (bukan win rate kosmetik).</div>',
    labCard);

  window.swDefaults = function () {
    var s = document.getElementById('swStrat').value;
    document.getElementById('swP1').value = s === 'donchian' ? 30 : 25;
    document.getElementById('swP2').value = '2.5';
  };

  function btPullback(c, h, l, o, maxHold, tpMul) {
    var ma20 = SW.sma(c, 20), ma50 = SW.sma(c, 50), rsi = SW.rsi(c, 14), adx = SW.adx(h, l, c, 14), atr = SW.atr(h, l, c, 14);
    var trades = []; var pos = null;
    for (var i = 50; i < c.length - 1; i++) {
      if (!pos) {
        if (ma20[i] && ma50[i] && adx[i] && rsi[i] && atr[i] && c[i] > ma20[i] && ma20[i] > ma50[i] && adx[i] >= 20 && rsi[i] >= 40 && rsi[i] <= 65) {
          var dist = (c[i] - ma20[i]) / ma20[i] * 100;
          if (dist >= -1 && dist <= 3) pos = { entry: o[i + 1], ei: i + 1, sl: Math.min(SW.lowest(l, i - 9, i + 1) - atr[i] * 0.3, o[i + 1] - atr[i] * 1.2) };
        }
      } else {
        var held = i - pos.ei; var exit = null;
        if (l[i] <= pos.sl) { exit = pos.sl; }
        else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) { exit = pos.entry + (pos.entry - pos.sl) * tpMul; }
        else if (held >= maxHold) { exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; }
        if (exit != null) { trades.push((exit - pos.entry) / pos.entry - P.fee); pos = null; }
      }
    }
    return trades;
  }
  function btDonchian(c, h, l, o, maxHold, tpMul) {
    var ma50 = SW.sma(c, 50), atr = SW.atr(h, l, c, 14);
    var trades = []; var pos = null;
    for (var i = 21; i < c.length - 1; i++) {
      if (!pos) {
        var hh = SW.highest(h, i - 20, i);
        if (ma50[i] && atr[i] && c[i] > ma50[i] && c[i] >= hh * 0.999) pos = { entry: o[i + 1], ei: i + 1, sl: SW.lowest(l, i - 19, i + 1) - atr[i] * 0.3 };
      } else {
        var held = i - pos.ei; var exit = null;
        if (l[i] <= pos.sl) { exit = pos.sl; }
        else if (h[i] >= pos.entry + (pos.entry - pos.sl) * tpMul) { exit = pos.entry + (pos.entry - pos.sl) * tpMul; }
        else if (held >= maxHold) { exit = o[i + 1] < c[i] ? o[i + 1] : c[i]; }
        if (exit != null) { trades.push((exit - pos.entry) / pos.entry - P.fee); pos = null; }
      }
    }
    return trades;
  }

  function stats(tr) {
    if (!tr.length) return null;
    var n = tr.length; var wins = []; var losses = [];
    for (var i = 0; i < n; i++) { if (tr[i] > 0) wins.push(tr[i]); else losses.push(tr[i]); }
    var wr = wins.length / n * 100;
    var avgW = wins.length ? wins.reduce(function (a, b) { return a + b; }, 0) / wins.length : 0;
    var avgL = losses.length ? losses.reduce(function (a, b) { return a + b; }, 0) / losses.length : 0;
    var grossW = wins.reduce(function (a, b) { return a + b; }, 0);
    var grossL = Math.abs(losses.reduce(function (a, b) { return a + b; }, 0));
    var pf = grossL > 0 ? grossW / grossL : (grossW > 0 ? 99 : 0);
    var expectancy = (avgW * wr / 100) + (avgL * (100 - wr) / 100);
    var cum = 0, peak = 0, mdd = 0;
    for (var j = 0; j < n; j++) { cum += tr[j] * 100; if (cum > peak) peak = cum; var dd = cum - peak; if (dd < mdd) mdd = dd; }
    var worst = Math.min.apply(null, tr) * 100;
    var best = Math.max.apply(null, tr) * 100;
    var avg = tr.reduce(function (a, b) { return a + b; }, 0) / n * 100;
    return { n: n, wr: wr, pf: pf, expectancy: expectancy * 100, avg: avg, mdd: mdd, worst: worst, best: best };
  }

  function equitySvg(trades, closes) {
    var pts = [0]; var cum = 0;
    for (var i = 0; i < trades.length; i++) { cum += trades[i] * 100; pts.push(cum); }
    var bh = []; var step = Math.max(1, Math.floor(closes.length / pts.length));
    for (var k = 0; k < pts.length; k++) { var idx = Math.min(closes.length - 1, k * step); bh.push((closes[idx] - closes[0]) / closes[0] * 100); }
    var all = pts.concat(bh);
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    var span = (max - min) || 1;
    var W = 300, H = 90, pad = 6;
    function X(i) { return pad + (i / ((pts.length - 1) || 1)) * (W - 2 * pad); }
    function Y(v) { return H - pad - ((v - min) / span) * (H - 2 * pad); }
    function line(arr, color, cls) {
      var d = '';
      for (var m = 0; m < arr.length; m++) { d += (m === 0 ? 'M' : 'L') + X(m).toFixed(1) + ',' + Y(arr[m]).toFixed(1) + ' '; }
      return '<path class="' + (cls || '') + '" d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    var last = pts[pts.length - 1];
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:90px;display:block;margin-top:6px;">';
    svg += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="3 3"/>';
    svg += line(bh, '#64748b', '');
    svg += line(pts, '#22c55e', 'eq-line');
    svg += '<text x="' + (W - pad) + '" y="' + (Y(last) - 3).toFixed(1) + '" fill="#22c55e" font-size="8" text-anchor="end">' + (last >= 0 ? '+' : '') + last.toFixed(1) + '%</text>';
    svg += '</svg>';
    svg += '<div style="display:flex;gap:12px;font-size:0.62rem;color:#64748b;margin-top:2px;"><span><span style="color:#22c55e;">━━</span> Ekuitas strategi</span><span><span style="color:#64748b;">━━</span> Buy & Hold</span></div>';
    return svg;
  }

  window.runSwingLab = async function () {
    var code = (document.getElementById('swCode').value || '').trim().toUpperCase() || window.lastTicker;
    if (!code) { alert('Isi kode saham atau Proses sebuah saham terlebih dahulu.'); return; }
    var strat = document.getElementById('swStrat').value;
    var maxHold = parseInt(document.getElementById('swP1').value, 10) || (strat === 'donchian' ? 30 : 25);
    var tpMul = parseFloat(document.getElementById('swP2').value) || 2.5;
    var out = document.getElementById('swLabOut'); out.classList.remove('hidden'); out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      var candle = await SW.candle(code, '2y');
      var A = SW.arrays(candle);
      var tr = strat === 'donchian' ? btDonchian(A.c, A.h, A.l, A.o, maxHold, tpMul) : btPullback(A.c, A.h, A.l, A.o, maxHold, tpMul);
      var st = stats(tr);
      var bh = (A.c[A.c.length - 1] - A.c[0]) / A.c[0] * 100;
      if (!st) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada trade swing terpicu 2 tahun ini dengan parameter tersebut - disiplin menunggu juga hasil yang sah.</div>'; return; }
      var pfCol = st.pf >= 1.5 ? 'green' : (st.pf >= 1 ? 'yellow' : 'red');
      var pfTxt = st.pf >= 99 ? '99+' : st.pf.toFixed(2);
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
      h += '<div style="font-size:0.7rem;font-weight:800;color:#fff;margin-top:10px;">📈 Kurva Ekuitas vs Buy & Hold</div>';
      h += equitySvg(tr, A.c);
      h += '<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Terburuk ' + st.worst.toFixed(1) + '%. PF &gt; 1,5 + Expectancy positif = edge historis layak (bukan jaminan masa depan).</div>';
      out.innerHTML = h;
      sweep(out);
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Swing backtest gagal: ' + esc(e.message) + '</div>'; }
    finally { document.getElementById('swLabBtn').innerText = '🌊 Jalankan Swing Backtest'; }
  };
})();
/* END swlab v1 */
