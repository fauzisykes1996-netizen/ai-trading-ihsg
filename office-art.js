/* office-art.js - Kantor Agen AI 1/3 (Build v6.8) v3: 64-bit HD detail */
(function () {
  window.OfficeArt = window.OfficeArt || {};
  var OA = window.OfficeArt;

  (function () {
    var st = document.createElement('style');
    st.textContent =
      '@keyframes oaBlink{0%,100%{opacity:1}50%{opacity:.2}}' +
      '@keyframes oaSteam1{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-10px) scale(1.3);opacity:0}}' +
      '@keyframes oaSteam2{0%{transform:translateY(0) scale(.8);opacity:.6}100%{transform:translateY(-12px) scale(1.5);opacity:0}}' +
      '@keyframes oaZzz{0%{transform:translateY(0) translateX(0);opacity:.9}100%{transform:translateY(-8px) translateX(3px);opacity:0}}' +
      '@keyframes oaNeon{0%,100%{opacity:1;filter:drop-shadow(0 0 4px #c084fc)}50%{opacity:.85;filter:drop-shadow(0 0 2px #c084fc)}}' +
      '@keyframes oaType{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}' +
      '@keyframes oaLampPulse{0%,100%{filter:drop-shadow(0 0 2px currentColor)}50%{filter:drop-shadow(0 0 6px currentColor)}}' +
      '.oa-lamp-work{animation:oaBlink 1s infinite,oaLampPulse 1s infinite}' +
      '.oa-steam1{animation:oaSteam1 2.5s infinite}' +
      '.oa-steam2{animation:oaSteam2 2.8s infinite .3s}' +
      '.oa-zzz{animation:oaZzz 2.6s infinite}' +
      '.oa-neon{animation:oaNeon 2.8s infinite}' +
      '.oa-agent-work{animation:oaType .4s infinite}' +
      '#officeArtWrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px;background:#0a1428;border:1px solid rgba(99,102,241,.3);box-shadow:0 8px 32px rgba(0,0,0,.4)}' +
      '#officeArtWrap svg{display:block;min-width:720px;width:100%;height:auto}';
    document.head.appendChild(st);
  })();

  var C = {
    wall: '#1a2d4a', wallHi: '#243a5c', floor: '#0f1a30', floorHi: '#1a2740', base: '#2a3f5f',
    desk: '#6b4423', deskTop: '#8b5e34', deskHi: '#a97648', deskLo: '#5a3a1e', drawer: '#7a512b', drawerHi: '#8b6235',
    chair: '#2d3a52', chairD: '#1e2838', chairHi: '#3d4a62', chrome: '#94a3b8',
    bez: '#0f172a', bezHi: '#1e293b', scr: '#0a1510', scrHi: '#0f1f18',
    up: '#22c55e', upHi: '#4ade80', down: '#ef4444', downHi: '#f87171', wick: 'rgba(34,197,94,.2)',
    skin: '#f4c9a0', skinSh: '#d9a87c',
    neonP: '#c084fc', neonC: '#22d3ee', neonM: '#e879f9', neonG: '#a855f7',
    board: '#8b6235', cork: '#c9a06a', corkHi: '#d4b07a',
    leaf1: '#15803d', leaf2: '#16a34a', leaf3: '#166534', leaf4: '#22c55e', leaf5: '#4ade80', pot: '#b45309', potHi: '#d97706', potSh: '#92400e',
    mach: '#475569', machD: '#334155', machHi: '#64748b', cup: '#f8fafc', cupSh: '#e2e8f0', cof: '#78350f', steam: '#cbd5e1', steamHi: '#e2e8f0',
    lampDone: '#22c55e', lampWork: '#facc15', lampIdle: '#64748b',
    carpet: '#1e3a5f', carpetHi: '#2a4a70'
  };
  var HAIR = ['#5a3a22', '#1f2937', '#7c4a21', '#111827', '#4a2c17', '#292524', '#57534e', '#3f2d1c'];
  var SHIRT = ['#10b981', '#3b82f6', '#f59e0b', '#c084fc', '#38bdf8', '#f97316', '#14b8a6', '#eab308'];

  function px(x, y, w, h, fill, cls) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  }
  function txt(x, y, s, size, fill, anchor, cls) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '" font-family="monospace"' + (cls ? ' class="' + cls + '"' : '') + '>' + s + '</text>';
  }
  function circ(cx, cy, r, fill, cls) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  }

  function candlesHD(ox, oy) {
    var data = [8, 12, 9, 15, 11, 17, 13, 16, 10, 14];
    var ups = [1, 1, 0, 1, 0, 1, 1, 1, 0, 1];
    var s = '';
    for (var i = 0; i < data.length; i++) {
      var x = ox + 20 + i * 4;
      var v = data[i];
      s += px(x + 1, oy + 18, 1, 24, C.wick);
      var col = ups[i] ? C.up : C.down;
      var colHi = ups[i] ? C.upHi : C.downHi;
      s += px(x, oy + 18 + (20 - v), 3, v, col);
      s += px(x, oy + 18 + (20 - v), 3, 2, colHi);
    }
    return s;
  }

  function agentHD(ox, oy, opt, idx) {
    var s = '';
    var lampCol = opt.status === 'work' ? C.lampWork : (opt.status === 'done' ? C.lampDone : C.lampIdle);
    var lampCls = opt.status === 'work' ? 'oa-lamp-work' : '';
    var aCls = opt.status === 'work' ? 'oa-agent-work' : '';
    var hair = HAIR[idx % HAIR.length];
    var shirt = SHIRT[idx % SHIRT.length];
    var shirtHi = shirt;
    s += px(ox + 4, oy + 88, 132, 8, 'rgba(0,0,0,.4)');
    s += px(ox + 8, oy + 60, 124, 10, C.deskTop);
    s += px(ox + 8, oy + 60, 124, 3, C.deskHi);
    s += px(ox + 8, oy + 70, 124, 2, C.deskLo);
    s += px(ox + 14, oy + 72, 8, 24, C.desk);
    s += px(ox + 14, oy + 72, 3, 24, C.deskHi);
    s += px(ox + 118, oy + 72, 8, 24, C.desk);
    s += px(ox + 118, oy + 72, 3, 24, C.deskHi);
    s += px(ox + 40, oy + 72, 60, 18, C.drawer);
    s += px(ox + 40, oy + 72, 60, 2, C.drawerHi);
    s += px(ox + 46, oy + 78, 48, 2, C.deskLo);
    s += px(ox + 46, oy + 84, 48, 2, C.deskLo);
    s += px(ox + 68, oy + 80, 4, 2, '#475569');
    s += px(ox + 18, oy + 14, 52, 36, C.bez);
    s += px(ox + 18, oy + 14, 52, 3, C.bezHi);
    s += px(ox + 21, oy + 17, 46, 30, C.scr);
    s += px(ox + 21, oy + 17, 46, 2, C.scrHi);
    s += candlesHD(ox, oy);
    s += px(ox + 38, oy + 50, 12, 6, C.chairD);
    s += px(ox + 38, oy + 50, 12, 2, C.chairHi);
    s += px(ox + 28, oy + 56, 32, 4, C.chair);
    s += px(ox + 28, oy + 56, 32, 1, C.chairHi);
    s += px(ox + 52, oy + 58, 30, 6, C.key);
    s += px(ox + 52, oy + 58, 30, 1, '#475569');
    for (var ki = 0; ki < 6; ki++) s += px(ox + 55 + ki * 4, oy + 60, 2, 2, '#64748b');
    s += px(ox + 86, oy + 30, 12, 30, C.chair);
    s += px(ox + 86, oy + 30, 4, 30, C.chairHi);
    s += px(ox + 68, oy + 60, 28, 6, C.chair);
    s += px(ox + 68, oy + 60, 28, 1, C.chairHi);
    s += px(ox + 80, oy + 66, 4, 12, C.chrome);
    s += px(ox + 74, oy + 78, 16, 4, C.chrome);
    s += circ(ox + 76, oy + 82, 2, C.chairD);
    s += circ(ox + 88, oy + 82, 2, C.chairD);
    s += '<g class="' + aCls + '">';
    s += px(ox + 72, oy + 28, 16, 16, C.skin);
    s += px(ox + 72, oy + 28, 16, 2, C.skinSh);
    s += px(ox + 72, oy + 24, 16, 8, hair);
    s += px(ox + 72, oy + 24, 16, 2, hair);
    s += px(ox + 86, oy + 28, 2, 12, hair);
    s += px(ox + 74, oy + 32, 2, 2, '#1f2937');
    s += px(ox + 82, oy + 32, 2, 2, '#1f2937');
    s += px(ox + 76, oy + 36, 6, 1, '#1f2937');
    s += px(ox + 66, oy + 44, 22, 20, shirt);
    s += px(ox + 66, oy + 44, 22, 2, shirtHi);
    s += px(ox + 58, oy + 48, 12, 5, shirt);
    s += px(ox + 58, oy + 48, 12, 1, shirtHi);
    s += px(ox + 54, oy + 50, 6, 5, C.skin);
    s += px(ox + 54, oy + 50, 6, 1, C.skinSh);
    s += '</g>';
    if (opt.prop === 'loupe') { s += px(ox + 50, oy + 40, 10, 10, '#e2e8f0'); s += px(ox + 50, oy + 40, 10, 2, '#f1f5f9'); s += px(ox + 52, oy + 42, 6, 6, '#93c5fd'); s += px(ox + 52, oy + 42, 6, 1, '#bfdbfe'); s += px(ox + 58, oy + 50, 2, 8, '#94a3b8'); }
    if (opt.prop === 'book') { s += px(ox + 62, oy + 48, 26, 8, '#f1f5f9'); s += px(ox + 62, oy + 48, 26, 1, '#e2e8f0'); s += px(ox + 74, oy + 48, 2, 8, '#94a3b8'); s += px(ox + 64, oy + 50, 8, 1, '#cbd5e1'); s += px(ox + 64, oy + 52, 8, 1, '#cbd5e1'); s += px(ox + 78, oy + 50, 8, 1, '#cbd5e1'); s += px(ox + 78, oy + 52, 8, 1, '#cbd5e1'); }
    if (opt.prop === 'shield') { s += px(ox + 114, oy + 44, 12, 28, '#94a3b8'); s += px(ox + 114, oy + 44, 12, 2, '#cbd5e1'); s += px(ox + 118, oy + 48, 4, 18, '#e2e8f0'); s += px(ox + 116, oy + 50, 8, 2, '#64748b'); }
    if (opt.prop === 'tablet') { s += px(ox + 52, oy + 40, 12, 16, '#1e293b'); s += px(ox + 52, oy + 40, 12, 1, '#334155'); s += px(ox + 53, oy + 41, 10, 14, '#38bdf8'); s += px(ox + 53, oy + 41, 10, 1, '#7dd3fc'); }
    if (opt.prop === 'binoc') { s += px(ox + 64, oy + 34, 14, 6, '#111827'); s += px(ox + 64, oy + 34, 14, 1, '#374151'); s += px(ox + 62, oy + 33, 5, 8, '#374151'); s += px(ox + 62, oy + 33, 5, 1, '#4b5563'); s += px(ox + 73, oy + 33, 5, 8, '#374151'); s += px(ox + 73, oy + 33, 5, 1, '#4b5563'); }
    if (opt.prop === 'coffee') { s += px(ox + 96, oy + 46, 11, 10, C.cup); s += px(ox + 96, oy + 46, 11, 1, C.cupSh); s += px(ox + 97, oy + 47, 9, 4, C.cof); s += px(ox + 97, oy + 47, 9, 1, '#92400e'); s += px(ox + 99, oy + 38, 3, 8, C.steam, 'oa-steam1'); s += px(ox + 103, oy + 36, 2, 9, C.steam, 'oa-steam2'); }
    if (opt.prop === 'radio') { s += px(ox + 96, oy + 44, 10, 12, '#1e293b'); s += px(ox + 96, oy + 44, 10, 1, '#334155'); s += px(ox + 99, oy + 36, 1, 8, '#94a3b8'); s += px(ox + 98, oy + 46, 2, 2, '#ef4444'); s += px(ox + 102, oy + 46, 2, 2, '#22c55e'); }
    if (opt.prop === 'pen') { s += px(ox + 62, oy + 48, 26, 8, '#f8fafc'); s += px(ox + 62, oy + 48, 26, 1, '#e2e8f0'); s += px(ox + 64, oy + 50, 22, 1, '#94a3b8'); s += px(ox + 64, oy + 52, 22, 1, '#94a3b8'); s += px(ox + 64, oy + 54, 22, 1, '#94a3b8'); s += px(ox + 84, oy + 42, 2, 10, '#0f172a'); s += px(ox + 84, oy + 42, 2, 1, '#1e293b'); }
    s += px(ox + 66, oy + 6, 8, 8, lampCol, lampCls);
    s += px(ox + 66, oy + 6, 8, 2, lampCol);
    if (opt.status === 'idle') s += txt(ox + 96, oy + 20, 'Zzz', 8, '#94a3b8', 'middle', 'oa-zzz');
    s += txt(ox + 74, oy + 102, opt.name, 8, '#cbd5e1');
    s += '<text id="oaBubble_' + opt.id + '" x="' + (ox + 74) + '" y="' + (oy + 2) + '" font-size="7" fill="#fde68a" text-anchor="middle" font-family="monospace"></text>';
    return s;
  }

  function buildRoomHD() {
    var W = 800, H = 450, s = '';
    s += '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
    s += px(0, 0, W, 260, C.wall);
    s += px(0, 0, W, 4, C.wallHi);
    s += px(0, 260, W, 190, C.floor);
    s += px(0, 260, W, 4, C.floorHi);
    s += px(0, 258, W, 4, C.base);
    s += px(40, 280, W - 80, 140, C.carpet);
    s += px(40, 280, W - 80, 3, C.carpetHi);
    s += '<g class="oa-neon">';
    s += '<rect x="32" y="14" width="168" height="58" rx="10" fill="none" stroke="' + C.neonP + '" stroke-width="8" opacity=".25"/>';
    s += '<rect x="34" y="16" width="164" height="54" rx="9" fill="rgba(192,132,252,.06)" stroke="' + C.neonP + '" stroke-width="3"/>';
    s += '<rect x="36" y="18" width="160" height="50" rx="8" fill="none" stroke="' + C.neonC + '" stroke-width="1" opacity=".5"/>';
    s += txt(118, 40, 'KANTOR', 18, C.neonC);
    s += txt(118, 60, 'AGEN AI', 15, C.neonM);
    s += '</g>';
    s += '<rect x="240" y="18" width="52" height="62" fill="#1e293b" stroke="#334155" stroke-width="2"/>';
    s += px(248, 48, 10, 30, '#0f172a');
    s += px(262, 38, 10, 40, '#0f172a');
    s += px(276, 52, 10, 26, '#0f172a');
    s += '<circle cx="320" cy="52" r="24" fill="#e5e7eb" stroke="#475569" stroke-width="3"/>';
    s += '<circle cx="320" cy="52" r="20" fill="#f3f4f6"/>';
    s += px(319, 32, 2, 5, '#475569');
    s += px(319, 67, 2, 5, '#475569');
    s += px(300, 51, 5, 2, '#475569');
    s += px(335, 51, 5, 2, '#475569');
    s += '<line id="oaClockH" x1="320" y1="52" x2="320" y2="42" stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>';
    s += '<line id="oaClockM" x1="320" y1="52" x2="320" y2="36" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>';
    s += '<circle cx="320" cy="52" r="2.5" fill="#1f2937"/>';
    s += txt(320, 86, '--:--', 8, '#94a3b8', 'middle');
    s += '<text id="oaClockTxt" x="320" y="86" font-size="8" fill="#94a3b8" text-anchor="middle" font-family="monospace"></text>';
    s += txt(520, 14, 'PAPAN TUGAS', 7.5, '#94a3b8');
    s += px(440, 18, 140, 74, C.board);
    s += px(440, 18, 140, 2, C.board);
    s += px(445, 23, 130, 64, C.cork);
    s += px(445, 23, 130, 2, C.corkHi);
    var notes = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#fde047', '#a78bfa', '#fb923c'];
    var npos = [[452, 30], [480, 28], [508, 32], [454, 52], [482, 54], [510, 50], [460, 72], [490, 70]];
    for (var n = 0; n < 8; n++) {
      s += px(npos[n][0], npos[n][1], 20, 16, notes[n]);
      s += px(npos[n][0], npos[n][1], 20, 1, notes[n]);
      s += px(npos[n][0] + 9, npos[n][1] - 1, 2, 2, '#7f1d1d');
    }
    s += px(600, 50, 150, 8, C.drawer);
    s += px(600, 50, 150, 1, C.drawerHi);
    s += px(610, 34, 8, 16, '#b91c1c');
    s += px(610, 34, 8, 1, '#dc2626');
    s += px(622, 32, 8, 18, '#1d4ed8');
    s += px(622, 32, 8, 1, '#2563eb');
    s += px(634, 36, 8, 14, '#15803d');
    s += px(634, 36, 8, 1, '#16a34a');
    s += px(660, 34, 12, 16, '#facc15');
    s += px(660, 34, 12, 1, '#fde047');
    s += px(664, 30, 4, 4, '#facc15');
    s += px(680, 38, 16, 14, '#94a3b8');
    s += px(680, 38, 16, 1, '#cbd5e1');
    s += px(684, 34, 8, 4, '#64748b');
    s += px(180, 220, 32, 6, C.potSh);
    s += px(184, 226, 24, 20, C.pot);
    s += px(184, 226, 24, 2, C.potHi);
    s += px(180, 180, 32, 40, C.leaf1);
    s += px(188, 164, 16, 20, C.leaf2);
    s += px(188, 164, 16, 2, C.leaf5);
    s += px(174, 188, 10, 20, C.leaf3);
    s += px(202, 188, 10, 20, C.leaf3);
    s += px(190, 170, 6, 16, C.leaf4);
    s += px(196, 174, 4, 12, C.leaf5);
    s += px(520, 200, 52, 10, C.machD);
    s += px(520, 200, 52, 1, C.machHi);
    s += px(524, 210, 44, 48, C.mach);
    s += px(524, 210, 44, 2, C.machHi);
    s += px(530, 218, 20, 12, '#1e293b');
    s += px(530, 218, 20, 1, '#334155');
    s += px(534, 222, 4, 4, '#ef4444');
    s += px(542, 222, 4, 4, '#22c55e');
    s += px(538, 234, 10, 8, '#1e293b');
    s += px(536, 244, 14, 12, C.cup);
    s += px(536, 244, 14, 1, C.cupSh);
    s += px(538, 246, 10, 5, C.cof);
    s += px(538, 246, 10, 1, '#92400e');
    s += px(540, 234, 3, 8, C.steam, 'oa-steam1');
    s += px(546, 230, 2, 10, C.steam, 'oa-steam2');
    s += px(520, 260, 52, 12, C.machD);
    s += px(520, 260, 52, 1, C.machHi);
    s += txt(546, 282, 'KOPI ☕', 7.5, '#94a3b8');
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
    var pos = [[12, 110], [196, 110], [380, 110], [564, 110], [12, 240], [196, 240], [380, 240], [564, 240]];
    for (var i = 0; i < defs.length; i++) {
      defs[i].status = 'idle';
      s += agentHD(pos[i][0], pos[i][1], defs[i], i);
    }
    s += '</svg>';
    return s;
  }

  OA.mount = function (container) {
    if (!container) return;
    var wrap = document.createElement('div');
    wrap.id = 'officeArtWrap';
    wrap.innerHTML = buildRoomHD();
    container.appendChild(wrap);
    OA.startClock();
  };

  OA.startClock = function () {
    function tick() {
      try {
        var w = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        var h = w.getHours(), m = w.getMinutes(), sec = w.getSeconds();
        var ha = (h % 12) * 30 + m * 0.5;
        var ma = m * 6 + sec * 0.1;
        var hh = document.getElementById('oaClockH');
        var mm = document.getElementById('oaClockM');
        var tt = document.getElementById('oaClockTxt');
        if (hh) { var hr = ha * Math.PI / 180; hh.setAttribute('x2', (320 + 10 * Math.sin(hr)).toFixed(1)); hh.setAttribute('y2', (52 - 10 * Math.cos(hr)).toFixed(1)); }
        if (mm) { var mr = ma * Math.PI / 180; mm.setAttribute('x2', (320 + 16 * Math.sin(mr)).toFixed(1)); mm.setAttribute('y2', (52 - 16 * Math.cos(mr)).toFixed(1)); }
        if (tt) tt.textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
      } catch (e) {}
    }
    tick();
    setInterval(tick, 1000);
  };

  OA.paint = function (statusMap, bubbles) {
    if (!OA._defs) return;
    for (var i = 0; i < OA._defs.length; i++) {
      var d = OA._defs[i];
      d.status = (statusMap && statusMap[d.id]) || 'idle';
    }
    var wrap = document.getElementById('officeArtWrap');
    if (wrap) wrap.innerHTML = buildRoomHD();
    if (bubbles) for (var k in bubbles) { var b = document.getElementById('oaBubble_' + k); if (b) b.textContent = bubbles[k]; }
  };

  OA.defaultStatus = function () {
    var map = {};
    for (var i = 0; i < (OA._defs || []).length; i++) map[OA._defs[i].id] = 'idle';
    return { map: map, bub: {} };
  };
})();
/* END office-art v3 */
