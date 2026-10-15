/* agent-bandar.js - Plugin Agent Tape Reader/Bandar (Build v6.7): analisis akumulasi/distribusi dari volume & price action */
(function () {
  if (!window.P || !window.SW) return;
  var SW = window.SW;

  // Tambahkan kartu agent baru di tab Analisis (setelah kartu agent yang ada)
  var lastAgentCard = document.querySelector('.card-title');
  var parentCard = lastAgentCard ? lastAgentCard.closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>🕵️ Agent Tape Reader (Bandar)</span><span class="agent-pill tech">Akumulasi/Distribusi</span></div>' +
    '<div id="bandarOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham — agent menganalisis jejak bandar dari volume & price action 20 hari terakhir.</div>',
    parentCard);

  function analyzeBandar(code, candle) {
    var A = SW.arrays(candle);
    var n = A.c.length;
    if (n < 20) return { signal: 'Data tidak cukup', detail: 'Minimal 20 hari data diperlukan.' };

    var q = candle.indicators.quote[0];
    var vol = [];
    if (q.volume) {
      for (var vi = 0; vi < q.volume.length; vi++) {
        if (q.volume[vi] != null) vol.push(q.volume[vi]);
      }
    }
    if (vol.length < 20) return { signal: 'Data volume tidak lengkap', detail: 'Data volume tidak mencukupi untuk analisis.' };

    var volAvg20 = 0;
    for (var i = vol.length - 20; i < vol.length; i++) volAvg20 += vol[i];
    volAvg20 /= 20;

    var volLast = vol[vol.length - 1];
    var volRatio = volLast / volAvg20;

    var priceLast = A.c[n - 1];
    var pricePrev = A.c[n - 2];
    var priceChange = (priceLast - pricePrev) / pricePrev * 100;

    var ma20 = SW.sma(A.c, 20)[n - 1];
    var aboveMA = priceLast > ma20;

    var signal = '';
    var detail = '';
    var strength = 0;

    // Sinyal akumulasi: volume tinggi + harga naik + di atas MA20
    if (volRatio >= 1.5 && priceChange > 0 && aboveMA) {
      signal = 'AKUMULASI KUAT';
      detail = 'Volume ' + volRatio.toFixed(1) + 'x rata-rata, harga naik ' + priceChange.toFixed(1) + '%, di atas MA20. Indikasi bandar masuk.';
      strength = 3;
    } else if (volRatio >= 1.3 && priceChange > 0) {
      signal = 'AKUMULASI SEDANG';
      detail = 'Volume ' + volRatio.toFixed(1) + 'x rata-rata, harga naik ' + priceChange.toFixed(1) + '%. Kemungkinan akumulasi.';
      strength = 2;
    } else if (volRatio >= 1.5 && priceChange < 0) {
      signal = 'DISTRIBUSI';
      detail = 'Volume ' + volRatio.toFixed(1) + 'x rata-rata tapi harga turun ' + priceChange.toFixed(1) + '%. Indikasi bandar keluar.';
      strength = -2;
    } else if (volRatio < 0.7 && Math.abs(priceChange) < 1) {
      signal = 'KONSOLIDASI';
      detail = 'Volume rendah (' + volRatio.toFixed(1) + 'x), harga stabil. Bandar menunggu momentum.';
      strength = 0;
    } else {
      signal = 'NETRAL';
      detail = 'Pola volume & harga tidak menunjukkan sinyal akumulasi/distribusi yang jelas.';
      strength = 0;
    }

    // Analisis 5 hari terakhir
    var recentTrend = '';
    var upDays = 0;
    for (var j = n - 5; j < n; j++) {
      if (A.c[j] > A.c[j - 1]) upDays++;
    }
    if (upDays >= 4) recentTrend = '4-5 hari naik berturut-turut (momentum kuat).';
    else if (upDays >= 3) recentTrend = '3 hari naik dari 5 hari terakhir.';
    else if (upDays <= 1) recentTrend = 'Mayoritas turun 5 hari terakhir.';

    return {
      signal: signal,
      detail: detail,
      strength: strength,
      volRatio: volRatio,
      priceChange: priceChange,
      aboveMA: aboveMA,
      recentTrend: recentTrend
    };
  }

  // Observer untuk auto-analisis saat saham diproses
  var trendEl = document.getElementById('valTrend');
  var obs = new MutationObserver(function () {
    clearTimeout(obs._t);
    obs._t = setTimeout(function () {
      var code = window.lastTicker;
      if (!code) return;
      var box = document.getElementById('bandarOut');
      if (!box) return;
      box.innerHTML = '<div class="skel-box" style="height:60px"></div>';
      SW.candle(code, '1y').then(function (candle) {
        var result = analyzeBandar(code, candle);
        var color = result.strength > 0 ? 'green' : (result.strength < 0 ? 'red' : 'yellow');
        var html = '<div style="font-weight:800;color:var(--' + color + ');font-size:0.9rem;margin-bottom:6px;">' + result.signal + '</div>';
        html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">' + result.detail + '</div>';
        html += '<div style="font-size:0.72rem;color:var(--text-muted);">Volume: ' + result.volRatio.toFixed(1) + 'x rata-rata • Perubahan: ' + (result.priceChange >= 0 ? '+' : '') + result.priceChange.toFixed(1) + '% • ' + (result.aboveMA ? 'Di atas MA20' : 'Di bawah MA20') + '</div>';
        if (result.recentTrend) html += '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">' + result.recentTrend + '</div>';
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
      var candle = loadCache(code);
      if (candle && candle.json) {
        var result = analyzeBandar(code, candle.json.chart.result[0]);
        base += '\n\nANALISIS BANDAR:\n- Sinyal: ' + result.signal + '\n- Detail: ' + result.detail + '\n- Volume: ' + result.volRatio.toFixed(1) + 'x rata-rata\n- Trend 5 hari: ' + result.recentTrend;
      }
    } catch (e) {}
    return base;
  };
})();
/* END agent-bandar v1 */
