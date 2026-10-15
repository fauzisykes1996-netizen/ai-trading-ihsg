/* freeai.js v4 - Free Fleet: OpenRouter gratis (auto-refresh) + Puter (auto-refresh), tanpa model mati */
(function () {
  if (!window.P) return;

  var FLEET = [{ id: 'put:gpt-4o-mini', label: '🪁 Puter GPT-4o mini (no-key)' }];

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
    var orList = [];
    var putList = [];
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
              for (var k = 0; k < free.length && orList.length < 10; k++) orList.push({ id: 'or:' + free[k].id, label: '🆓 ' + free[k].name + ' (OR gratis)' });
            }
          }
        }
      }
    } catch (e) {}
    try {
      await loadPuter();
      if (window.puter && window.puter.ai && typeof window.puter.ai.models === 'function') {
        var models = await window.puter.ai.models();
        var arr = Array.isArray(models) ? models : (models && models.data ? models.data : []);
        var want = ['gpt-4o-mini', 'gpt-5-nano', 'deepseek-v3.2', 'claude-haiku-4-5', 'gemini-2.5-flash', 'llama-3.3-70b'];
        for (var w = 0; w < want.length; w++) {
          for (var a = 0; a < arr.length; a++) {
            var id = arr[a] && (arr[a].id || arr[a].name || '');
            if (id && id.toLowerCase().indexOf(want[w]) !== -1) { putList.push({ id: 'put:' + id, label: '🪁 Puter ' + id + ' (no-key)' }); break; }
          }
        }
        if (!putList.length && arr.length) {
          for (var p = 0; p < arr.length && putList.length < 6; p++) {
            var pid = arr[p] && (arr[p].id || arr[p].name || '');
            if (pid) putList.push({ id: 'put:' + pid, label: '🪁 Puter ' + pid + ' (no-key)' });
          }
        }
      }
    } catch (e2) {}
    FLEET = orList.concat(putList.length ? putList : [{ id: 'put:gpt-4o-mini', label: '🪁 Puter GPT-4o mini (no-key)' }]);
    if (!FLEET.length) FLEET = [{ id: 'put:gpt-4o-mini', label: '🪁 Puter GPT-4o mini (no-key)' }];
    rebuild();
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
    var chain = [chosen];
    for (var f = 0; f < FLEET.length && chain.length < 4; f++) { if (FLEET[f].id !== chosen) chain.push(FLEET[f].id); }
    var lastErr = null;
    for (var i = 0; i < chain.length; i++) {
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
/* END freeai v4 */
