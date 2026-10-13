/* office-art.js - Kantor Agen AI 1/3 (Build v6.8) v4: 3D Isometric HD */
(function () {
  window.OfficeArt = window.OfficeArt || {};
  var OA = window.OfficeArt;

  (function () {
    var st = document.createElement('style');
    st.textContent =
      '@keyframes oaBlink{0%,100%{opacity:1}50%{opacity:.3}}' +
      '@keyframes oaBubble{0%,100%{opacity:.9}50%{opacity:.6}}' +
      '@keyframes oaLamp{0%,100%{filter:drop-shadow(0 0 3px #fbbf24)}50%{filter:drop-shadow(0 0 6px #fbbf24)}}' +
      '.oa-lamp-work{animation:oaBlink 1.2s infinite}' +
      '.oa-bubble{animation:oaBubble 2s infinite}' +
      '.oa-lamp-glow{animation:oaLamp 2s infinite}' +
      '#officeArtWrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:16px;background:#1a0f0a;border:1px solid rgba(251,191,36,.3);box-shadow:0 8px 32px rgba(0,0,0,.5)}' +
      '#officeArtWrap svg{display:block;min-width:800px;width:100%;height:auto}';
    document.head.appendChild(st);
  })();

  var C = {
    floor1: '#d4a574', floor2: '#c4956a', wall: '#2d1b4e', wallHi: '#3d2b5e',
    desk: '#8b6235', deskTop: '#a97648', deskSide: '#6b4423',
    chair: '#4a3728', chairD: '#3a2718',
    monitor: '#d4c4a8', monitorD: '#b4a488', screen: '#1a3a2a', screenHi: '#2a4a3a',
    up: '#22c55e', down: '#ef4444',
    skin: '#f4c9a0', skinSh: '#d9a87c',
    hair: ['#5a3a22', '#1f2937', '#7c4a21', '#111827', '#4a2c17', '#292524', '#57534e', '#3f2d1c'],
    shirt: ['#10b981', '#3b82f6', '#f59e0b', '#c084fc', '#38bdf8', '#f97316', '#14b8a6', '#eab308'],
    book: ['#b91c1c', '#1d4ed8', '#15803d', '#f59e0b', '#7c3aed', '#db2777', '#0891b2', '#ea580c'],
    lamp: '#fbbf24', lampGlow: '#fde047',
    plant: '#15803d', plantHi: '#16a34a', pot: '#92400e', potHi: '#b45309',
    board: '#1e293b', boardHi: '#334155',
    bubble: '#fef3c7', bubbleBorder: '#fbbf24'
  };

  function iso(x, y, z) {
    var ix = (x - y) * 0.866;
    var iy = (x + y) * 0.5 - z;
    return { x: ix, y: iy };
  }

  function isoRect(x, y, w, h, z, fill, cls) {
    var p1 = iso(x, y, z);
    var p2 = iso(x + w, y, z);
    var p3 = iso(x + w, y + h, z);
    var p4 = iso(x, y + h, z);
    return '<polygon points="' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1) + ' ' + p3.x.toFixed(1) + ',' + p3.y.toFixed(1) + ' ' + p4.x.toFixed(1) + ',' + p4.y.toFixed(1) + '" fill="' + fill + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  }

  function isoBox(x, y, w, h, d, top, side, front) {
    var s = '';
    s += isoRect(x, y, w, h, d, top);
    s += isoRect(x, y + h, w, 0, d, side);
    s += isoRect(x + w, y, 0, h, d, front);
    return s;
  }

  function txt(x, y, s, size, fill, anchor, cls) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (anchor || 'middle') + '" font-family="monospace"' + (cls ? ' class="' + cls + '"' : '') + '>' + s + '</text>';
  }

  function candlesIso(ox, oy) {
    var data = [6, 9, 7, 11, 8, 12, 9];
    var ups = [1, 1, 0, 1, 0, 1, 1];
    var s = '';
    for (var i = 0; i < data.length; i++) {
      var x = ox + 20 + i * 3;
      var v = data[i];
      var col = ups[i] ? C.up : C.down;
      s += '<rect x="' + x + '" y="' + (oy + 10 - v) + '" width="2" height="' + v + '" fill="' + col + '"/>';
    }
    return s;
  }

  function agentIso(ox, oy, opt, idx) {
    var s = '';
    var lampCol = opt.status === 'work' ? C.lamp : '#94a3b8';
    var lampCls = opt.status === 'work' ? 'oa-lamp-work' : '';
    var hair = C.hair[idx % C.hair.length];
    var shirt = C.shirt[idx % C.shirt.length];
    s += isoBox(ox, oy, 40, 30, 0, C.deskTop, C.deskSide, C.desk);
    s += isoRect(ox + 5, oy + 5, 30, 20, 2, C.monitorD);
    s += isoRect(ox + 7, oy + 7, 26, 16, 2, C.screen);
    s += candlesIso(ox + 7, oy + 7);
    s += isoRect(ox + 12, oy + 25, 16, 4, 0, C.chair);
    s += '<g>';
    s += '<circle cx="' + (ox + 20) + '" cy="' + (oy + 15) + '" r="5" fill="' + C.skin + '"/>';
    s += '<path d="M' + (ox + 15) + ',' + (oy + 15) + ' Q' + (ox + 20) + ',' + (oy + 8) + ' ' + (ox + 25) + ',' + (oy + 15) + ' Z" fill="' + hair + '"/>';
    s += '<rect x="' + (ox + 14) + '" y="' + (oy + 20) + '" width="12" height="10" fill="' + shirt + '"/>';
    s += '</g>';
    if (opt.prop === 'loupe') s += '<circle cx="' + (ox + 28) + '" cy="' + (oy + 22) + '" r="3" fill="#93c5fd" stroke="#60a5fa" stroke-width="1"/>';
    if (opt.prop === 'book') s += '<rect x="' + (ox + 26) + '" y="' + (oy + 24) + '" width="8" height="6" fill="#f1f5f9"/>';
    if (opt.prop === 'shield') s += '<polygon points="' + (ox + 30) + ',' + (oy + 20) + ' ' + (ox + 34) + ',' + (oy + 22) + ' ' + (ox + 34) + ',' + (oy + 28) + ' ' + (ox + 30) + ',' + (oy + 30) + '" fill="#94a3b8"/>';
    if (opt.prop === 'tablet') s += '<rect x="' + (ox + 26) + '" y="' + (oy + 22) + '" width="8" height="10" fill="#38bdf8"/>';
    if (opt.prop === 'binoc') s += '<rect x="' + (ox + 24) + '" y="' + (oy + 18) + '" width="10" height="4" fill="#111827"/>';
    if (opt.prop === 'coffee') { s += '<rect x="' + (ox + 28) + '" y="' + (oy + 24) + '" width="6" height="6" fill="#f8fafc"/>'; s += '<rect x="' + (ox + 29) + '" y="' + (oy + 25) + '" width="4" height="3" fill="#78350f"/>'; }
    if (opt.prop === 'radio') s += '<rect x="' + (ox + 28) + '" y="' + (oy + 22) + '" width="6" height="8" fill="#1e293b"/>';
    if (opt.prop === 'pen') s += '<line x1="' + (ox + 26) + '" y1="' + (oy + 24) + '" x2="' + (ox + 32) + '" y2="' + (oy + 26) + '" stroke="#0f172a" stroke-width="1"/>';
    s += '<circle cx="' + (ox + 10) + '" cy="' + (oy + 5) + '" r="2" fill="' + lampCol + '" class="' + lampCls + '"/>';
    if (opt.status === 'idle') s += txt(ox + 20, oy - 5, 'Zzz', 6, '#94a3b8', 'middle', 'oa-bubble');
    s += txt(ox + 20, oy + 38, opt.name, 6, '#cbd5e1');
    s += '<text id="oaBubble_' + opt.id + '" x="' + (ox + 20) + '" y="' + (oy - 8) + '" font-size="6" fill="' + C.bubble + '" text-anchor="middle" font-family="monospace" class="oa-bubble" stroke="' + C.bubbleBorder + '" stroke-width="0.5"></text>';
    return s;
  }

  function buildRoomIso() {
    var W = 800, H = 500, s = '';
    s += '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#1a0f0a"/>';
    var floorW = 16, floorH = 12;
    for (var fy = 0; fy < floorH; fy++) {
      for (var fx = 0; fx < floorW; fx++) {
        var col = (fx + fy) % 2 === 0 ? C.floor1 : C.floor2;
        var ix = 100 + fx * 40;
        var iy = 200 + fy * 20;
        s += isoRect(ix, iy, 40, 20, 0, col);
      }
    }
    s += '<rect x="0" y="0" width="' + W + '" height="100" fill="' + C.wall + '"/>';
    s += '<rect x="0" y="0" width="' + W + '" height="4" fill="' + C.wallHi + '"/>';
    for (var bx = 0; bx < 4; bx++) {
      var bxPos = 50 + bx * 180;
      s += isoBox(bxPos, 20, 60, 80, 0, '#8b6235', '#6b4423', '#7a512b');
      for (var by = 0; by < 4; by++) {
        for (var bz = 0; bz < 3; bz++) {
          var bookCol = C.book[(bx * 4 + by * 3 + bz) % C.book.length];
          s += isoRect(bxPos + 5 + bz * 18, 25 + by * 18, 14, 14, 2, bookCol);
        }
      }
    }
    s += isoRect(600, 30, 120, 80, 0, C.board);
    s += isoRect(610, 40, 100, 60, 2, '#e5e7eb');
    s += '<rect x="620" y="50" width="20" height="15" fill="#ef4444"/>';
    s += '<rect x="650" y="55" width="25" height="20" fill="#3b82f6"/>';
    s += '<circle cx="690" cy="70" r="10" fill="#22c55e"/>';
    s += '<line x1="630" y1="80" x2="700" y2="80" stroke="#1f2937" stroke-width="2"/>';
    var plantPos = [[30, 150], [750, 180]];
    for (var pi = 0; pi < plantPos.length; pi++) {
      var px2 = plantPos[pi][0], py2 = plantPos[pi][1];
      s += isoBox(px2, py2, 20, 20, 0, C.potHi, C.pot, C.pot);
      s += '<circle cx="' + (px2 + 10) + '" cy="' + (py2 - 10) + '" r="15" fill="' + C.plant + '"/>';
      s += '<circle cx="' + (px2 + 5) + '" cy="' + (py2 - 15) + '" r="10" fill="' + C.plantHi + '"/>';
      s += '<circle cx="' + (px2 + 15) + '" cy="' + (py2 - 12) + '" r="12" fill="' + C.plant + '"/>';
    }
    var deskGroups = [
      [[80, 120], [140, 140]],
      [[300, 100], [360, 120], [420, 140]],
      [[540, 130], [600, 150]]
    ];
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
    var agentIdx = 0;
    for (var gi = 0; gi < deskGroups.length; gi++) {
      for (var di = 0; di < deskGroups[gi].length && agentIdx < defs.length; di++) {
        var pos = deskGroups[gi][di];
        defs[agentIdx].status = 'idle';
        s += agentIso(pos[0], pos[1], defs[agentIdx], agentIdx);
        agentIdx++;
      }
    }
    s += '</svg>';
    return s;
  }

  OA.mount = function (container) {
    if (!container) return;
    var wrap = document.createElement('div');
    wrap.id = 'officeArtWrap';
    wrap.innerHTML = buildRoomIso();
    container.appendChild(wrap);
  };

  OA.startClock = function () {};

  OA.paint = function (statusMap, bubbles) {
    if (!OA._defs) return;
    for (var i = 0; i < OA._defs.length; i++) {
      var d = OA._defs[i];
      d.status = (statusMap && statusMap[d.id]) || 'idle';
    }
    var wrap = document.getElementById('officeArtWrap');
    if (wrap) wrap.innerHTML = buildRoomIso();
    if (bubbles) for (var k in bubbles) { var b = document.getElementById('oaBubble_' + k); if (b) b.textContent = bubbles[k]; }
  };

  OA.defaultStatus = function () {
    var map = {};
    for (var i = 0; i < (OA._defs || []).length; i++) map[OA._defs[i].id] = 'idle';
    return { map: map, bub: {} };
  };
})();
/* END office-art v4 */
