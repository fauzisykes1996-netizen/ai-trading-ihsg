/* aichat.js v4 - Chat AI mandiri: daftar model HIDUP dari Puter + OpenRouter + Gemini/Qwen, tidak bergantung freeai.js */
(function () {
  if (!window.P) return;

  (function () {
    var st = document.createElement('style');
    st.textContent = '#chatFab{position:fixed;right:14px;bottom:92px;z-index:300;width:52px;height:52px;border-radius:50%;border:1px solid var(--accent);background:linear-gradient(135deg,rgba(124,58,237,.92),rgba(56,189,248,.92));color:#fff;font-size:1.4rem;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);}#chatPanel{position:fixed;inset:0;z-index:400;background:var(--bg,#06090f);display:flex;flex-direction:column;}#chatMsgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}.cmsg{max-width:82%;padding:10px 12px;border-radius:14px;font-size:0.82rem;line-height:1.5;white-space:pre-wrap;}.cmsg.user{align-self:flex-end;background:rgba(124,58,237,.25);border:1px solid rgba(124,58,237,.5);color:#fff;}.cmsg.ai{align-self:flex-start;background:var(--card-bg);border:1px solid var(--card-border);color:#e2e8f0;}.cmsg .who{display:block;font-size:0.62rem;color:var(--text-muted);margin-bottom:4px;}';
    document.head.appendChild(st);
  })();

  var CHAT_MODELS = [];
  var hist = lsJSON('ihsg_chat_log', []);

  function labelOf(id) { for (var k = 0; k < CHAT_MODELS.length; k++) if (CHAT_MODELS[k].id === id) return CHAT_MODELS[k].label; return id; }
  function save() { saveLS('ihsg_chat_log', hist); }

  function loadPuter() {
    if (window.puter) return Promise.resolve();
    if (loadPuter._p) return loadPuter._p;
    loadPuter._p = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://js.puter.com/v2/';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('SDK Puter gagal dimuat')); };
      document.head.appendChild(s);
      setTimeout(function () { if (window.puter) resolve(); else reject(new Error('SDK Puter terlalu lambat')); }, 9000);
    });
    loadPuter._p.catch(function () { loadPuter._p = null; });
    return loadPuter._p;
  }

  async function discoverModels() {
    var list = [];
    // 1) Puter live models
    try {
      await loadPuter();
      if (window.puter && window.puter.ai && typeof window.puter.ai.models === 'function') {
        var models = await window.puter.ai.models();
        var arr = Array.isArray(models) ? models : (models && models.data ? models.data : []);
        var want = ['gpt-4o-mini', 'gpt-5-nano', 'deepseek-v3', 'claude-haiku', 'gemini-2.5-flash', 'llama-3.3-70b'];
        for (var w = 0; w < want.length; w++) {
          for (var a = 0; a < arr.length; a++) {
            var id = arr[a] && (arr[a].id || arr[a].name || '');
            if (id && id.toLowerCase().indexOf(want[w]) !== -1) { list.push({ id: 'put:' + id, label: '🪁 ' + id + ' (no-key)' }); break; }
          }
        }
        if (!list.length && arr.length) {
          for (var p = 0; p < arr.length && list.length < 6; p++) {
            var pid = arr[p] && (arr[p].id || arr[p].name || '');
            if (pid) list.push({ id: 'put:' + pid, label: '🪁 ' + pid + ' (no-key)' });
          }
        }
      }
    } catch (e1) {}
    // 2) OpenRouter free models via bridge
    try {
      if (GAS_PROXY) {
        var r = await fetch(GAS_PROXY + '?url=' + encodeURIComponent('https://openrouter.ai/api/v1/models'));
        if (r.ok) {
          var wrap = JSON.parse(await r.text());
          var body = wrap && wrap.body ? wrap.body : null;
          if (body) {
            var j = JSON.parse(body);
            if (j && j.data) {
              var free = [];
              for (var i = 0; i < j.data.length; i++) {
                var m = j.data[i];
                if (m && m.id && m.pricing && parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0) free.push(m);
              }
              free.sort(function (a, b) { return (b.context_length || 0) - (a.context_length || 0); });
              for (var k = 0; k < free.length && list.length < 15; k++) list.push({ id: 'or:' + free[k].id, label: '🆓 ' + free[k].name + ' (OR gratis)' });
            }
          }
        }
      }
    } catch (e2) {}
    // 3) Core (selalu ada)
    list.push({ id: 'core:gemini', label: '✨ Gemini (key Anda)' });
    list.push({ id: 'core:qwen', label: '🤖 Qwen (bridge)' });
    CHAT_MODELS = list;
    if (!CHAT_MODELS.length) CHAT_MODELS = [{ id: 'core:gemini', label: '✨ Gemini' }, { id: 'core:qwen', label: '🤖 Qwen' }];
  }

  window.openChat = function () {
    panel.style.display = 'flex';
    renderMsgs();
    setTimeout(function () { var inp = document.getElementById('chatInput'); if (inp) inp.focus(); }, 150);
    if (!CHAT_MODELS.length) {
      discoverModels().then(rebuildSel);
    }
  };
  window.closeChat = function () { panel.style.display = 'none'; };
  window.clearChat = function () { hist = []; save(); renderMsgs(); toast(' Percakapan dibersihkan.'); };

  var fab = document.createElement('button');
  fab.id = 'chatFab'; fab.innerText = '💬';
  fab.onclick = function () { window.openChat(); };
  document.body.appendChild(fab);

  var panel = document.createElement('div');
  panel.id = 'chatPanel'; panel.style.display = 'none';
  var head = '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--card-border);background:var(--card-bg);">';
  head += '<strong style="flex:1;color:#fff;font-size:0.9rem;">💬 Chat AI Multi-Mesin</strong>';
  head += '<select id="chatModel" class="fv-input" style="width:auto;max-width:42%;font-size:0.64rem;padding:6px 8px;border-radius:10px;"></select>';
  head += '<button class="btn-mini" onclick="clearChat()">🗑</button>';
  head += '<button class="btn-mini" onclick="closeChat()">✕</button>';
  head += '</div>';
  head += '<div id="chatMsgs"></div>';
  head += '<div style="display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--card-border);background:var(--card-bg);">';
  head += '<input type="text" id="chatInput" class="fv-input" placeholder="Tanya soal saham, swing, indikator, risiko..." style="flex:1;">';
  head += '<button class="btn-action" style="border-radius:10px;padding:0 16px;" onclick="sendChat()">Kirim</button>';
  head += '</div>';
  panel.innerHTML = head;
  document.body.appendChild(panel);

  var sel = document.getElementById('chatModel');
  function rebuildSel() {
    var opts = '';
    for (var i = 0; i < CHAT_MODELS.length; i++) opts += '<option value="' + CHAT_MODELS[i].id + '">' + CHAT_MODELS[i].label + '</option>';
    sel.innerHTML = opts;
    var saved = localStorage.getItem('ihsg_chat_model');
    sel.value = saved || CHAT_MODELS[0].id;
    if (!sel.value) sel.value = CHAT_MODELS[0].id;
  }
  // Initial load
  discoverModels().then(rebuildSel);
  sel.onchange = function () { localStorage.setItem('ihsg_chat_model', sel.value); toast('💬 Mesin chat: ' + labelOf(sel.value)); };
  document.getElementById('chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') window.sendChat(); });

  function renderMsgs() {
    var box = document.getElementById('chatMsgs'); if (!box) return;
    var html = '';
    for (var i = 0; i < hist.length; i++) {
      var h = hist[i];
      if (h.role === 'user') html += '<div class="cmsg user">' + esc(h.content) + '</div>';
      else html += '<div class="cmsg ai"><span class="who">' + esc(h.label || 'AI') + '</span>' + esc(h.content) + '</div>';
    }
    if (!hist.length) html = '<div style="color:var(--text-muted);font-size:0.78rem;text-align:center;padding-top:70px;">Memuat daftar model hidup...<br>Pilih mesin di bar atas 💬</div>';
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  }

  function sysText() {
    var s = 'Anda asisten trading saham Indonesia (IHSG) yang praktis, jujur, dan disiplin risiko. Jawab dalam bahasa Indonesia dengan ringkas.';
    if (window.lastTicker) s += ' Konteks: saham terakhir dianalisis ' + window.lastTicker + (window.lastPrice ? ' harga ' + Math.round(window.lastPrice).toLocaleString('id-ID') : '') + '.';
    return s;
  }
  function msgsPayload() {
    var m = [{ role: 'system', content: sysText() }];
    for (var i = 0; i < hist.length; i++) {
      var h = hist[i];
      if (h.role === 'user') m.push({ role: 'user', content: h.content });
      else if (h.content && h.content.charAt(0) !== '…' && h.content.indexOf('⚠') !== 0) m.push({ role: 'assistant', content: h.content });
    }
    return m;
  }
  function flatten() {
    var m = msgsPayload();
    var s = m[0].content + '\n\nPERCAKAPAN:\n';
    for (var i = 1; i < m.length; i++) s += (m[i].role === 'user' ? 'User: ' : 'AI: ') + m[i].content + '\n';
    return s + '\nJawab pesan User terakhir secara ringkas dan praktis.';
  }

  async function orCallMsgs(msgs, model) {
    if (!GAS_PROXY) throw new Error('GAS_PROXY kosong');
    var lastErr = null;
    for (var attempt = 1; attempt <= 2; attempt++) {
      try {
        var r = await fetch(GAS_PROXY, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ model: model, messages: msgs }) });
        if (!r.ok) throw new Error('Bridge HTTP ' + r.status);
        var text = await r.text();
        if (text.trim().charAt(0) === '<') throw new Error('Bridge membalas HTML.');
        var j = JSON.parse(text);
        if (j.error) {
          var code = (j.error && j.error.code) || null;
          var err = new Error(String(j.error.message || j.error)); err.code = code;
          if (code === 429) { lastErr = err; if (attempt === 1) { await new Promise(function (res) { setTimeout(res, 6000); }); continue; } break; }
          lastErr = err; break;
        }
        if (j.choices && j.choices[0] && j.choices[0].message) return j.choices[0].message.content || 'Tidak ada respon.';
        throw new Error('Balasan tanpa choices.');
      } catch (e) {
        lastErr = e;
        if (attempt === 1 && /Load failed|network|fetch/i.test(e.message)) { await new Promise(function (res) { setTimeout(res, 3000); }); continue; }
        break;
      }
    }
    throw lastErr || new Error('OpenRouter gagal.');
  }
  async function putCallMsgs(msgs, model) {
    await loadPuter();
    var res = await window.puter.ai.chat(msgs, { model: model });
    if (typeof res === 'string') return res;
    if (res && res.message && res.message.content) {
      var c = res.message.content;
      if (typeof c === 'string') return c;
      if (c.length && c[0] && c[0].text) return c[0].text;
    }
    if (res && res.text) return res.text;
    throw new Error('Format respon Puter tidak dikenal');
  }

  window.sendChat = async function () {
    var inp = document.getElementById('chatInput');
    var text = (inp.value || '').trim();
    if (!text) return;
    inp.value = '';
    hist.push({ role: 'user', content: text });
    var mid = sel.value;
    var ph = { role: 'ai', label: labelOf(mid), content: '…menunggu jawaban…' };
    hist.push(ph);
    if (hist.length > 60) hist = hist.slice(hist.length - 60);
    save(); renderMsgs();
    try {
      var idx = mid.indexOf(':');
      var prov = mid.slice(0, idx);
      var model = mid.slice(idx + 1);
      if (prov === 'core') {
        var p = flatten();
        ph.content = (model === 'gemini') ? await geminiCall(p) : await qwenCall(p);
      } else if (prov === 'or') {
        ph.content = await orCallMsgs(msgsPayload(), model);
      } else if (prov === 'put') {
        ph.content = await putCallMsgs(msgsPayload(), model);
      } else {
        throw new Error('Model tidak dikenal');
      }
    } catch (e) {
      ph.content = '⚠ Gagal: ' + e.message + ' — coba mesin lain di bar atas.';
    }
    save(); renderMsgs();
  };
})();
/* END aichat v4 */
