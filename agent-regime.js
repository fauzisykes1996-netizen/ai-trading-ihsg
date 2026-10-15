/* agent-regime.js - Plugin Agent Market Regime (Build v6.7): analisis kondisi pasar untuk swing trading */
(function () {
  if (!window.P || !window.SW) return;
  var SW = window.SW;

  // Tambahkan kartu agent baru di tab Analisis
  var lastAgentCard = document.getElementById('moneyflowOut') ? document.getElementById('moneyflowOut').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>🌊 Agent Market Regime</span><span class="agent-pill tech">Kondisi Pasar</span></div>' +
    '<div id="regimeOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham — agent menganalisis apakah kondisi pasar mendukung swing trade.</div>',
    lastAgentCard);

  async function getIHSGData() {
    try {
      var json = await fetchChart('^JKSE', '1y');
      return json.chart.result[0];
    } catch (e) {
      return null;
    }
  }

  function analyzeMarketRegime(ihsgCandle) {
    if (!ihsgCandle) return { signal: 'Data IHSG tidak tersedia', detail: 'Tidak dapat mengakses data IHSG.', regime: 'UNKNOWN', strength: 0 };

    var A = SW.arrays(ihsgCandle);
    var n = A.c.length;
    if (n < 50) return { signal: 'Data IHSG tidak cukup', detail: 'Minimal 50 hari data diperlukan.', regime: 'UNKNOWN', strength: 0 };

    var ma20 = SW.sma(A.c, 20);
    var ma50 = SW.sma(A.c, 50);
    var ma200 = SW.sma(A.c, 200);
    var rsi = SW.rsi(A.c, 14);
    var atr = SW.atr(A.h, A.l, A.c, 14);

    var last = n - 1;
    var price = A.c[last];
    var m20 = ma20[last];
    var m50 = ma50[last];
    var m200 = ma200[last];
    var rsiVal = rsi[last];
    var atrVal = atr[last];
    var atrPct = atrVal / price * 100;

    // Hitung breadth dari 20 hari terakhir
    var upDays = 0;
    for (var i = n - 20; i < n; i++) {
      if (A.c[i] > A.c[i - 1]) upDays++;
    }

    // Tentukan regime
    var regime = '';
    var signal = '';
    var detail = '';
    var strength = 0;

    if (price > m20 && m20 > m50 && rsiVal >= 50 && rsiVal <= 70) {
      regime = 'BULLISH';
      signal = 'PASAR BULLISH - Swing Trade FAVORABLE';
      detail = 'IHSG di atas MA20 & MA50, RSI ' + rsiVal.toFixed(0) + ' (sehat). ' + upDays + '/20 hari naik. Kondisi ideal untuk swing trade.';
      strength = 3;
    } else if (price > m50 && rsiVal >= 40 && rsiVal <= 60) {
      regime = 'NEUTRAL-BULLISH';
      signal = 'PASAR NETRAL-BULLISH - Swing Trade MODERATE';
      detail = 'IHSG di atas MA50, RSI ' + rsiVal.toFixed(0) + '. ' + upDays + '/20 hari naik. Swing trade masih layak tapi pilih-pilih setup.';
      strength = 2;
    } else if (price < m20 && price > m50) {
      regime = 'MIXED';
      signal = 'PASAR CAMPURAN - Swing Trade HATI-HATI';
      detail = 'IHSG di bawah MA20 tapi di atas MA50, RSI ' + rsiVal.toFixed(0) + '. ' + upDays + '/20 hari naik. Hanya ambil setup A+.';
      strength = 1;
    } else if (price < m50 && rsiVal <= 40) {
      regime = 'BEARISH';
      signal = 'PASAR BEARISH - Swing Trade TIDAK DISARANKAN';
      detail = 'IHSG di bawah MA50, RSI ' + rsiVal.toFixed(0) + '. ' + upDays + '/20 hari naik. Risiko tinggi, lebih baik wait and see.';
      strength = -3;
    } else {
      regime = 'UNCERTAIN';
      signal = 'PASAR TIDAK PASTI - Swing Trade HINDARI';
      detail = 'Pola tidak jelas, RSI ' + rsiVal.toFixed(0) + '. ' + upDays + '/20 hari naik. Tunggu konfirmasi arah.';
      strength = -1;
    }

    // Volatilitas
    var volNote = '';
    if (atrPct > 3) volNote = ' Volatilitas tinggi (' + atrPct.toFixed(1) + '%) - perlebar stop loss.';
    else if (atrPct < 1.5) volNote = ' Volatilitas rendah (' + atrPct.toFixed(1) + '%) - setup bisa lambat bergerak.';
    else volNote = ' Volatilitas normal (' + atrPct.toFixed(1) + '%).';

    return {
      signal: signal,
      detail: detail + volNote,
      regime: regime,
      strength: strength,
      rsi: rsiVal,
      atrPct: atrPct,
      upDays: upDays,
      price: price,
      ma20: m20,
      ma50: m50
    };
  }

  // Observer untuk auto-analisis
  var trendEl = document.getElementById('valTrend');
  var obs = new MutationObserver(function () {
    clearTimeout(obs._t);
    obs._t = setTimeout(function () {
      var code = window.lastTicker;
      if (!code) return;
      var box = document.getElementById('regimeOut');
      if (!box) return;
      box.innerHTML = '<div class="skel-box" style="height:60px"></div>';
      getIHSGData().then(function (ihsgCandle) {
        var result = analyzeMarketRegime(ihsgCandle);
        var color = result.strength > 0 ? 'green' : (result.strength < 0 ? 'red' : 'yellow');
        var html = '<div style="font-weight:800;color:var(--' + color + ');font-size:0.9rem;margin-bottom:6px;">' + result.signal + '</div>';
        html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">' + result.detail + '</div>';
        html += '<div style="font-size:0.72rem;color:var(--text-muted);">IHSG: ' + Math.round(result.price).toLocaleString('id-ID') + ' • RSI: ' + result.rsi.toFixed(0) + ' • ' + result.upDays + '/20 hari naik</div>';
        box.innerHTML = html;
      }).catch(function (e) {
        box.innerHTML = '<span style="color:var(--red);">Analisis gagal: ' + esc(e.message) + '</span>';
      });
    }, 700);
  });
  if (trendEl) obs.observe(trendEl, { childList: true, characterData: true, subtree: true });

  // Suntikkan ke prompt Master Agent
  var origBuildPrompt = window.buildMasterPrompt;
  window.buildMasterPrompt = function () {
    var base = origBuildPrompt ? origBuildPrompt() : '';
    var code = window.lastTicker;
    if (!code) return base;
    try {
      var ihsgCandle = loadCache('^JKSE');
      if (ihsgCandle && ihsgCandle.json) {
        var result = analyzeMarketRegime(ihsgCandle.json.chart.result[0]);
        base += '\n\nKONDISI PASAR (IHSG):\n- Regime: ' + result.regime + '\n- Sinyal: ' + result.signal + '\n- Detail: ' + result.detail + '\n- RSI IHSG: ' + result.rsi.toFixed(0) + '\n- ' + result.upDays + '/20 hari naik';
      }
    } catch (e) {}
    return base;
  };
})();
/* END agent-regime v1 */
