/* office-art.js - Kantor Agen AI 1/3 (Build v6.8): ruang pixel-art + animasi + paintOffice() */
(function () {
  window.OfficeArt = window.OfficeArt || {};
  var OA = window.OfficeArt;

  /* ===== CSS animasi (lampu kedip, kopi mengepul, Zzz melayang, neon berdenyut) ===== */
  (function () {
    var st = document.createElement('style');
    st.textContent =
      '@keyframes oaBlink{0%,100%{opacity:1}50%{opacity:.25}}' +
      '@keyframes oaSteam{0%{transform:translateY(0);opacity:.7}100%{transform:translateY(-7px);opacity:0}}' +
      '@keyframes oaZzz{0%{transform:translateY(0);opacity:.8}100%{transform:translateY(-6px);opacity:0}}' +
      '@keyframes oaNeon{0%,100%{opacity:1}50%{opacity:.78}}' +
      '@keyframes oaType{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}' +
      '.oa-lamp-work{animation:oaBlink 1s infinite}' +
      '.oa-steam{animation:oaSteam 2.2s infinite}' +
      '.oa-zzz{animation:oaZzz 2.4s infinite}' +
      '.oa-neon{animation:oaNeon 2.6s infinite}' +
      '.oa-agent-work{animation:oaType .5s infinite}' +
      '#officeArtWrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:14px;background:#0b1426;border:1px solid rgba(99,102,241,.25)}' +
      '#officeArtWrap svg{display:block;min-width:520px;width:100%;height:auto}';
    document.head.appendChild(st);
  })();

  /* ===== palet warna ===== */
  var C = {
    wall: '#13203f', floor: '#0e1830', desk: '#7a4a22', deskTop: '#9a5e2e',
    chair: '#2b3550', monitor: '#0a0f1f', screen: '#0c1a12',
    up: '#22c55e', down: '#ef4444', skin: '#f0c08a', hair: '#5a3a22',
    shirt: '#3b82f6', shirt2: '#10b981', shirt3: '#f59e0b', neonC: '#22d3ee', neonP: '#c084fc',
    plant: '#16a34a', pot: '#b45309', coffee: '#78350f', steam: '#cbd5e1',
    lampDone: '#22c55e', lampWork: '#facc15', lampIdle: '#64748b',
    board: '#92622f', note1: '#f87171', note2: '#fbbf24', note3: '#34d399', note4: '#60a5fa'
  };

  /* ===== helper: satu kotak pixel ===== */
  function px(x, y, w, h, fill, cls) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  }

  /* ===== grafik candlestick mini di layar monitor ===== */
  function candles(ox, oy) {
    var s = '';
    var data = [3, 7, 5, 9, 6, 11, 8, 12];
    for (var i = 0; i < data.length; i++) {
      var up = (i % 2 === 0);
      var col = up ? C.up : C.down;
      var bx = ox + 3 + i * 5;
      var top = oy + (14 - data[i]);
      s += px(bx + 1, oy + 2, 1, 12, '#1e3a2a');
      s += px(bx, top, 3, Math.max(2, data[i] - 2), col);
    }
    return s;
  }

  /* ===== satu agen: meja + monitor + kursi + orang + properti ===== */
  function agent(ox, oy, opt) {
    var s = '';
    var lampCol = opt.status === 'work' ? C.lampWork : (opt.status === 'done' ? C.lampDone : C.lampIdle);
    var lampCls = opt.status === 'work' ? 'oa-lamp-work' : '';
    var agentCls = opt.status === 'work' ? 'oa-agent-work' : '';
    /* meja */
    s += px(ox, oy + 26, 46, 6, C.deskTop);
    s += px(ox + 2, oy + 32, 4, 14, C.desk);
    s += px(ox + 40, oy + 32, 4, 14, C.desk);
    /* monitor */
    s += px(ox + 8, oy + 6, 26, 20, C.monitor);
    s += px(ox + 10, oy + 8, 22, 15, C.screen);
    s += candles(ox + 10, oy + 8);
    s += px(ox + 19, oy + 26, 4, 3, C.chair);
    /* lampu status di atas monitor */
    s += px(ox + 36, oy + 2, 5, 5, lampCol, lampCls);
    /* kursi */
    s += px(ox + 16, oy + 34, 14, 4, C.chair);
    s += px(ox + 21, oy + 38, 4, 8, C.chair);
    /* orang (kepala manusia biasa) */
    s += '<g class="' + agentCls + '">';
    s += px(ox + 18, oy + 16, 10, 10, C.skin);           /* kepala */
    s += px(ox + 18, oy + 15, 10, 4, C.hair);            /* rambut */
    s += px(ox + 16, oy + 26, 14, 10, opt.shirt || C.shirt); /* badan */
    s += '</g>';
    /* properti per peran */
    if (opt.prop === 'loupe') { s += px(ox + 30, oy + 22, 6, 6, '#cbd5e1'); s += px(ox + 32, oy + 28, 2, 4, '#94a3b8'); }
    if (opt.prop === 'book') { s += px(ox + 28, oy + 30, 12, 5, '#e2e8f0'); s += px(ox + 33, oy + 30, 1, 5, '#94a3b8'); }
    if (opt.prop === 'shield') { s += px(ox + 40, oy + 28, 7, 12, '#94a3b8'); s += px(ox + 42, oy + 30, 3, 8, '#cbd5e1'); }
    if (opt.prop === 'binoc') { s += px(ox + 28, oy + 20, 10, 4, '#1f2937'); s += px(ox + 28, oy + 20, 4, 4, '#374151'); s += px(ox + 34, oy + 20, 4, 4, '#374151'); }
    if (opt.prop === 'coffee') { s += px(ox + 30, oy + 30, 7, 6, '#e2e8f0'); s += px(ox + 31, oy + 31, 5, 3, C.coffee); s += px(ox + 32, oy + 26, 2, 3, C.steam, 'oa-steam'); }
    if (opt.prop === 'pen') { s += px(ox + 28, oy + 30, 12, 5, '#e2e8f0'); s += px(ox + 36, oy + 28, 2, 5, '#1f2937'); }
    /* Zzz kalau standby */
    if (opt.status === 'idle') { s += '<text x="' + (ox + 38) + '" y="' + (oy + 6) + '" fill="#94a3b8" font-size="7" class="oa-zzz">Zzz</text>'; }
    /* label nama */
    s += '<text x="' + (ox + 23) + '" y="' + (oy + 54) + '" fill="#cbd5e1" font-size="6" text-anchor="middle" font-family="monospace">' + opt.name + '</text>';
    /* bubble aktivitas (diisi paintOffice) */
    s += '<text id="oaBubble_' + opt.id + '" x="' + (ox + 23) + '" y="' + (oy - 2) + '" fill="#fde68a" font-size="5.5" text-anchor="middle" font-family="monospace"></text>';
    return s;
  }

  /* ===== bangun seluruh ruangan ===== */
  function buildRoom() {
    var W = 560, H = 320, s = '';
    s += '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
    /* latar */
    s += px(0, 0, W, H, C.wall);
    s += px(0, 200, W, 120, C.floor);
    /* neon KANTOR AGEN AI */
    s += px(40, 22, 150, 40, 'none');
    s += '<rect x="40" y="22" width="150" height="40" rx="6" fill="none" stroke="' + C.neonP + '" stroke-width="2" class="oa-neon"/>';
    s += '<text x="115" y="40" fill="' + C.neonC + '" font-size="13" text-anchor="middle" font-weight="bold" font-family="monospace" class="oa-neon">KANTOR</text>';
    s += '<text x="115" y="55" fill="' + C.neonP + '" font-size="11" text-anchor="middle" font-weight="bold" font-family="monospace" class="oa-neon">AGEN AI</text>';
    /* jam dinding */
    s += px(250, 26, 34, 34, '#1e293b');
    s += '<circle cx="267" cy="43" r="15" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>';
    s += '<line id="oaClockH" x1="267" y1="43" x2="267" y2="34" stroke="#1f2937" stroke-width="2"/>';
    s += '<line id="oaClockM" x1="267" y1="43" x2="275" y2="43" stroke="#1f2937" stroke-width="1.5"/>';
    s += '<text id="oaClockTxt" x="267" y="72" fill="#94a3b8" font-size="6" text-anchor="middle" font-family="monospace">--:--</text>';
    /* papan tugas sticky notes */
    s += px(330, 24, 90, 56, C.board);
    s += px(338, 32, 16, 12, C.note1); s += px(360, 30, 16, 12, C.note2);
    s += px(382, 33, 16, 12, C.note3); s += px(340, 50, 16, 12, C.note4);
    s += px(362, 52, 16, 12, C.note1); s += px(384, 49, 16, 12, C.note2);
    s += '<text x="375" y="20" fill="#94a3b8" font-size="6" text-anchor="middle" font-family="monospace">PAPAN TUGAS</text>';
    /* tanaman */
    s += px(222, 150, 16, 14, C.pot);
    s += px(218, 120, 24, 32, C.plant);
    s += px(224, 110, 12, 14, C.plant);
    /* mesin kopi */
    s += px(470, 150, 40, 50, '#334155');
    s += px(478, 158, 24, 18, '#1e293b');
    s += px(484, 178, 12, 10, C.coffee);
    s += px(486, 150, 3, 8, C.steam, 'oa-steam');
    s += px(492, 148, 3, 9, C.steam, 'oa-steam');
    s += '<text x="490" y="212" fill="#94a3b8" font-size="6" text-anchor="middle" font-family="monospace">KOPI ☕</text>';

    /* 8 agen: 2 baris x 4 */
    var defs = [
      { id: 'tech', name: 'Technical', prop: 'loupe', shirt: C.shirt2 },
      { id: 'fund', name: 'Fundamental', prop: 'book', shirt: C.shirt },
      { id: 'risk', name: 'Risk', prop: 'shield', shirt: C.shirt3 },
      { id: 'master', name: 'Master', prop: 'loupe', shirt: C.neonP },
      { id: 'scout', name: 'Swing Scout', prop: 'binoc', shirt: C.shirt },
      { id: 'night', name: 'Night Trader', prop: 'coffee', shirt: C.shirt3 },
      { id: 'sentry', name: 'Sentry', prop: 'binoc', shirt: C.shirt2 },
      { id: 'journal', name: 'Journalist', prop: 'pen', shirt: C.shirt }
    ];
    var positions = [
      [30, 92], [150, 92], [270, 92], [390, 92],
      [30, 196], [150, 196], [270, 196], [390, 196]
    ];
    OA._defs = defs;
    for (var i = 0; i < defs.length; i++) {
      defs[i].status = 'idle';
      s += agent(positions[i][0], positions[i][1], defs[i]);
    }
    s += '</svg>';
    return s;
  }

  /* ===== mount: sisipkan wrap ke dalam panel kantor (dipanggil office.js) ===== */
  OA.mount = function (container) {
    if (!container) return;
    var wrap = document.createElement('div');
    wrap.id = 'officeArtWrap';
    wrap.innerHTML = buildRoom();
    container.appendChild(wrap);
    OA.startClock();
  };

  /* ===== jam dinding sinkron WIB ===== */
  OA.startClock = function () {
    function tick() {
      try {
        var w = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        var h = w.getHours(), m = w.getMinutes();
        var ha = (h % 12) * 30 + m * 0.5;
        var ma = m * 6;
        var hh = document.getElementById('oaClockH');
        var mm = document.getElementById('oaClockM');
        var tt = document.getElementById('oaClockTxt');
        if (hh) { var hr = ha * Math.PI / 180; hh.setAttribute('x2', (267 + 9 * Math.sin(hr)).toFixed(1)); hh.setAttribute('y2', (43 - 9 * Math.cos(hr)).toFixed(1)); }
        if (mm) { var mr = ma * Math.PI / 180; mm.setAttribute('x2', (267 + 12 * Math.sin(mr)).toFixed(1)); mm.setAttribute('y2', (43 - 12 * Math.cos(mr)).toFixed(1)); }
        if (tt) tt.textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
      } catch (e) {}
    }
    tick();
    setInterval(tick, 15000);
  };

  /* ===== paintOffice: gerakkan sprite sesuai status nyata agen ===== */
  /* statusMap = { tech:'work', fund:'done', scout:'idle', ... } ; bubbles = { scout:'Scanning 43 saham...', ... } */
  OA.paint = function (statusMap, bubbles) {
    if (!OA._defs) return;
    for (var i = 0; i < OA._defs.length; i++) {
      var d = OA._defs[i];
      var st = (statusMap && statusMap[d.id]) || 'idle';
      /* update lampu + kelas animasi dengan rebuild ringan: cukup toggle via querySelector tidak mungkin tanpa id per-rect;
         jadi kita update bubble saja + simpan status untuk rebuild berikut */
      var bub = document.getElementById('oaBubble_' + d.id);
      if (bub) bub.textContent = (bubbles && bubbles[d.id]) ? bubbles[d.id] : '';
      d.status = st;
    }
    /* rebuild ruangan supaya lampu & animasi ikut status baru */
    var wrap = document.getElementById('officeArtWrap');
    if (wrap) wrap.innerHTML = buildRoom();
    /* isi ulang bubble setelah rebuild */
    if (bubbles) for (var k in bubbles) { var b = document.getElementById('oaBubble_' + k); if (b) b.textContent = bubbles[k]; }
  };

  /* status default saat pertama buka: semua idle (pasar belum tentu buka) */
  OA.defaultStatus = function () {
    var map = {}, bub = {};
    for (var i = 0; i < (OA._defs || []).length; i++) { map[OA._defs[i].id] = 'idle'; }
    return { map: map, bub: bub };
  };
})();
/* END office-art v1 */
