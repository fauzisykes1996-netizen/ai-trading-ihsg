/* duel5.js v3 - Duel 5 Mesin: konteks semua kartu analisis, versi ringkas */
(function(){
if(!window.P)return;
var NL=String.fromCharCode(10);
var anchor=document.getElementById('qbBtn')?document.getElementById('qbBtn').closest('.card'):null;
P.card('tab-analysis','<div class="card-title"><span>⚔️ Duel 5 Mesin</span><span class="agent-pill tech">Second Opinion x5</span></div><button class="btn-copy" style="margin-top:0;" id="d5Btn" onclick="runDuel5()">⚔️ Jalankan Duel 5 Mesin</button><div id="d5Note" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Prompt berisi semua kartu analisis (Plan A/B, Grader, Forecast, Bandar, Money Flow, Regime) dikirim ke 5 mesin.</div><div id="d5Out" class="hidden" style="margin-top:10px;"></div>',anchor);
function g(id){var e=document.getElementById(id);return e?e.innerText:'-';}
function clip(t,n){var s=String(t||'').split(NL).join(' ');if(s.length>n)s=s.slice(0,n)+'...';return s;}
function cardText(kw){var ts=document.querySelectorAll('.card-title');for(var i=0;i<ts.length;i++){if((ts[i].innerText||'').toUpperCase().indexOf(kw)>=0){var c=ts[i].closest('.card');return c?c.innerText:'';}}return '';}
function buildPrompt(){
var code=window.lastTicker||'-';
var L=[];
L.push('Saham '+code+'.JK | Harga '+g('displayPrice')+' | Tren '+g('valTrend')+' | S/R '+g('valSupport')+'/'+g('valResistance'));
var re=g('rEntry');
L.push('RENCANA A (day-trade): '+(re&&re!=='-'?('entry '+re+', SL '+g('rSl')+', T1 '+g('rTp1')+', T2 '+g('rTp2')+', RR '+g('rRr)):'belum terisi'));
var sp=document.getElementById('swPlan');
L.push('RENCANA B (swing): '+(sp?clip(sp.innerText,350):'belum terisi'));
L.push('GRADER: '+clip(cardText('SETUP GRADER'),200));
L.push('FORECAST: '+clip(cardText('ONE-MONTH'),200));
L.push('MTF: '+clip(cardText('MULTI-TF'),120));
L.push('TREN: '+clip(cardText('KEKUATAN TREN'),140));
L.push('BANDAR: '+clip(cardText('TAPE READER'),140));
L.push('MF: '+clip(cardText('MONEY FLOW'),140));
L.push('REGIME: '+clip(cardText('MARKET REGIME'),140));
L.push('TUGAS: (1) 1 kalimat layak/tidak; (2) pilih Rencana A atau B + alasan angka; (3) risiko terbesar + level pembatal. Maks 70 kata, Indonesia.');
return L.join(NL);
}
function engines(){
var list=[{id:'core:gemini',label:'Gemini'},{id:'core:qwen',label:'Qwen'}];
var ors=[],puts=[];
if(window.FF){var m=window.FF.models();for(var i=0;i<m.length;i++){if(m[i].id.indexOf('or:')===0)ors.push(m[i]);else if(m[i].id.indexOf('put:')===0)puts.push(m[i]);}}
if(!puts.length)puts=[{id:'put:gpt-4o-mini',label:'Puter GPT-4o mini'}];
if(ors.length)list.push(ors[0]);
list.push(puts[0]);
if(puts[1])list.push(puts[1]);else if(ors[1])list.push(ors[1]);
return list.slice(0,5);
}
async function callEngine(id,prompt){
var i2=id.indexOf(':');var prov=id.slice(0,i2);var model=id.slice(i2+1);
if(prov==='core')return model==='gemini'?await geminiCall(prompt):await qwenCall(prompt);
if(window.FF)return await window.FF.callPrompt(prompt,id);
throw new Error('Free Fleet tidak tersedia');
}
async function callRetry(id,prompt){try{return await callEngine(id,prompt);}catch(e){return await callEngine(id,prompt);}}
function block(label,txt,ok){return '<div class="report-card" style="margin-top:8px;"><div style="font-size:0.72rem;font-weight:800;color:var('+(ok?'green':'red')+');margin-bottom:4px;">'+esc(label)+'</div><div style="font-size:0.78rem;white-space:pre-wrap;">'+esc(txt)+'</div></div>';}
window.runDuel5=async function(){
if(!window.lastTicker){alert('Proses sebuah saham dulu.');return;}
var btn=document.getElementById('d5Btn');btn.disabled=true;btn.innerText='Duel berjalan...';
var out=document.getElementById('d5Out');out.classList.remove('hidden');out.innerHTML='<div class="skel-box" style="height:80px"></div>';
var list=engines();var prompt=buildPrompt();
var res=await Promise.allSettled(list.map(function(en){return callRetry(en.id,prompt).then(function(t){return {en:en,txt:t};});}));
var ok=[];var h='';
for(var i=0;i<res.length;i++){
if(res[i].status==='fulfilled'){ok.push(res[i].value);h+=block(res[i].value.en.label,res[i].value.txt,true);}
else h+=block(list[i].label,'Tidak merespon: '+res[i].reason.message,false);
}
h='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">'+ok.length+'/5 mesin menjawab.</div>'+h;
if(ok.length>=2)h+='<button class="btn-copy" style="margin-top:8px;" onclick="summarizeDuel()">Ringkas Konsensus</button>';
out.innerHTML=h;window.__d5ok=ok;
btn.disabled=false;btn.innerText='⚔️ Jalankan Duel 5 Mesin';
};
window.summarizeDuel=async function(){
var ok=window.__d5ok||[];if(ok.length<2)return;
var body='Opini analis AI:'+NL;
for(var i=0;i<ok.length;i++)body+='['+ok[i].en.label+'] '+ok[i].txt+NL;
body+=NL+'Ringkas: titik SETUJU, titik SELISIH, rekomendasi final 1 kalimat. Maks 80 kata.';
var out=document.getElementById('d5Out');
var sid='d5s'+Date.now();
var d=document.createElement('div');d.className='report-card';d.style.marginTop='8px';
d.innerHTML='<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:4px;">Konsensus</div><div id="'+sid+'" style="font-size:0.78rem;white-space:pre-wrap;">Merangkum...</div>';
out.appendChild(d);
try{var t=await callEngine(ok[0].en.id,body);document.getElementById(sid).innerHTML=esc(t);}
catch(e){document.getElementById(sid).innerHTML='Gagal merangkum: '+esc(e.message);}
};
})();
/* END duel5 v3 */
