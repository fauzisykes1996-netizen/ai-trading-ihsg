/* freeai.js v3 - Free Fleet: daftar model gratis HIDUP (auto-refresh OpenRouter) + Pollinations + Puter */
(function () {
  if (!window.P) return;

  var STATIC_FALLBACK = [
    { id: 'pol:deepseek', label: '🌸 Pollinations DeepSeek (no-key)' },
    { id: 'pol:openai', label: '🌸 Pollinations OpenAI (no-key)' },
    { id: 'pol:mistral', label: '🌸 Pollinations Mistral (no-key)' },
    { id: 'put:gpt-4o-mini', label: '🪁 Puter GPT-4o mini (no-key)' },
    { id: 'put:deepseek-v3', label: '🪁 Puter DeepSeek V3 (no-key)' },
    { id: 'put:claude-sonnet-4', label: '🪁 Puter Claude Sonnet (no-key)' }
  ];
  var FLEET = STATIC_FALLBACK.slice();

  (function () {
    var st = document.createElement('style');
    st.textContent = '.seg button.on-free{background:rgba(34,197,94,.22);color:var(--green);}';
    document.head.appendChild(st);
  })();

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
  async function polCallMsgs(msgs, model) {
    var r = await fetch('https://text.pollinations.ai/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: msgs, model: model }) });
    if (!r.ok) throw new Error('Pollinations HTTP ' + r.status);
    var t = await r.text();
    if (!t || t.length < 2) throw new Error('Pollinations balasan kosong');
    return t;
  }
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
  async function callMsgs(msgs, value) {
    var idx = value.indexOf(':');
    var prov = value.slice(0, idx);
    var model = value.slice(idx + 1);
    if (prov === 'or') return orCallMsgs(msgs, model);
    if (prov === 'pol') return polCallMsgs(msgs, model);
    if (prov === 'put') return putCallMsgs(msgs, model);
    throw new Error('Provider tidak dikenal');
  }
  function callPrompt(prompt, value) {
    return callMsgs([{ role: 'user', content: prompt }], value);
  }

  function rebuild() {
    var sel = document.getElementById('freeModel'); if (!sel) return;
    var opts = '';
    for (var i = 0; i < FLEET.length; i++) opts += '<option value="' + FLEET[i].id + '">' + FLEET[i].label + '</option>';
    sel.innerHTML = opts;
    var saved = localStorage.getItem('ihsg_freeai_model');
    sel.value = saved || FLEET[0].id;
    if (!sel.value) sel.value = FLEET[0].id;
  }

  var ready = (async function () {
    try {
      if (!GAS_PROXY) return;
      var r = await fetch(GAS_PROXY + '?url=' + encodeURIComponent('https://openrouter.ai/api/v1/models'));
      if (!r.ok) return;
      var wrap = JSON.parse(await r.text());
      var body = wrap && wrap.body ? wrap.body : null;
      if (!body) return;
      var j = JSON.parse(body);
      if (!j || !j.data) return;
      var free = [];
      for (var i = 0; i < j.data.length; i++) {
        var m = j.data[i];
        if (m && m.id && m.pricing && parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0) free.push(m);
      }
      free.sort(function (a, b) { return (b.context_length || 0) - (a.context_length || 0); });
      var orList = [];
      for (var k = 0; k < free.length && orList.length < 10; k++) orList.push({ id: 'or:' + free[k].id, label: '🆓 ' + free[k].name + ' (OR gratis)' });
      if (orList.length) FLEET = orList.concat(STATIC_FALLBACK);
      rebuild();
    } catch (e) {}
  })();

  window.FF = { models: function () { return FLEET.slice(); }, ready: ready, callMsgs: callMsgs, callPrompt: callPrompt };

  var row = document.querySelector('.engine-row');
  var seg = row ? row.querySelector('.seg') : null;
  if (!seg) return;
  var freeBtn = document.createElement('button');
  freeBtn.id = 'engFree';
  freeBtn.innerText = '🆓 Gratis';
  freeBtn.onclick = function () { setEngine('freeai'); };
  seg.appendChild(freeBtn);
  var freeSel = document.createElement('select');
  freeSel.id = 'freeModel';
  freeSel.className = 'fv-input';
  freeSel.style.cssText = 'flex:0 0 auto;width:auto;max-width:46%;font-size:0.66rem;padding:6px 8px;border-radius:10px;';
  row.insertBefore(freeSel, document.getElementById('engineNote'));
  freeSel.onchange = function () { localStorage.setItem('ihsg_freeai_model', freeSel.value); toast('🆓 Mesin gratis: ' + freeSel.value); };
  rebuild();

  var origCallLLM = window.callLLM;
  window.callLLM = async function (prompt) {
    if (getEngine() !== 'freeai') return origCallLLM(prompt);
    var sel = document.getElementById('freeModel');
    var chosen = sel ? sel.value : FLEET[0].id;
    var chain = [chosen, 'pol:openai', 'put:gpt-4o-mini'];
    var lastErr = null;
    for (var i = 0; i < chain.length; i++) {
      if (i > 0 && chain[i] === chosen) continue;
      try { return await callPrompt(prompt, chain[i]); } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Semua mesin gratis gagal.');
  };

  var origUEUI = window.updateEngineUI;
  window.updateEngineUI = function () {
    origUEUI();
    var e = getEngine();
    freeBtn.className = e === 'freeai' ? 'on-free' : '';
    var note = document.getElementById('engineNote');
    var pill = document.getElementById('masterPill');
    if (e === 'freeai') {
      if (note) note.innerText = 'via Free Fleet (gratis)';
      if (pill) pill.innerText = 'Master Agent • AI Gratis';
    }
  };
  window.updateEngineUI();
})();
/* END freeai v3 */
