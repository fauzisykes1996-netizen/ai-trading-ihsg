/* agent-moneyflow.js - Plugin Agent Money Flow (Build v6.7): analisis aliran dana dari MFI, CMF, dan volume profile */
(function () {
  if (!window.P || !window.SW) return;
  var SW = window.SW;

  // Tambahkan kartu agent baru di tab Analisis
  var lastAgentCard = document.getElementById('bandarOut') ? document.getElementById('bandarOut').closest('.card') : null;
  P.card('tab-analysis',
    '<div class="card-title"><span>💰 Agent Money Flow</span><span class="agent-pill tech">Aliran Dana</span></div>' +
    '<div id="moneyflowOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham — agent menganalisis tekanan beli/jual, Money Flow Index, dan konsentrasi volume.</div>',
    lastAgentCard);

  function computeMFI(c, h, l, v, period) {
    var tp = [];
    for (var i = 0; i < c.length; i++) tp.push((h[i] + l[i] + c[i]) / 3);
    var mf = [];
    for (var i = 1; i < c.length; i++) {
      if (tp[i] > tp[i - 1]) mf.push(v[i] * tp[i]);
      else if (tp[i] < tp[i - 1]) mf.push(-v[i] * tp[i]);
      else mf.push(0);
    }
    mf.unshift(0);
    var pos = [], neg = [];
    for (var i = 1; i < c.length; i++) {
      if (mf[i] > 0) { pos.push(mf[i]); neg.push(0); }
      else if (mf[i] < 0) { pos.push(0); neg.push(Math.abs(mf[i])); }
      else { pos.push(0); neg.push(0); }
    }
    var mfi = new Array(c.length).fill(null);
    for (var i = period; i < c.length; i++) {
      var posSum = 0, negSum = 0;
      for (var j = i - period + 1; j <= i; j++) { posSum += pos[j]; negSum += neg[j]; }
      var ratio = negSum === 0 ? 100 : posSum / negSum;
      mfi[i] = 100 - 100 / (1 + ratio);
    }
    return mfi;
  }

  function computeCMF(h, l, c, v, period) {
    var mfm = [];
    for (var i = 0; i < c.length; i++) {
      if (h[i] === l[i]) mfm.push(0);
      else mfm.push(((c[i] - l[i]) - (h[i] - c[i])) / (h[i] - l[i]));
    }
    var mfv = [];
    for (var i = 0; i < c.length; i++) mfv.push(mfm[i] * v[i]);
    var cmf = new Array(c.length).fill(null);
    for (var i = period - 1; i < c.length; i++) {
      var mfvSum = 0, vSum = 0;
      for (var j = i - period + 1; j <= i; j++) { mfvSum += mfv[j]; vSum += v[j]; }
      cmf[i] = vSum === 0 ? 0 : mfvSum / vSum;
    }
    return cmf;
  }

  function computeVolumeProfile(h, l, c, v, bins) {
    var min = Math.min.apply(null, l);
    var max = Math.max.apply(null, h);
    var range = max - min;
    if (range === 0) return [];
    var binSize = range / bins;
    var profile = new Array(bins).fill(0);
    for (var i = 0; i < c.length; i++) {
      var bin = Math.floor((c[i] - min) / binSize);
      if (bin >= bins) bin = bins - 1;
      profile[bin] += v[i];
    }
    var maxVol = Math.max.apply(null, profile);
    var poc = 0;
    for (var i = 0; i < bins; i++) {
      if (profile[i] === maxVol) {
        poc = min + (i + 0.5) * binSize;
        break;
      }
    }
    return { profile: profile, poc: poc, min: min, max: max, binSize: binSize };
  }

  function analyzeMoneyFlow(code, candle) {
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
    if (vol.length < 20) return { signal: 'Data volume tidak lengkap', detail: 'Data volume tidak mencukupi.' };

    var mfi = computeMFI(A.c, A.h, A.l, vol, 14);
    var cmf = computeCMF(A.h, A.l, A.c, vol, 20);
    var vp = computeVolumeProfile(A.c, A.h, A.l, vol, 10);

    var lastMFI = mfi[n - 1];
    var lastCMF = cmf[n - 1];
    var priceLast = A.c[n - 1];

    var signal = '';
    var detail = '';
    var strength = 0;

    if (lastMFI >= 80 && lastCMF > 0.1) {
      signal = 'MONEY FLOW SANGAT KUAT (OVERBOUGHT)';
      detail = 'MFI ' + lastMFI.toFixed(0) + ' + CMF ' + lastCMF.toFixed(2) + ' = uang masuk deras, tapi hati-hati jenuh beli.';
      strength = 2;
    } else if (lastMFI >= 60 && lastCMF > 0.05) {
      signal = 'MONEY FLOW KUAT (BELI)';
      detail = 'MFI ' + lastMFI.toFixed(0) + ' + CMF ' + lastCMF.toFixed(2) + ' = tekanan beli dominan, aliran dana positif.';
      strength = 3;
    } else if (lastMFI <= 20 && lastCMF < -0.1) {
      signal = 'MONEY FLOW SANGAT LEMAH (OVERSOLD)';
      detail = 'MFI ' + lastMFI.toFixed(0) + ' + CMF ' + lastCMF.toFixed(2) + ' = uang keluar deras, tapi mungkin peluang pantulan.';
      strength = -2;
    } else if (lastMFI <= 40 && lastCMF < -0.05) {
      signal = 'MONEY FLOW LEMAH (JUAL)';
      detail = 'MFI ' + lastMFI.toFixed(0) + ' + CMF ' + lastCMF.toFixed(2) + ' = tekanan jual dominan, aliran dana negatif.';
      strength = -3;
    } else {
      signal = 'MONEY FLOW NETRAL';
      detail = 'MFI ' + lastMFI.toFixed(0) + ' + CMF ' + lastCMF.toFixed(2) + ' = tidak ada tekanan beli/jual yang signifikan.';
      strength = 0;
    }

    var vpNote = 'Point of Control (harga dengan volume tertinggi): ' + Math.round(vp.poc).toLocaleString('id-ID');
    var abovePOC = priceLast > vp.poc;
    if (abovePOC) vpNote += ' • Harga di atas POC = bullish.';
    else vpNote += ' • Harga di bawah POC = bearish.';

    return {
      signal: signal,
      detail: detail,
      strength: strength,
      mfi: lastMFI,
      cmf: lastCMF,
      vpNote: vpNote,
      poc: vp.poc
    };
  }

  // Observer untuk auto-analisis
  var trendEl = document.getElementById('valTrend');
  var obs = new MutationObserver(function () {
    clearTimeout(obs._t);
    obs._t = setTimeout(function () {
      var code = window.lastTicker;
      if (!code) return;
      var box = document.getElementById('moneyflowOut');
      if (!box) return;
      box.innerHTML = '<div class="skel-box" style="height:60px"></div>';
      SW.candle(code, '1y').then(function (candle) {
        var result = analyzeMoneyFlow(code, candle);
        var color = result.strength > 0 ? 'green' : (result.strength < 0 ? 'red' : 'yellow');
        var html = '<div style="font-weight:800;color:var(--' + color + ');font-size:0.9rem;margin-bottom:6px;">' + result.signal + '</div>';
        html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">' + result.detail + '</div>';
        html += '<div style="font-size:0.72rem;color:var(--text-muted);">MFI (14): ' + result.mfi.toFixed(0) + ' • CMF (20): ' + result.cmf.toFixed(2) + '</div>';
        html += '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">' + result.vpNote + '</div>';
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
        var result = analyzeMoneyFlow(code, candle.json.chart.result[0]);
        base += '\n\nANALISIS MONEY FLOW:\n- Sinyal: ' + result.signal + '\n- Detail: ' + result.detail + '\n- MFI: ' + result.mfi.toFixed(0) + '\n- CMF: ' + result.cmf.toFixed(2) + '\n- ' + result.vpNote;
      }
    } catch (e) {}
    return base;
  };
})();
/* END agent-moneyflow v1 */
