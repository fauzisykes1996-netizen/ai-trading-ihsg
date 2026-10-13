/* office-art.js - Kantor Agen AI 1/3 (Build v6.8) v2: ruang pixel-art detail + animasi */
(function () {
  window.OfficeArt = window.OfficeArt || {};
  var OA = window.OfficeArt;

  (function () {
    var st = document.createElement('style');
    st.textContent =
      '@keyframes oaBlink{0%,100%{opacity:1}50%{opacity:.25}}' +
      '@keyframes oaSteam{0%{transform:translateY(0);opacity:.75}100%{transform:translateY(-8px);opacity:0}}' +
      '@keyframes oaZzz{0%{transform:translateY(0);opacity:.85}100%{transform:translateY(-7px);opacity:0}}' +
      '@keyframes oaNeon{0%,100%{opacity:1}50%{opacity:.75}}' +
      '@keyframes oaType{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}' +
      '.oa-lamp-work{animation:oaBlink 1s infinite}' +
      '.oa-steam{animation:oaSteam 2.2s infinite}' +
      '.oa-zzz{animation:oaZzz 2.4s infinite}' +
      '.oa-neon{animation:oaNeon 2.6s infinite}' +
      '.oa-agent-work{animation:oaType .5s infinite}' +
      '#officeArtWrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:14px;background:#0b1426;border:1px solid rgba(99,102,241,.25)}' +
      '#officeArtWrap svg{display:block;min-width:560px;width:100%;height:auto}';
    document.head.appendChild(st);
  })();

  var C = {
    wall: '#16233f', floor: '#0d1830', base: '#1f2b47',
    desk: '#6b4423', deskTop: '#8b5e34', deskHi: '#a97648', drawer: '#7a512b',
    chair: '#263149', chairD: '#1b2436',
    bez: '#111827', scr: '#07130c', wick: 'rgba(34,197,94,.25)',
    up: '#22c55e', down: '#ef4444',
    skin: '#f0c08a', key: '#334155',
    neonP: '#c084fc', neonC: '#22d3ee', neonM: '#e879f9',
    board: '#8a5a2b', cork: '#b98a4e',
    leaf1: '#15803d', leaf2: '#16a34a', leaf3: '#166534', leaf4: '#22c55e', pot: '#b45309', potR: '#92400e',
    mach: '#475569', machD: '#334155', cup: '#f8fafc', cof: '#78350f', steam: '#cbd5e1',
    lampDone: '#22c55e', lampWork: '#facc15', lampIdle: '#64748b'
  };
  var HAIR = ['#5a3a22', '#1f2937', '#7c4a21', '#111827', '#4a2c17', '#292524', '#57534e', '#3f2d1c'];
  var SHIRT = ['#10b981', '#3b82f6', '#f59e0b', '#c084fc', '#38bdf8', '#f97316', '#14b8a6', '#eab308'];

  function px(x, y, w, h, fill, cls) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  }
  function txt(x, y, s, size, fill, anchor, cls) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '" font-family="monospace"' + (cls ? ' class="' + cls + '"' : '') + '>' + s + '</text>';
  }

  function candles(ox, oy) {
    var data = [6, 10, 7, 12, 9, 14, 11];
    var ups = [1, 1, 0, 1, 0, 1, 1];
    var s = '';
    for (var i = 0; i < data.length; i++) {
      var x = ox + 24 + i * 5;
      var v = data[i];
      s += px(x + 1, oy + 21, 1, 20, C.wick);
      s += px(x, oy + 21 + (16 - v), 3, v, ups[i] ? C.up : C.down);
    }
    return s;
  }

  function agent(ox, oy, opt, idx) {
    var s = '';
    var lampCol = opt.status === 'work' ? C.lampWork : (opt.status === 'done' ? C.lampDone : C.lampIdle);
    var lampCls = opt.status === 'work' ? 'oa-lamp-work' : '';
    var aCls = opt.status === 'work' ? 'oa-agent-work' : '';
    var hair = HAIR[idx % HAIR.length];
    var shirt = SHIRT[idx % SHIRT.length];
    s += px(ox + 6, oy + 80, 112, 5, 'rgba(0,0,0,.35)');
    s += px(ox + 8, oy + 52, 104, 8, C.deskTop);
    s += px(ox + 8, oy + 52, 104, 2, C.deskHi);
    s += px(ox + 14, oy + 60, 6, 20, C.desk);
    s += px(ox + 100, oy + 60, 6, 20, C.desk);
    s += px(ox + 40, oy + 60, 40, 14, C.drawer);
    s += px(ox + 46, oy + 64, 28, 2, C.desk);
    s += px(ox + 46, oy + 69, 28, 2, C.desk);
    s += px(ox + 18, oy + 16, 44, 30, C.bez);
    s += px(ox + 21, oy + 19, 38, 24, C.scr);
    s += candles(ox, oy);
    s += px(ox + 36, oy + 46, 8, 5, C.chairD);
    s += px(ox + 30, oy + 50, 20, 3, C.chairD);
    s += px(ox + 48, oy + 50, 26, 5, C.key);
    s += px(ox + 51, oy + 51, 3, 2, '#64748b');
    s += px(ox + 56, oy + 51, 3, 2, '#64748b');
    s += px(ox + 61, oy + 51, 3, 2, '#64748b');
    s += px(ox + 66, oy + 51, 3, 2, '#64748b');
    s += px(ox + 84, oy + 34, 8, 26, C.chair);
    s += px(ox + 68, oy + 58, 24, 5, C.chair);
    s += px(ox + 78, oy + 63, 4, 10, C.chairD);
    s += px(ox + 72, oy + 73, 16, 3, C.bez);
    s += '<g class="' + aCls + '">';
    s += px(ox + 70, oy + 30, 12, 12, C.skin);
    s += px(ox + 70, oy + 28, 12, 5, hair);
    s += px(ox + 80, oy + 30, 2, 9, hair);
    s += px(ox + 66, oy + 42, 18, 16, shirt);
    s += px(ox + 60, oy + 46, 10, 4, shirt);
    s += px(ox + 56, oy + 46, 4, 4, C.skin);
    s += '</g>';
    if (opt.prop === 'loupe') { s += px(ox + 50, oy + 38, 8, 8, '#e2e8f0'); s += px(ox + 52, oy + 40, 4, 4, '#93c5fd'); s += px(ox + 56, oy + 46, 2, 6, '#94a3b8'); }
    if (opt.prop === 'book') { s += px(ox + 62, oy + 45, 22, 6, '#f1f5f9'); s += px(ox + 72, oy + 45, 2, 6, '#94a3b8'); }
    if (opt.prop === 'shield') { s += px(ox + 112, oy + 42, 10, 24, '#94a3b8'); s += px(ox + 115, oy + 46, 4, 14, '#e2e8f0'); }
    if (opt.prop === 'tablet') { s += px(ox + 52, oy + 38, 10, 13, '#1e293b'); s += px(ox + 53, oy + 40, 8, 9, '#38bdf8'); }
    if (opt.prop === 'binoc') { s += px(ox + 64, oy + 33, 12, 5, '#111827'); s += px(ox + 62, oy + 32, 4, 7, '#374151'); s += px(ox + 74, oy + 32, 4, 7, '#374151'); }
    if (opt.prop === 'coffee') { s += px(ox + 94, oy + 44, 9, 8, C.cup); s += px(ox + 95, oy + 45, 7, 3, C.cof); s += px(ox + 97, oy + 37, 2, 6, C.steam, 'oa-steam'); }
    if (opt.prop === 'radio') { s += px(ox + 94, oy + 42, 8, 10, '#1e293b'); s += px(ox + 97, oy + 35, 1, 7, '#94a3b8'); s += px(ox + 96, oy + 44, 2, 2, '#ef4444'); }
    if (opt.prop === 'pen') { s += px(ox + 62, oy + 45, 22, 6, '#f8fafc'); s += px(ox + 65, oy + 47, 16, 1, '#94a3b8'); s += px(ox + 82, oy + 40, 2, 8, '#0f172a'); }
    s += px(ox + 64, oy + 8, 7, 7, lampCol, lampCls);
    if (opt.status === 'idle') s += txt(ox + 92, oy + 24, 'Zzz', 7, '#94a3b8', 'middle', 'oa-zzz');
    s += txt(ox + 60, oy + 94, opt.name, 7, '#cbd5e1');
    s += txt(ox + 60, oy + 4, '', 6.5, '#fde68a', 'middle');
    s += '<text id="oaBubble_' + opt.id + '" x="' + (ox + 60) + '" y="' + (oy + 4) + '" font-size="6.5" fill="#fde68a" text-anchor="middle" font-family="monospace"></text>';
    return s;
  }

  function buildRoom() {
    var W = 640, H = 340, s = '';
    s += '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
    s += px(0, 0, W, 200, C.wall);
    s += px(0, 200, W, 140, C.floor);
    s += px(0, 198, W, 3, C.base);
    s += '<g class="oa-neon">';
    s += '<rect x="28" y="12" width="154" height="50" rx="9" fill="none" stroke="' + C.neonP + '" stroke-width="6" opacity=".3"/>';
    s += '<rect x="30" y="14" width="150" height="46" rx="8" fill="rgba(192,132,252,.08)" stroke="' + C.neonP + '" stroke-width="2.5"/>';
    s += txt(105, 34, 'KANTOR', 16, C.neonC);
    s += txt(105, 52, 'AGEN AI', 13, C.neonM);
    s += '</g>';
    s += '<rect x="200" y="16" width="44" height="52" fill="#1e293b" stroke="#334155" stroke-width="2"/>';
    s += px(206, 40, 8, 26, '#0f172a');
    s += px(217, 32, 9, 34, '#0f172a');
    s += px(229, 44, 8, 22, '#0f172a');
    s += '<circle cx="270" cy="44" r="20" fill="#e5e7eb" stroke="#475569" stroke-width="3"/>';
    s += px(269, 27, 2, 4, '#475569');
    s += px(269, 57, 2, 4, '#475569');
    s += px(253, 43, 4, 2, '#475569');
    s += px(283, 43, 4, 2, '#475569');
    s += '<line id="oaClockH" x1="270" y1="44" x2="270" y2="35" stroke="#1f2937" stroke-width="2.5"/>';
    s += '<line id="oaClockM" x1="270" y1="44" x2="270" y2="30" stroke="#1f2937" stroke-width="1.5"/>';
    s += '<circle cx="270" cy="44" r="2" fill="#1f2937"/>';
    s += txt(270, 78, '--:--', 7, '#94a3b8', 'middle');
    s += '<text id="oaClockTxt" x="270" y="78" font-size="7" fill="#94a3b8" text-anchor="middle" font-family="monospace"></text>';
    s += txt(420, 12, 'PAPAN TUGAS', 6.5, '#94a3b8');
    s += px(360, 16, 120, 64, C.board);
    s += px(365, 21, 110, 54, C.cork);
    var notes = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#fde047'];
    var npos = [[372, 28], [398, 26], [424, 30], [374, 48], [400, 50], [426, 46]];
    for (var n = 0; n < 6; n++) {
      s += px(npos[n][0], npos[n][1], 18, 14, notes[n]);
      s += px(npos[n][0] + 8, npos[n][1] - 1, 2, 2, '#7f1d1d');
    }
    s += px(480, 44, 130, 6, C.drawer);
    s += px(490, 30, 6, 14, '#b91c1c');
    s += px(498, 28, 6, 16, '#1d4ed8');
    s += px(506, 31, 6, 13, '#15803d');
    s += px(540, 30, 10, 14, '#facc15');
    s += px(543, 26, 4, 4, '#facc15');
    s += px(560, 32, 14, 12, '#94a3b8');
    s += px(140, 168, 26, 5, C.potR);
    s += px(143, 172, 20, 16, C.pot);
    s += px(141, 140, 24, 30, C.leaf1);
    s += px(147, 128, 12, 16, C.leaf2);
    s += px(135, 148, 8, 16, C.leaf3);
    s += px(163, 148, 8, 16, C.leaf3);
    s += px(149, 134, 4, 12, C.leaf4);
    s += px(430, 152, 44, 8, C.machD);
    s += px(434, 160, 36, 40, C.mach);
    s += px(440, 166, 16, 9, '#1e293b');
    s += px(442, 168, 3, 3, '#ef4444');
    s += px(448, 168, 3, 3, '#22c55e');
    s += px(448, 178, 8, 6, '#1e293b');
    s += px(446, 188, 12, 9, C.cup);
    s += px(448, 189, 8, 4, C.cof);
    s += px(450, 178, 2, 6, C.steam, 'oa-steam');
    s += px(456, 174, 2, 7, C.steam, 'oa-steam');
    s += px(430, 200, 44, 10, C.machD);
    s += txt(452, 222, 'KOPI', 6.5, '#94a3b8');
    var defs = [
      { id: 'tech', name: 'Technical', prop: 'loupe' },
      { id: 'fund', name: 'Fundamental', prop: 'book' },
      { id: 'risk', name: 'Risk', prop: 'shield' },
      { id: 'master', name: 'Master', prop: 'tablet' },
      { id: 'scout', name: 'Swing Scout', prop: 'binoc' },
      { id: 'night', name: 'Night Trader', prop: 'coffee' },
      { id: 'sentry', name: 'Sentry', prop: 'radio' },
      { id: 'journal', name: 'Journalist', prop: 'pen' }
    ];
    OA._defs = defs;
    var pos = [[12, 92], [168, 92], [324, 92], [480, 92], [12, 212], [168, 212], [324, 212], [480, 212]];
    for (var i = 0; i < defs.length; i++) {
      defs[i].status = 'idle';
      s += agent(pos[i][0], pos[i][1], defs[i], i);
    }
    s += '</svg>';
    return s;
  }

  OA.mount = function (container) {
    if (!container) return;
    var wrap = document.createElement('div');
    wrap.id = 'officeArtWrap';
    wrap.innerHTML = buildRoom();
    container.appendChild(wrap);
    OA.startClock();
  };

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
        if (hh) { var hr = ha * Math.PI / 180; hh.setAttribute('x2', (270 + 9 * Math.sin(hr)).toFixed(1)); hh.setAttribute('y2', (44 - 9 * Math.cos(hr)).toFixed(1)); }
        if (mm) { var mr = ma * Math.PI / 180; mm.setAttribute('x2', (270 + 14 * Math.sin(mr)).toFixed(1)); mm.setAttribute('y2', (44 - 14 * Math.cos(mr)).toFixed(1)); }
        if (tt) tt.textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
      } catch (e) {}
    }
    tick();
    setInterval(tick, 15000);
  };

  OA.paint = function (statusMap, bubbles) {
    if (!OA._defs) return;
    for (var i = 0; i < OA._defs.length; i++) {
      var d = OA._defs[i];
      d.status = (statusMap && statusMap[d.id]) || 'idle';
    }
    var wrap = document.getElementById('officeArtWrap');
    if (wrap) wrap.innerHTML = buildRoom();
    if (bubbles) for (var k in bubbles) { var b = document.getElementById('oaBubble_' + k); if (b) b.textContent = bubbles[k]; }
  };

  OA.defaultStatus = function () {
    var map = {};
    for (var i = 0; i < (OA._defs || []).length; i++) map[OA._defs[i].id] = 'idle';
    return { map: map, bub: {} };
  };
})();
/* END office-art v2 */
