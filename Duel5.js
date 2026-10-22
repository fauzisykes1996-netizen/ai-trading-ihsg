/* duel5.js - Duel 5 Mesin: Gemini + Qwen + 3 mesin gratis paralel, tahan mesin mati */
(function(){
 if(!window.P)return;
 var NL=String.fromCharCode(10);
 var anchor=document.getElementById('qbBtn')?document.getElementById('qbBtn').closest('.card'):null;
 P.card('tab-analysis',
  '<div class="card-title"><span>⚔️ Duel 5 Mesin</span><span class="agent-pill tech">Second Opinion x5</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="d5Btn" onclick="runDuel5()">⚔️ Jalankan Duel 5 Mesin</button>'+
  '<div id="d5Note" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Satu prompt dikirim ke 5 mesin sekaligus. Mesin yang tidak merespon tidak menghalangi yang lain.</div>'+
  '<div id="d5Out" class="hidden" style="margin-top:10px;"></div>',anchor);
 function g(id){var e=document.getElementById(id);return e?e.innerText:'-';}
 function buildPrompt(){
  var code=window.lastTicker||'(belum ada)';
  var L=[];
  L.push('Saham: '+code+'.JK');
  L.push('Harga acuan: '+g('displayPrice'));
  L.push('Bias tren: '+g('valTrend'));
  L.push('Support: '+g('valSupport')+' | Resistance: '+g('valResistance'));
  L.push('Rencana: entry '+g('rEntry')+', SL '+g('rSl')+', T1 '+g('rTp1')+', T2 '+g('rTp2')+', R/R '+g('rRr'));
  L.push('Tugas: (1) kesimpulan 1 kalimat apakah setup layak; (2) setuju/tidak dengan rencana + alasan singkat; (3) satu risiko terbesar. Maks 60 kata, bahasa Indonesia.');
  return L.join(NL);
 }
 function engines(){
  var list=[{id:'core:gemini',label:'✨ Gemini'},{id:'core:qwen',label:'🤖 Qwen'}];
  var ors=[],puts=[];
  if(window.FF){var m=window.FF.models();for(var i=0;i<m.length;i++){if(m[i].id.indexOf('or:')===0)ors.push(m[i]);else if(m[i].id.indexOf('put:')===0)puts.push(m[i]);}}
  if(!puts.length)puts=[{id:'put:gpt-4o-mini',label:'🪁 Puter GPT-4o mini (no-key)'}];
  if(ors.length)list.push({id:ors[0].id,label:ors[0].label});
  list.push({id:puts[0].id,label:puts[0].label});
  if(puts[1])list.push({id:puts[1].id,label:puts[1].label});
  else if(ors[1])list.push({id:ors[1].id,label:ors[1].label});
  return list.slice(0,5);
 }
 async function callEngine(id,prompt){
  var idx=id.indexOf(':');var prov=id.slice(0,idx);var model=id.slice(idx+1);
  if(prov==='core')return model==='gemini'?await geminiCall(prompt):await qwenCall(prompt);
  if(window.FF)return await window.FF.callPrompt(prompt,id);
  throw new Error('Free Fleet tidak tersedia');
 }
 async function callRetry(id,prompt){
  try{return await callEngine(id,prompt);}catch(e){return await callEngine(id,prompt);}
 }
 function block(label,txt,ok){
  return '<div class="report-card" style="margin-top:8px;"><div style="font-size:0.72rem;font-weight:800;color:var(--'+(ok?'green':'red')+');margin-bottom:4px;">'+esc(label)+'</div><div style="font-size:0.78rem;white-space:pre-wrap;">'+esc(txt)+'</div></div>';
 }
 window.runDuel5=async function(){
  var code=window.lastTicker;
  if(!code){alert('Proses sebuah saham dulu.');return;}
  var btn=document.getElementById('d5Btn');btn.disabled=true;btn.innerText='Duel berjalan (5 mesin)...';
  var out=document.getElementById('d5Out');out.classList.remove('hidden');out.innerHTML='<div class="skel-box" style="height:80px"></div>';
  var list=engines();
  var prompt=buildPrompt();
  var results=await Promise.allSettled(list.map(function(en){return callRetry(en.id,prompt).then(function(txt){return {en:en,txt:txt};});}));
  var ok=[];var h='';
  for(var i=0;i<results.length;i++){
   if(results[i].status==='fulfilled'){ok.push(results[i].value);h+=block(results[i].value.en.label,results[i].value.txt,true);}
   else{h+=block(list[i].label,'⚠ Tidak merespon: '+results[i].reason.message,false);}
  }
  var head='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">'+ok.length+'/5 mesin menjawab.'+(ok.length<5?' Yang mati dilewati - opini tetap lengkap.':' Semua hidup!')+'</div>';
  out.innerHTML=head+h+(ok.length>=2?'<button class="btn-copy" style="margin-top:8px;" onclick="summarizeDuel()">🧠 Ringkas Konsensus & Selisih</button>':'');
  window.__d5ok=ok;
  btn.disabled=false;btn.innerText='⚔️ Jalankan Duel 5 Mesin';
 };
 window.summarizeDuel=async function(){
  var ok=window.__d5ok||[];if(ok.length<2)return;
  var body='Opini beberapa analis AI tentang saham yang sama:'+NL;
  for(var i=0;i<ok.length;i++)body+='['+ok[i].en.label+'] '+ok[i].txt+NL;
  body+=NL+'Tugas: ringkas (1) titik SETUJU antar analis, (2) titik SELISIH, (3) rekomendasi final 1 kalimat untuk trader disiplin. Maks 80 kata.';
  var out=document.getElementById('d5Out');
  var sid='d5sum'+Date.now();
  var div=document.createElement('div');div.className='report-card';div.style.marginTop='8px';
  div.innerHTML='<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:4px;">🧠 Konsensus</div><div id="'+sid+'" style="font-size:0.78rem;white-space:pre-wrap;">Merangkum...</div>';
  out.appendChild(div);
  try{
   var txt=await callEngine(ok[0].en.id,body);
   document.getElementById(sid).innerHTML=esc(txt);
  }catch(e){document.getElementById(sid).innerHTML='⚠ Gagal merangkum: '+esc(e.message);}
 };
})();
/* END duel5 v1 */
