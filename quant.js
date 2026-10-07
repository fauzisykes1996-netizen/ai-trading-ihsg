/* quant.js — Plugin Quant Pack (Build v6.6): Strategy Lab + Riwayat Pola + Kartu Trading Plan */
(function () {
  if (!window.P) return;

  /* ---- CSS cetak: hanya Kartu Plan yang terlihat saat print ---- */
  (function () {
    const st = document.createElement('style');
    st.textContent = '@media print{body *{visibility:hidden}#planCard,#planCard *{visibility:visible}#planCard{position:absolute;left:0;top:0;width:100%;border:none;background:#fff;color:#000}}';
    document.head.appendChild(st);
  })();

  /* ---- util seri ---- */
  function rsiSeries(cl, p) {
    const out = new Array(cl.length).fill(null);
    if (cl.length <= p) return out;
    let g = 0, l = 0;
    for (let i = 1; i <= p; i++) { const d = cl[i] - cl[i - 1]; if (d >= 0) g += d; else l -= d; }
    g /= p; l /= p;
    out[p] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    for (let i = p + 1; i < cl.length; i++) {
      const d = cl[i] - cl[i - 1];
      g = (g * (p - 1) + Math.max(d, 0)) / p;
      l = (l * (p - 1) + Math.max(-d, 0)) / p;
      out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    }
    return out;
  }
  function smaSeries(cl, p) {
    const out = new Array(cl.length).fill(null);
    let sum = 0;
    for (let i = 0; i < cl.length; i++) { sum += cl[i]; if (i >= p) sum -= cl[i - p]; if (i >= p - 1) out[i] = sum / p; }
    return out;
  }
  function tstats(tr) {
    if (!tr.length) return null;
    const n = tr.length, wr = tr.filter(x => x > 0).length / n * 100;
    const avg = tr.reduce((a, b) => a + b, 0) / n * 100;
    let cum = 0, peak = 0, mdd = 0;
    tr.forEach(x => { cum += x * 100; if (cum > peak) peak = cum; const dd = cum - peak; if (dd < mdd) mdd = dd; });
    return { n, wr, avg, total: cum, mdd, worst: Math.min.apply(null, tr) * 100, best: Math.max.apply(null, tr) * 100 };
  }

  /* ---- backtest: entry/exit di OPEN berikut, biaya round-trip P.fee ---- */
  function backtestRSI(cl, op, buyLvl, sellLvl, maxHold) {
    const rsi = rsiSeries(cl, 14);
    const tr = []; let pos = null;
    for (let i = 15; i < cl.length - 1; i++) {
      if (!pos) {
        if (rsi[i] !== null && rsi[i] < buyLvl) pos = { entry: op[i + 1], ei: i + 1 };
      } else {
        const held = i - pos.ei;
        if ((rsi[i] !== null && rsi[i] > sellLvl) || held >= maxHold) {
          tr.push((op[i + 1] - pos.entry) / pos.entry - P.fee);
          pos = null;
        }
      }
    }
    return tr;
  }
  function backtestMACross(cl, op, f, s) {
    const mf = smaSeries(cl, f), ms = smaSeries(cl, s);
    const tr = []; let pos = null;
    for (let i = s; i < cl.length - 1; i++) {
      const up = mf[i - 1] <= ms[i - 1] && mf[i] > ms[i];
      const dn = mf[i - 1] >= ms[i - 1] && mf[i] < ms[i];
      if (!pos && up) pos = { entry: op[i + 1] };
      else if (pos && dn) { tr.push((op[i + 1] - pos.entry) / pos.entry - P.fee); pos = null; }
    }
    return tr;
  }

  /* ---- detektor pola lokal (5 pola inti) untuk riwayat ---- */
  function patsAt(A, i) {
    const o = A.o[i], h = A.h[i], l = A.l[i], c = A.c[i];
    const o2 = A.o[i - 1], c2 = A.c[i - 1];
    if (o == null || c == null || o2 == null || c2 == null || i < 2) return [];
    const b = Math.abs(c - o), r = (h - l) || 1;
    const upS = h - Math.max(o, c), loS = Math.min(o, c) - l;
    const out = [];
    if (b <= r * 0.12) out.push('Doji');
    if (loS >= b * 2 && upS <= b * 0.6) out.push('Hammer');
    if (upS >= b * 2 && loS <= b * 0.6) out.push('Shooting Star');
    if (c2 < o2 && c > o && c > o2 && o < c2) out.push('Bullish Engulfing');
    if (c2 > o2 && c < o && c < o2 && o > c2) out.push('Bearish Engulfing');
    return out;
  }

  /* ================= KARTU 1: RENCANA TRADING (print/PDF) ================= */
  const riskCard = document.getElementById('rRr') ? document.getElementById('rRr').closest('.card') : null;
  const planCard = P.card('tab-analysis', `
    <div class="card-title"><span>🧾 Kartu Trading Plan</span><span class="agent-pill master">Disiplin</span></div>
    <div id="planCard" class="report-card" style="margin-top:0;"><div style="color:var(--text-muted);font-size:0.78rem;">Proses sebuah saham dulu — kartu ini terisi otomatis dan siap dicetak/PDF.</div></div>
    <button class="btn-copy" onclick="window.print()">🖨 Cetak / Simpan PDF</button>
    <button class="btn-copy" onclick="copyPlan()">📋 Salin Plan</button>
  `, riskCard);

  function renderPlan() {
    const box = document.getElementById('planCard'); if (!box) return;
    const t = window.lastTicker;
    if (!t) return;
    const g = id => { const e = document.getElementById(id); return e ? e.innerText : '-'; };
    box.innerHTML = `
      <div style="font-weight:800;color:#fff;font-size:0.9rem;">TRADING PLAN — ${t}.JK</div>
      <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:8px;">Dibuat ${new Date().toLocaleString('id-ID')} • Build v6.6 • Sumber data: Yahoo/TradingView riil</div>
      <div class="rp-line">• Bias: ${g('valTrend')} | ${g('tfBadge').replace('MULTI-TF:', 'TF:')}</div>
      <div class="rp-line">• Harga acuan: ${g('displayPrice')} | Support ${g('valSupport')} | Resistance ${g('valResistance')}</div>
      <div class="rp-line">• ENTRY: ${g('rEntry')}</div>
      <div class="rp-line">• STOP LOSS: ${g('rSl')} (risiko ${g('rPct')} dari entry)</div>
      <div class="rp-line">• TARGET: T1 ${g('rTp1')} | T2 ${g('rTp2')} | R/R ${g('rRr')}</div>
      <div class="rp-line">• Aturan: masuk hanya di zona entry; keluar paksa saat SL tersentuh; ambil T1 setengah posisi; evaluasi ulang bila tesis (${g('valTrend')}) berubah.</div>
      <div style="font-size:0.64rem;color:#64748b;margin-top:8px;">Rencana ini alat disiplin, bukan prediksi. Tidak ada kepastian arah harga.</div>`;
  }
  window.copyPlan = function () { const b = document.getElementById('planCard'); if (b) navigator.clipboard.writeText(b.innerText).then(() => alert('Plan disalin!')).catch(() => alert('Gagal menyalin.')); };
  const planObs = new MutationObserver(() => { clearTimeout(planObs._t); planObs._t = setTimeout(renderPlan, 400); });
  const rEntryEl = document.getElementById('rEntry');
  if (rEntryEl) planObs.observe(rEntryEl, { childList: true, characterData: true, subtree: true });

  /* ================= KARTU 2: STRATEGY LAB ================= */
  const labCard = P.card('tab-analysis', `
    <div class="card-title"><span>🧪 Strategy Lab</span><span class="agent-pill tech">Backtest Lokal 1 Tahun</span></div>
    <div class="metric-grid" style="margin-bottom:8px;">
      <div class="metric-box"><div class="metric-label">Kode (kosong = terakhir)</div><input type="text" id="qbCode" class="fv-input" placeholder="auto"></div>
      <div class="metric-box"><div class="metric-label">Strategi</div><select id="qbStrat" class="fv-input" onchange="qbDefaults()"><option value="rsi">RSI Rebound</option><option value="ma">MA Cross</option></select></div>
      <div class="metric-box"><div class="metric-label" id="qbL1">RSI Beli (&lt;)</div><input type="text" id="qbP1" class="fv-input" inputmode="decimal" value="30"></div>
      <div class="metric-box"><div class="metric-label" id="qbL2">RSI Jual (&gt;)</div><input type="text" id="qbP2" class="fv-input" inputmode="decimal" value="50"></div>
    </div>
    <button class="btn-copy" style="margin-top:0;" id="qbBtn" onclick="runLab()">🧪 Jalankan Backtest</button>
    <div id="qbOut" class="report-card hidden"></div>
    <div class="src-note">Simulasi lokal data harian 1 tahun: entry & exit di harga OPEN hari berikutnya; biaya round-trip ±0,5% sudah dipotong. RSI Rebound: beli saat RSI&lt;param1, jual saat RSI&gt;param2 atau maks 10 hari. MA Cross: beli saat MA cepat memotong naik, jual saat memotong turun.</div>
  `, planCard);

  window.qbDefaults = function () {
    const s = document.getElementById('qbStrat').value;
    document.getElementById('qbL1').innerText = s === 'rsi' ? 'RSI Beli (<)' : 'MA Cepat';
    document.getElementById('qbL2').innerText = s === 'rsi' ? 'RSI Jual (>)' : 'MA Lambat';
    document.getElementById('qbP1').value = s === 'rsi' ? 30 : 9;
    document.getElementById('qbP2').value = s === 'rsi' ? 50 : 21;
  };

  window.runLab = async function () {
    const code = (document.getElementById('qbCode').value || '').trim().toUpperCase() || window.lastTicker;
    if (!code) return alert('Isi kode saham atau Proses sebuah saham terlebih dahulu.');
    const strat = document.getElementById('qbStrat').value;
    const p1 = parseNumID(document.getElementById('qbP1').value) || (strat === 'rsi' ? 30 : 9);
    const p2 = parseNumID(document.getElementById('qbP2').value) || (strat === 'rsi' ? 50 : 21);
    const out = document.getElementById('qbOut'); out.classList.remove('hidden'); out.innerHTML = '<div class="skel-box" style="height:80px"></div>';
    try {
      let json = null; const cc = loadCache(code);
      if (cc && cc.json) json = cc.json; else json = await fetchChart(code + '.JK', '1y');
      const q = json.chart.result[0].indicators.quote[0];
      const cl = [], op = [];
      for (let k = 0; k < q.close.length; k++) { if (q.close[k] == null || q.open[k] == null) continue; cl.push(q.close[k]); op.push(q.open[k]); }
      const tr = strat === 'rsi' ? backtestRSI(cl, op, p1, p2, 10) : backtestMACross(cl, op, Math.round(p1), Math.round(p2));
      const st = tstats(tr);
      const bh = (cl[cl.length - 1] - cl[0]) / cl[0] * 100;
      if (!st) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada trade terpicu setahun ini dengan parameter tersebut. Disiplin menunggu juga hasil yang sah.</div>'; return; }
      out.innerHTML = `
        <div class="metric-grid">
          <div class="metric-box"><div class="metric-label">Jumlah Trade</div><div class="metric-value">${st.n}</div></div>
          <div class="metric-box"><div class="metric-label">Win Rate (net)</div><div class="metric-value ${st.wr >= 50 ? 'green' : 'red'}">${st.wr.toFixed(0)}%</div></div>
          <div class="metric-box"><div class="metric-label">Net rata-rata / trade</div><div class="metric-value ${st.avg >= 0 ? 'green' : 'red'}">${st.avg >= 0 ? '+' : ''}${st.avg.toFixed(2)}%</div></div>
          <div class="metric-box"><div class="metric-label">Total net (sum)</div><div class="metric-value ${st.total >= 0 ? 'green' : 'red'}">${st.total >= 0 ? '+' : ''}${st.total.toFixed(1)}%</div></div>
          <div class="metric-box"><div class="metric-label">Max DD equity</div><div class="metric-value red">${st.mdd.toFixed(1)}%</div></div>
          <div class="metric-box"><div class="metric-label">Buy & Hold 1y</div><div class="metric-value ${bh >= 0 ? 'green' : 'red'}">${bh >= 0 ? '+' : ''}${bh.toFixed(1)}%</div></div>
        </div>
        <div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Trade terbaik ${st.best >= 0 ? '+' : ''}${st.best.toFixed(1)}% • terburuk ${st.worst.toFixed(1)}%. Backtest ≠ jaminan masa depan; ia menjawab "secara historis, aturan ini punya edge atau tidak".</div>`;
      sweep(out);
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Gagal backtest: ' + esc(e.message) + '</div>'; }
    finally { document.getElementById('qbBtn').innerText = '🧪 Jalankan Backtest'; }
  };

  /* ================= KARTU 3: RIWAYAT POLA ================= */
  const candleCardEl = document.getElementById('candleCard');
  P.card('tab-analysis', `
    <div class="card-title"><span>🕯️ Riwayat Pola (Bukti Statistik)</span><span class="agent-pill fund">1 Tahun</span></div>
    <div id="patHist" style="font-size:0.78rem;color:var(--text-muted);">Proses sebuah saham — setiap pola yang terdeteksi hari ini akan dicarikan rekam jejaknya setahun ke belakang: berapa kali muncul, win rate, dan rata-rata hasil 5 hari kemudian (net biaya).</div>
  `, candleCardEl);

  function runPatHist(t) {
    const box = document.getElementById('patHist'); if (!box || !t) return;
    const cc = loadCache(t); if (!cc || !cc.json) return;
    const q = cc.json.chart.result[0].indicators.quote[0];
    const A = { o: [], h: [], l: [], c: [] };
    for (let k = 0; k < q.close.length; k++) { if (q.close[k] == null || q.open[k] == null) continue; A.o.push(q.open[k]); A.h.push(q.high[k]); A.l.push(q.low[k]); A.c.push(q.close[k]); }
    const n = A.c.length; if (n < 30) return;
    const cur = patsAt(A, n - 1).concat(patsAt(A, n - 2));
    const uniq = [...new Set(cur)];
    if (!uniq.length) { box.innerHTML = 'Tidak ada pola utama di 2 candle terakhir — riwayat tidak diperlukan. Lanjutkan dengan rencana risiko Anda.'; return; }
    const agg = {};
    for (let i = 2; i < n - 6; i++) {
      const names = patsAt(A, i);
      if (!names.length) continue;
      const entry = A.o[i + 1], exit = A.c[i + 5];
      if (!entry || !exit) continue;
      const ret = (exit - entry) / entry - P.fee;
      names.forEach(nm => { (agg[nm] = agg[nm] || []).push(ret); });
    }
    box.innerHTML = uniq.map(nm => {
      const arr = agg[nm];
      if (!arr || !arr.length) return `<div class="pchip neutral">🕯 ${nm}: belum pernah muncul setahun ini</div>`;
      const wr = arr.filter(x => x > 0).length / arr.length * 100;
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length * 100;
      const cls = avg >= 0 ? 'up' : 'down';
      return `<div class="pchip ${cls}">🕯 ${nm}: ${arr.length}× setahun • WR ${wr.toFixed(0)}% • rata 5 hari ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}%${arr.length < 6 ? ' ⚠️ sample kecil' : ''}</div>`;
    }).join('') + `<div style="font-size:0.64rem;color:#64748b;margin-top:6px;">Metode: beli di open hari setelah pola, jual di close 5 hari kemudian, net biaya ±0,5%. Statistik deskriptif — bukan sinyal otomatis.</div>`;
  }
  const patObs = new MutationObserver(() => { clearTimeout(patObs._t); patObs._t = setTimeout(() => runPatHist(window.lastTicker), 600); });
  const chipsEl = document.getElementById('patternChips');
  if (chipsEl) patObs.observe(chipsEl, { childList: true, characterData: true, subtree: true });
})();
