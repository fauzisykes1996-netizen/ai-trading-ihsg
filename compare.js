/* compare.js — Plugin Compare Pack (Build v6.6): Head-to-Head + Duel Mesin + Heatmap Watchlist */
(function () {
  if (!window.P) return;

  /* ================= 🆚 HEAD-TO-HEAD (tab Market) ================= */
  P.card('tab-market', `
    <div class="card-title"><span>🆚 Komparasi Head-to-Head</span><span class="agent-pill tech">Dua Saham</span></div>
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input type="text" id="cmpA" class="fv-input" placeholder="Saham A (mis. BBCA)" maxlength="6" style="text-transform:uppercase;">
      <input type="text" id="cmpB" class="fv-input" placeholder="Saham B (mis. BBRI)" maxlength="6" style="text-transform:uppercase;">
      <button class="btn-action" id="cmpBtn" onclick="runCompare()" style="border-radius:10px;padding:0 14px;">Bandingkan</button>
    </div>
    <div id="cmpOut" class="hidden"></div>
    <div class="src-note">Metrik riil dari Yahoo crumb + TradingView. Baris hijau = pemenang per metrik. Grade Klinik memakai threshold Non-Bank (untuk bank, angka tetap informatif tapi ambang idealnya berbeda).</div>
  `, document.getElementById('scrBtn') ? document.getElementById('scrBtn').closest('.card') : null);

  async function cmpMetrics(code) {
    const f = await fetchFundamentals(code);
    let m = null, chg = null;
    try {
      const cc = loadCache(code);
      let json = cc && cc.json ? cc.json : await fetchChart(code + '.JK', '1y');
      const candle = json.chart.result[0];
      m = computeMetrics(candle);
      const meta = candle.meta || {};
      const prev = meta.chartPreviousClose;
      chg = (prev && m) ? ((m.last - prev) / prev * 100) : (m ? m.chPct : null);
    } catch (_) {}
    return { code: code, f: f, m: m, chg: chg };
  }
  function gradeOf(f) { try { return calculateHealthScore(f || {}, 'non-bank').grade; } catch (_) { return '-'; } }
  function mosOf(f) {
    if (!f || !hasVal(f.eps) || !hasVal(f.bvps) || !hasVal(f.price) || f.eps <= 0 || f.bvps <= 0 || f.price <= 0) return null;
    return (1 - f.price / Math.sqrt(22.5 * f.eps * f.bvps)) * 100;
  }
  function row(label, a, b, fmt, better) {
    const va = a, vb = b;
    const sa = hasVal(va), sb = hasVal(vb);
    let winA = false, winB = false;
    if (sa && sb) { if (better === 'high') { winA = va > vb; winB = vb > va; } else { winA = va < vb; winB = vb < va; } }
    const ca = winA ? 'green' : (winB ? '' : ''); const cb = winB ? 'green' : '';
    return `<div class="mkt-row"><span style="color:var(--text-muted);font-size:0.72rem;">${label}</span><span style="display:flex;gap:14px;font-family:var(--mono);font-weight:700;"><span class="${ca}">${sa ? fmt(va) : '-'}</span><span class="${cb}">${sb ? fmt(vb) : '-'}</span></span></div>`;
  }
  window.runCompare = async function () {
    const a = (document.getElementById('cmpA').value || '').trim().toUpperCase();
    const b = (document.getElementById('cmpB').value || '').trim().toUpperCase();
    const out = document.getElementById('cmpOut'); out.classList.remove('hidden');
    if (!a || !b || a === b) { out.innerHTML = '<div style="color:var(--yellow);font-size:0.8rem;">Isi dua kode saham yang berbeda.</div>'; return; }
    out.innerHTML = '<div class="skel-box" style="height:90px"></div>';
    try {
      const [A, B] = await Promise.all([cmpMetrics(a), cmpMetrics(b)]);
      if (!A.f && !B.f) throw new Error('Kedua saham tidak mengembalikan data fundamental.');
      const fa = A.f || {}, fb = B.f || {};
      const mosA = mosOf(Object.assign({ price: A.m ? A.m.last : null }, fa));
      const mosB = mosOf(Object.assign({ price: B.m ? B.m.last : null }, fb));
      const gA = gradeOf(fa), gB = gradeOf(fb);
      const rank = { A: 4, B: 3, C: 2, D: 1, '-': 0 };
      out.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-weight:800;font-family:var(--mono);margin-bottom:4px;"><span style="color:var(--accent);">${a}</span><span style="color:#c084fc;">${b}</span></div>
        ${row('Harga', A.m ? A.m.last : null, B.m ? B.m.last : null, rp, 'high')}
        ${row('Perubahan', A.chg, B.chg, v => (v >= 0 ? '+' : '') + v.toFixed(2) + '%', 'high')}
        ${row('Trend', A.m ? A.m.trend : null, B.m ? B.m.trend : null, v => v, 'high')}
        ${row('RSI 14', A.m ? A.m.rsi : null, B.m ? B.m.rsi : null, v => v.toFixed(1), 'low')}
        ${row('PER', fa.per, fb.per, num, 'low')}
        ${row('PBV', fa.pbv, fb.pbv, num, 'low')}
        ${row('ROE', fa.roe, fb.roe, pctRaw, 'high')}
        ${row('DER', fa.der, fb.der, v => hasVal(v) ? v.toFixed(1) + '%' : '-', 'low')}
        ${row('MOS Graham', mosA, mosB, v => (v >= 0 ? '+' : '') + v.toFixed(0) + '%', 'high')}
        ${row('Grade Klinik', gA, gB, v => v, 'high')}
        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;text-align:center;">Verdict: ${(() => { const sa = (rank[gA]||0) + (mosA||0)/100 + (fa.roe||0)/100 - (fa.per||99)/10; const sb = (rank[gB]||0) + (mosB||0)/100 + (fb.roe||0)/100 - (fb.per||99)/10; const d = sa - sb; return Math.abs(d) < 0.6 ? '🤝 Seimbang — pilih berdasarkan tesis Anda sendiri.' : (d > 0 ? ' ' + a + ' unggul secara metrik.' : '🏆 ' + b + ' unggul secara metrik.'); })()}</div>`;
      sweep(out);
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Gagal membandingkan: ' + esc(e.message) + '</div>'; }
  };

  /* ================= ⚔️ DUEL MESIN (tab Analisis) ================= */
  const masterCard = document.getElementById('agMaster') ? document.getElementById('agMaster').closest('.card') : null;
  P.card('tab-analysis', `
    <div class="card-title"><span>⚔️ Duel Mesin (Second Opinion)</span><span class="agent-pill master">Gemini vs Qwen</span></div>
    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">Satu prompt Master Agent dikirim ke <strong>Gemini DAN Qwen</strong> bersamaan. Bandingkan gaya analisis keduanya + ringkasan konsensus/selisih. Memakai ±2 panggilan AI.</div>
    <button class="btn-copy" style="margin-top:0;" id="duelBtn" onclick="runDuel()">⚔️ Jalankan Duel</button>
    <div id="duelOut" class="hidden" style="margin-top:10px;"></div>
  `, masterCard);

  function buildDuelPrompt() {
    const t = window.lastTicker;
    if (!t) return null;
    const g = id => { const e = document.getElementById(id); return e ? e.innerText : '-'; };
    const fund = window.lastFund;
    const ctx = { ticker: t, price: window.lastPrice, changePct: g('displayChange').replace(/[+%]/g, ''), volume: g('valVolume'),
      rsi: g('valRsi'), macd: g('valMacd'), ma20: g('valMaShort').split('/')[0].trim(), ma50: g('valMaShort').split('/')[1] ? g('valMaShort').split('/')[1].trim() : '-', ma200: g('valMa200'),
      support: g('valSupport'), resistance: g('valResistance'), atr: g('rAtr'), atrPct: g('rAtr'), trend: g('valTrend'), breakout: g('valBreakout'), momentum: g('valMomentum'), reversal: g('rReversal'),
      risk: { entryLow: g('rEntry').split('–')[0], entryHigh: g('rEntry').split('–')[1], sl: g('rSl'), tp1: g('rTp1'), tp2: g('rTp2'), rr: g('rRr'), riskPct: g('rPct'), atrPct: g('rAtr') },
      fund: fund, last: window.lastPrice };
    const techTxt = document.getElementById('outTech') ? document.getElementById('outTech').innerText : '';
    const fundTxt = document.getElementById('outFund') ? document.getElementById('outFund').innerText : '';
    const riskTxt = document.getElementById('outRisk') ? document.getElementById('outRisk').innerText : '';
    return `${factBlock(ctx)}\n${fundBlock(fund)}\n\nHASIL TECHNICAL AGENT:\n${techTxt}\n\nHASIL FUNDAMENTAL AGENT:\n${fundTxt}\n\nHASIL RISK AGENT:\n${riskTxt}\n\nTugas Anda: MASTER AGENT. Sintesis menjadi SATU laporan. WAJIB diakhiri format: TREND / TECHNICAL / FUNDAMENTAL / SUPPORT / RESISTANCE / ENTRY AREA / STOP LOSS / TARGET 1 / TARGET 2 / RISK-REWARD / RISIKO / CATATAN.\n${ATURAN}`;
  }
  function extractTrend(txt) { const m = String(txt).match(/TREND:\s*\n?\s*(Bullish|Bearish|Sideways)/i); return m ? m[1] : '?'; }
  function extractRisk(txt) { const m = String(txt).match(/RISIKO:\s*\n?\s*(Rendah|Sedang|Tinggi)/i); return m ? m[1] : '?'; }

  window.runDuel = async function () {
    const btn = document.getElementById('duelBtn'); const out = document.getElementById('duelOut');
    if (!window.lastTicker) { alert('Proses sebuah saham dulu di atas agar Duel punya bahan analisis.'); return; }
    const prompt = buildDuelPrompt();
    if (!prompt) { alert('Data analisis belum siap. Proses saham sekali lagi.'); return; }
    btn.disabled = true; btn.innerText = '⚔️ Duel berjalan (±2 panggilan AI)…';
    out.classList.remove('hidden');
    out.innerHTML = '<div class="metric-grid"><div class="skel-box"></div><div class="skel-box"></div></div>';
    try {
      const [gem, qwe] = await Promise.allSettled([geminiCall(prompt), qwenCall(prompt)]);
      const gTxt = gem.status === 'fulfilled' ? gem.value : ('❌ Gemini gagal: ' + gem.reason.message);
      const qTxt = qwe.status === 'fulfilled' ? qwe.value : ('❌ Qwen gagal: ' + qwe.reason.message);
      const gOk = gem.status === 'fulfilled', qOk = qwe.status === 'fulfilled';
      const gT = extractTrend(gTxt), qT = extractTrend(qTxt), gR = extractRisk(gTxt), qR = extractRisk(qTxt);
      const sameTrend = gOk && qOk && gT === qT;
      const sameRisk = gOk && qOk && gR === qR;
      out.innerHTML = `
        <div class="report-card" style="background:linear-gradient(#0b1426,#0b1426) padding-box,linear-gradient(135deg,rgba(56,189,248,.5),rgba(192,132,252,.5)) border-box;border:1px solid transparent;">
          <div style="font-weight:800;color:#fff;margin-bottom:6px;">🤝 Ringkasan Duel</div>
          <div class="rp-line">• Trend → Gemini: <strong>${gT}</strong> | Qwen: <strong>${qT}</strong> ${sameTrend ? '✅ KONSENSUS' : '⚠️ BEDA PENDAPAT'}</div>
          <div class="rp-line">• Risiko → Gemini: <strong>${gR}</strong> | Qwen: <strong>${qR}</strong> ${sameRisk ? '✅ KONSENSUS' : '⚠️ BEDA PENDAPAT'}</div>
          <div style="font-size:0.66rem;color:#64748b;margin-top:6px;">${(!gOk || !qOk) ? 'Salah satu mesin tidak merespons — baca laporan yang tersedia; keputusan tetap di tangan Anda.' : (sameTrend && sameRisk ? 'Kedua mesin sepakat → keyakinan lebih tinggi (tetap bukan jaminan).' : 'Mesin berselisih → sinyal lemah; pertimbangkan ukuran posisi lebih kecil atau tunggu konfirmasi.')}</div>
        </div>
        <details class="agent-detail" open><summary>✨ Laporan Gemini</summary><div class="formatted-kv">${esc(gTxt)}</div></details>
        <details class="agent-detail"><summary>🤖 Laporan Qwen</summary><div class="formatted-kv">${esc(qTxt)}</div></details>`;
      sweep(out);
    } catch (e) { out.innerHTML = '<div style="color:var(--red);">Duel gagal: ' + esc(e.message) + '</div>'; }
    finally { btn.disabled = false; btn.innerText = '⚔️ Jalankan Duel'; }
  };

  /* ================= 🔥 HEATMAP WATCHLIST (tab Porto) ================= */
  const wlCard = document.getElementById('watchlistCount') ? document.getElementById('watchlistCount').closest('.card') : null;
  P.card('tab-porto', `
    <div class="card-title"><span>🔥 Heatmap Watchlist</span><span class="agent-pill fund">Sekilas Pantauan</span></div>
    <button class="btn-copy" style="margin-top:0;" id="heatBtn" onclick="runHeatmap()">🔥 Muat Heatmap</button>
    <div id="heatOut" class="hidden" style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px;"></div>
    <div class="src-note">Satu permintaan scan untuk seluruh watchlist. Hijau = naik, merah = turun; ketuk kotak untuk langsung analisis.</div>
  `, wlCard);

  function heatColor(chg) {
    const c = Math.max(-7, Math.min(7, chg || 0));
    const t = (c + 7) / 14;
    const r = Math.round(239 - t * (239 - 34)), g = Math.round(68 + t * (197 - 68)), b = Math.round(68 + t * (94 - 68));
    return `rgba(${r},${g},${b},0.22)`;
  }
  window.runHeatmap = async function () {
    const btn = document.getElementById('heatBtn'); const out = document.getElementById('heatOut');
    const list = (watchlist || []).filter(Boolean);
    if (!list.length) { alert('Watchlist kosong. Tambah saham dulu di tab Analisis.'); return; }
    btn.disabled = true; btn.innerText = 'Memuat…'; out.classList.remove('hidden');
    out.innerHTML = list.map(() => '<div class="skel-box" style="height:54px"></div>').join('');
    try {
      let rows = null;
      try {
        const r = await fetchWithTimeout('https://scanner.tradingview.com/indonesia/scan', 15000, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: tvBody(list, ['close', 'change']) });
        if (r.ok) { const j = await r.json(); if (j && j.data) rows = j.data.map(x => ({ code: String(x.s || '').replace('IDX:', ''), price: x.d[0], chg: x.d[1] })); }
      } catch (_) {}
      if (!rows) {
        rows = [];
        for (const c of list) { const f = await tvSnapshot(c); if (f) rows.push({ code: c, price: f.price, chg: f.changePct }); }
      }
      const map = {}; rows.forEach(r => { map[r.code] = r; });
      out.innerHTML = list.map(c => {
        const r = map[c];
        const chg = r ? r.chg : null;
        const bg = hasVal(chg) ? heatColor(chg) : 'rgba(255,255,255,0.04)';
        const col = !hasVal(chg) ? 'var(--text-muted)' : (chg >= 0 ? 'var(--green)' : 'var(--red)');
        return `<div onclick="quickSelect('${c}')" style="background:${bg};border:1px solid var(--card-border);border-radius:10px;padding:8px;cursor:pointer;text-align:center;"><div style="font-weight:800;color:#fff;font-size:0.8rem;">${c}</div><div style="font-family:var(--mono);font-size:0.72rem;color:${col};font-weight:700;">${hasVal(chg) ? ((chg >= 0 ? '+' : '') + chg.toFixed(1) + '%') : '—'}</div></div>`;
      }).join('');
    } catch (e) { out.innerHTML = '<div style="color:var(--red);grid-column:1/-1;">Heatmap gagal: ' + esc(e.message) + '</div>'; }
    finally { btn.disabled = false; btn.innerText = '🔥 Muat Heatmap'; }
  };
})();
