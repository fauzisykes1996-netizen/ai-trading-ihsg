/* office.js - Kantor Agen AI 2/3 (Build v6.8): tombol + panel + papan staf + log + papan tugas */
(function () {
  if (!window.P) return;
  var OA = window.OfficeArt || null;

  /* ===== definisi 8 agen ===== */
  var AGENTS = [
    { id: 'tech', icon: '🔍', name: 'Technical Agent', role: 'Indikator & pola candlestick' },
    { id: 'fund', icon: '📒', name: 'Fundamental Agent', role: 'Data crumb Yahoo + TradingView' },
    { id: 'risk', icon: '🛡️', name: 'Risk Agent', role: 'Plan, SL/TP, scaling posisi' },
    { id: 'master', icon: '🧠', name: 'Master Agent', role: 'Laporan AI (Gemini/Qwen)' },
    { id: 'scout', icon: '🌊', name: 'Swing Scout', role: 'Scanner buy-on-dip dalam tren' },
    { id: 'night', icon: '🌙', name: 'Night Trader', role: 'Screener Beli Sore Jual Pagi' },
    { id: 'sentry', icon: '🔔', name: 'Sentry', role: 'Alert & monitoring kondisi' },
    { id: 'journal', icon: '📔', name: 'Journalist', role: 'Jurnal & track record' }
  ];

  /* ===== storage: status, KPI, log ===== */
  function loadStatus() { return lsJSON('oa_status', {}); }
  function saveStatus(s) { saveLS('oa_status', s); }
  function loadKpi() { return lsJSON('oa_kpi', {}); }
  function saveKpi(k) { saveLS('oa_kpi', k); }
  function loadLog() { return lsJSON('oa_log', []); }
  function saveLog(l) { saveLS('oa_log', l); }

  function nowWib() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })); }
  function hhmm(d) { return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }

  /* catat aktivitas agen -> update status + KPI + log + repaint pixel */
  window.oaDone = function (id, action) {
    var st = loadStatus(); st[id] = { state: 'done', t: Date.now(), act: action }; saveStatus(st);
    var kp = loadKpi(); kp[id] = (kp[id] || 0) + 1; saveKpi(kp);
    var lg = loadLog(); lg.unshift({ t: Date.now(), id: id, act: action }); if (lg.length > 100) lg.length = 100; saveLog(lg);
    repaint(); renderStaff(); renderLog();
  };
  window.oaWorking = function (id, action) {
    var st = loadStatus(); st[id] = { state: 'work', t: Date.now(), act: action }; saveStatus(st);
    repaint(); renderStaff();
  };

  function agentById(id) { for (var i = 0; i < AGENTS.length; i++) if (AGENTS[i].id === id) return AGENTS[i]; return null; }

  /* ===== repaint pixel art sesuai status ===== */
  function repaint() {
    if (!OA || !OA.paint) return;
    var st = loadStatus(); var map = {}; var bub = {};
    for (var i = 0; i < AGENTS.length; i++) {
      var id = AGENTS[i].id; var rec = st[id];
      var state = 'idle';
      if (rec) {
        var age = Date.now() - rec.t;
        if (rec.state === 'work') state = 'work';
        else if (rec.state === 'done' && age < 30 * 60 * 1000) state = 'done';
        else state = 'idle';
      }
      map[id] = state;
      if (rec && rec.act && state !== 'idle') bub[id] = rec.act.length > 22 ? rec.act.substring(0, 21) + '..' : rec.act;
    }
    try { OA.paint(map, bub); } catch (e) {}
  }

  /* ===== panggil agen: jalankan fungsi nyata ===== */
  window.oaCall = function (id) {
    var a = agentById(id); if (!a) return;
    oaWorking(id, 'Memulai tugas...');
    try {
      if (id === 'scout') {
        if (typeof window.runSwingScan === 'function') { window.runSwingScan(); setTimeout(function () { oaDone(id, 'Scan swing selesai'); switchTab('market'); }, 2500); }
        else { oaDone(id, 'Scanner belum siap'); }
      } else if (id === 'night') {
        if (typeof window.runBSJP === 'function') { window.runBSJP(); setTimeout(function () { oaDone(id, 'Scan BSJP selesai'); switchTab('market'); }, 2500); }
        else { oaDone(id, 'BSJP belum siap'); }
      } else if (id === 'master') {
        if (typeof window.runDuel === 'function') { switchTab('analysis'); window.runDuel(); setTimeout(function () { oaDone(id, 'Duel mesin selesai'); }, 3000); }
        else { oaDone(id, 'Mesin AI belum siap'); }
      } else if (id === 'tech' || id === 'fund' || id === 'risk') {
        switchTab('analysis');
        var code = window.lastTicker;
        if (!code) { alert('Ketik & Proses sebuah saham dulu di kotak Kode Saham, lalu panggil agen ini lagi.'); oaDone(id, 'Menunggu saham diproses'); return; }
        oaDone(id, 'Analisis ' + code + ' (lihat kartu di atas)');
      } else if (id === 'sentry') {
        switchTab('info'); oaDone(id, 'Pantau alert di Info');
      } else if (id === 'journal') {
        switchTab('journal'); oaDone(id, 'Buka jurnal');
      }
    } catch (e) { oaDone(id, 'Tugas error'); }
  };

  window.oaResult = function (id) {
    if (id === 'scout' || id === 'night') switchTab('market');
    else if (id === 'tech' || id === 'fund' || id === 'risk' || id === 'master') switchTab('analysis');
    else if (id === 'sentry') switchTab('info');
    else if (id === 'journal') switchTab('journal');
  };

  /* ===== render papan staf ===== */
  function lampHtml(id) {
    var st = loadStatus(); var rec = st[id]; var state = 'idle'; var txt = 'STANDBY'; var cls = 'tf-warn';
    if (rec) {
      var age = Date.now() - rec.t;
      if (rec.state === 'work') { state = 'work'; txt = 'BEKERJA'; cls = 'tf-warn'; }
      else if (rec.state === 'done' && age < 30 * 60 * 1000) { state = 'done'; txt = 'SELESAI ' + hhmm(new Date(rec.t)); cls = 'tf-ok'; }
      else { state = 'idle'; txt = 'STANDBY'; cls = 'tf-warn'; }
    }
    return '<span class="tf-badge ' + cls + '" style="font-size:0.6rem;padding:2px 6px;">' + txt + '</span>';
  }
  function renderStaff() {
    var box = document.getElementById('oaStaff'); if (!box) return;
    var kp = loadKpi(); var html = '';
    for (var i = 0; i < AGENTS.length; i++) {
      var a = AGENTS[i];
      html += '<div class="metric-box" style="text-align:left;padding:10px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
      html += '<span style="font-weight:800;color:#fff;font-size:0.8rem;">' + a.icon + ' ' + a.name + '</span>' + lampHtml(a.id) + '</div>';
      html += '<div style="font-size:0.66rem;color:var(--text-muted);margin-bottom:6px;">' + a.role + '</div>';
      html += '<div style="font-size:0.66rem;color:#64748b;font-family:var(--mono);margin-bottom:6px;">KPI: ' + (kp[a.id] || 0) + ' tugas</div>';
      html += '<div style="display:flex;gap:6px;">';
      html += '<button class="btn-mini" onclick="oaCall(\'' + a.id + '\')">📞 Panggil</button>';
      html += '<button class="btn-mini" onclick="oaResult(\'' + a.id + '\')">👁 Hasil</button>';
      html += '</div></div>';
    }
    box.innerHTML = html;
  }

  /* ===== render log aktivitas ===== */
  function renderLog() {
    var box = document.getElementById('oaLog'); if (!box) return;
    var lg = loadLog();
    if (!lg.length) { box.innerHTML = '<div style="font-size:0.74rem;color:var(--text-muted);">Belum ada aktivitas. Panggil agen atau Gelar Rapat Pagi untuk mengisi log.</div>'; return; }
    var html = '';
    for (var i = 0; i < Math.min(lg.length, 30); i++) {
      var e = lg[i]; var a = agentById(e.id);
      html += '<div style="display:flex;gap:8px;font-size:0.72rem;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);">';
      html += '<span style="color:#64748b;font-family:var(--mono);min-width:42px;">' + hhmm(new Date(e.t)) + '</span>';
      html += '<span style="color:var(--accent);min-width:120px;">' + (a ? a.icon + ' ' + a.name : e.id) + '</span>';
      html += '<span style="color:var(--text-muted);">' + esc(e.act) + '</span></div>';
    }
    box.innerHTML = html;
  }

  /* ===== render papan tugas (dari alert swing) ===== */
  function renderTasks() {
    var box = document.getElementById('oaTasks'); if (!box) return;
    var alerts = lsJSON('ihsg_swing_alerts', []);
    var mon = [], done = [];
    for (var i = 0; i < alerts.length; i++) { if (alerts[i].done) done.push(alerts[i]); else mon.push(alerts[i]); }
    var wl = (typeof watchlist !== 'undefined' ? watchlist : []) || [];
    var html = '<div style="margin-bottom:8px;"><div style="font-size:0.7rem;font-weight:800;color:var(--yellow);margin-bottom:4px;">🟡 DIMONITOR (' + mon.length + ')</div>';
    html += mon.length ? mon.map(function (x) { return '<div style="font-size:0.72rem;color:var(--text-muted);padding:2px 0;">• ' + x.code + ' — ' + condLabelSafe(x) + '</div>'; }).join('') : '<div style="font-size:0.72rem;color:#64748b;">Tidak ada alert aktif.</div>';
    html += '</div><div style="margin-bottom:8px;"><div style="font-size:0.7rem;font-weight:800;color:var(--green);margin-bottom:4px;">🟢 TERPICU (' + done.length + ')</div>';
    html += done.length ? done.map(function (x) { return '<div style="font-size:0.72rem;color:var(--text-muted);padding:2px 0;">✅ ' + x.code + ' — ' + condLabelSafe(x) + '</div>'; }).join('') : '<div style="font-size:0.72rem;color:#64748b;">Belum ada alert terpenuhi.</div>';
    html += '</div><div><div style="font-size:0.7rem;font-weight:800;color:var(--text-muted);margin-bottom:4px;">⚪ SIAGA (' + wl.length + ')</div>';
    html += '<div style="font-size:0.72rem;color:#64748b;">' + (wl.length ? wl.join(', ') + ' — watchlist tanpa alert' : 'Watchlist kosong.') + '</div></div>';
    box.innerHTML = html;
  }
  function condLabelSafe(x) {
    if (x.cond === 'ma20') return 'sentuh MA20';
    if (x.cond === 'adx') return 'ADX >= 20';
    if (x.cond === 'donchian') return 'breakout Donchian 20h';
    return 'target harga';
  }

  /* ===== bangun panel kantor (overlay) ===== */
  function buildPanel() {
    var ov = document.createElement('div');
    ov.id = 'officeOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(4,8,18,.96);overflow-y:auto;padding:16px;display:none;';
    var h = '';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    h += '<div style="font-size:1.1rem;font-weight:900;color:#fff;">🏢 KANTOR AGEN AI</div>';
    h += '<button class="btn-mini" style="color:var(--red);font-size:1rem;" onclick="closeOffice()">✕</button></div>';
    h += '<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:12px;">Build v6.8 • 8 agen bertugas • jam kantor 09:00-16:15 WIB • lampu & sprite mengikuti status asli</div>';
    h += '<div id="officeArtMount" style="margin-bottom:14px;"></div>';
    h += '<div style="font-size:0.82rem;font-weight:800;color:#fff;margin-bottom:8px;">🪪 PAPAN STAF</div>';
    h += '<div id="oaStaff" class="metric-grid" style="margin-bottom:14px;"></div>';
    h += '<button class="btn-action" id="oaBriefBtn" onclick="runBriefing()" style="width:100%;border-radius:12px;padding:12px;font-size:0.85rem;font-weight:800;margin-bottom:14px;">☕ GELAR RAPAT PAGI</button>';
    h += '<div style="font-size:0.82rem;font-weight:800;color:#fff;margin-bottom:8px;">🗞 LOG AKTIVITAS</div>';
    h += '<div id="oaLog" style="margin-bottom:14px;max-height:220px;overflow-y:auto;"></div>';
    h += '<div style="font-size:0.82rem;font-weight:800;color:#fff;margin-bottom:8px;">📋 PAPAN TUGAS</div>';
    h += '<div id="oaTasks"></div>';
    ov.innerHTML = h;
    document.body.appendChild(ov);
  }

  window.openOffice = function () {
    var ov = document.getElementById('officeOverlay');
    if (!ov) buildPanel();
    ov = document.getElementById('officeOverlay');
    ov.style.display = 'block';
    if (OA && OA.mount && !document.getElementById('officeArtWrap')) OA.mount(document.getElementById('officeArtMount'));
    renderStaff(); renderLog(); renderTasks(); repaint();
  };
  window.closeOffice = function () { var ov = document.getElementById('officeOverlay'); if (ov) ov.style.display = 'none'; };

  /* placeholder briefing (diisi briefing.js); kalau belum ada, beri info */
  window.runBriefing = window.runBriefing || function () {
    alert('Mesin Rapat Pagi belum terpasang. Setelah briefing.js di-upload, tombol ini akan menggelar rapat otomatis.');
  };

  /* ===== tombol 🏢 di header ===== */
  var headerEl = document.getElementById('appHeader') || document.querySelector('header');
  if (headerEl) {
    var btn = document.createElement('button');
    btn.id = 'officeBtn';
    btn.style.cssText = 'margin-left:6px;font-size:0.7rem;background:rgba(99,102,241,.18);color:#818cf8;border:1px solid rgba(99,102,241,.45);padding:5px 10px;border-radius:12px;font-weight:700;cursor:pointer;';
    btn.innerText = '🏢 Kantor';
    btn.onclick = window.openOffice;
    var swingBtn = document.getElementById('swingModeBtn');
    if (swingBtn && swingBtn.parentElement) swingBtn.parentElement.insertBefore(btn, swingBtn.nextSibling);
    else headerEl.appendChild(btn);
  }

  /* refresh papan staf & lampu tiap 30 detik (status done bisa jadi idle setelah 30 menit) */
  setInterval(function () {
    var ov = document.getElementById('officeOverlay');
    if (ov && ov.style.display === 'block') { renderStaff(); renderTasks(); repaint(); }
  }, 30000);
})();
/* END office v1 */
