/* freeai.js - Plugin Free Fleet (Build v6.7): 11 mesin AI gratis (OpenRouter :free + Pollinations + Puter), tanpa menyentuh Gemini/Qwen */
(function () {
  if (!window.P) return;

  var FLEET = [
    { id: 'or:deepseek/deepseek-chat-v3-0324:free', label: '🧠 DeepSeek V3 (OR gratis)' },
    { id: 'or:deepseek/deepseek-r1:free', label: '🧠 DeepSeek R1 reasoning (OR gratis)' },
    { id: 'or:meta-llama/llama-3.3-70b-instruct:free', label: '🦙 Llama 3.3 70B (OR gratis)' },
    { id: 'or:google/gemma-3-27b-it:free', label: '🔮 Gemma 3 27B (OR gratis)' },
    { id: 'or:mistralai/mistral-7b-instruct:free', label: '🌬 Mistral 7B (OR gratis)' },
    { id: 'pol:deepseek', label: '🌸 Pollinations DeepSeek (no-key)' },
    { id: 'pol:openai', label: '🌸 Pollinations OpenAI (no-key)' },
    { id: 'pol:mistral', label: '🌸 Pollinations Mistral (no-key)' },
    { id: 'put:gpt-4o-mini', label: '🪁 Puter GPT-4o mini (no-key)' },
    { id: 'put:deepseek-v3', label: '🪁 Puter DeepSeek V3 (no-key)' },
    { id: 'put:claude-sonnet-4', label: '🪁 Puter Claude Sonnet (no-key)' }
  ];

  (function () {
    var st = document.createElement('style');
    st.textContent = '.seg button.on-free{background:rgba(34,197,94,.22);color:var(--green);}';
    document.head.appendChild(st);
  })();

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
  var opts = '';
  for (var i = 0; i < FLEET.length; i++) opts += '<option value="' + FLEET[i].id + '">' + FLEET[i].label + '</option>';
  freeSel.innerHTML = opts;
  freeSel.value = localStorage.getItem('ihsg_freeai_model') || FLEET[0].id;
  freeSel.onchange = function () { localStorage.setItem('ihsg_freeai_model', freeSel.value); toast('🆓 Mesin gratis: ' + freeSel.value); };
  row.insertBefore(freeSel, document.getElementById('engineNote'));

  /* --- provider 1: OpenRouter via bridge Apps Script --- */
  async function orCall(prompt, model) {
    if (!GAS_PROXY) throw new Error('GAS_PROXY kosong');
    var lastErr = null;
    for (var attempt = 1; attempt <= 2; attempt++) {
      try {
        var r = await fetch(GAS_PROXY, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }] }) });
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

  /* --- provider 2: Pollinations (tanpa key) --- */
  async function polCall(prompt, model) {
    var r = await fetch('https://text.pollinations.ai/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], model: model }) });
    if (!r.ok) throw new Error('Pollinations HTTP ' + r.status);
    var t = await r.text();
    if (!t || t.length < 2) throw new Error('Pollinations balasan kosong');
    return t;
  }

  /* --- provider 3: Puter.js (tanpa key, SDK) --- */
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
  async function putCall(prompt, model) {
    await loadPuter();
    var res = await window.puter.ai.chat(prompt, { model: model });
    if (typeof res === 'string') return res;
    if (res && res.message && res.message.content) {
      var c = res.message.content;
      if (typeof c === 'string') return c;
      if (c.length && c[0] && c[0].text) return c[0].text;
    }
    if (res && res.text) return res.text;
    throw new Error('Format respon Puter tidak dikenal');
  }

  async function fleetCall(prompt, value) {
    var idx = value.indexOf(':');
    var prov = value.slice(0, idx);
    var model = value.slice(idx + 1);
    if (prov === 'or') return orCall(prompt, model);
    if (prov === 'pol') return polCall(prompt, model);
    if (prov === 'put') return putCall(prompt, model);
    throw new Error('Provider tidak dikenal');
  }

  var origCallLLM = window.callLLM;
  window.callLLM = async function (prompt) {
    if (getEngine() !== 'freeai') return origCallLLM(prompt);
    var chosen = localStorage.getItem('ihsg_freeai_model') || FLEET[0].id;
    var chain = [chosen, 'or:openrouter/free', 'pol:openai'];
    var lastErr = null;
    for (var i = 0; i < chain.length; i++) {
      if (i > 0 && chain[i] === chosen) continue;
      try { return await fleetCall(prompt, chain[i]); } catch (e) { lastErr = e; }
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
/* END freeai v1 */
