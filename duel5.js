/* duel5.js v7 - Duel 5 Mesin: voting + meter berbobot rekam jejak + ringkasan anti-gantung */
(function(){
if(!window.P)return;
var NL=String.fromCharCode(10);
var anchor=null;
var qb=document.getElementById('qbBtn');
if(qb)anchor=qb.closest('.card');
P.card('tab-analysis','<div class="card-title"><span>⚔️ Duel 5 Mesin</span><span class="agent-pill tech">Dewan Berbobot</span></div><button class="btn-copy" style="margin-top:0;" id="d5Btn" onclick="runDuel5()">⚔️ Jalankan Duel 5 Mesin</button><div id="d5Note" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Voting BUY/WAIT/SELL dicatat; setelah 20 hari dicocokkan dengan hasil nyata. Mesin akurat bersuara lebih berat.</div><div id="d5Out" class="hidden" style="margin-top:10px;"></div>',anchor);
function g(id){var e=document.getElementById(id);return e?e.innerText:'-';}
function clip(t,n){var s=String(t||'').split(NL).join(' ');if(s.length>n)s=s.slice(0,n)+'...';return s;}
function cardText(kw){var ts=document.querySelectorAll('.card-title');for(var i=0;i<ts.length;i++){var tt=ts[i].innerText||'';if(tt.toUpperCase().indexOf(kw)>=0){var c=ts[i].closest('.card');if(c)return c.innerText;}}return '';}
function buildPrompt(){
var code=window.lastTicker||'-';
var L=[];
L.push('Saham '+code+'.JK | Harga '+g('displayPrice')+' | Tren '+g('valTrend')+' | S/R '+g('valSupport')+'/'+g('valResistance'));
var qplan='belum terisi';
var re=g('rEntry');
if(re&&re!=='-'){qplan='entry '+re+', SL '+g('rSl')+', T1 '+g('rTp1')+', T2 '+g('rTp2')+', RR '+g('rRr');}
L.push('RENCANA A (day-trade): '+qplan);
var spTxt='belum terisi';
var sp=document.getElementById('swPlan');
if(sp)spTxt=clip(sp.innerText,350);
L.push('RENCANA B (swing): '+spTxt);
L.push('GRADER: '+clip(cardText('SETUP GRADER'),200));
L.push('FORECAST: '+clip(cardText('ONE-MONTH'),200));
L.push('MTF: '+clip(cardText('MULTI-TF'),120));
L.push('TREN: '+clip(cardText('KEKUATAN TREN'),140));
L.push('BANDAR: '+clip(cardText('TAPE READER'),140));
L.push('MF: '+clip(cardText('MONEY FLOW'),140));
L.push('REGIME: '+clip(cardText('MARKET REGIME'),140));
L.push('JAWAB WAJIB FORMAT INI (4 baris):');
L.push('VONIS: BUY atau WAIT atau SELL');
L.push('KEYAKINAN: n/5');
L.push('RENCANA: A atau B atau -');
L.push('RISIKO: 1 kalimat + level harga pembatal');
return L.join(NL);
}
function firstDigit(s){for(var i=0;i<s.length;i++){var ch=s.charAt(i);if(ch>='0'&&ch<='9')return parseInt(ch,10);}return 0;}
function parseVote(txt){
var u=String(txt).toUpperCase();
var v='?';
var i1=u.indexOf('VONIS:');
if(i1>=0){
var r1=u.slice(i1+6);
var pB=r1.indexOf('BUY');
var pW=r1.indexOf('WAIT');
var pS=r1.indexOf('SELL');
var best=-1;var pick='?';
if(pB>=0){best=pB;pick='BUY';}
if(pW>=0&&(best<0||pW<best)){best=pW;pick='WAIT';}
if(pS>=0&&(best<0||pS<best)){best=pS;pick='SELL';}
v=pick;
}
var conf=0;
var i2=u.indexOf('KEYAKINAN:');
if(i2>=0)conf=firstDigit(u.slice(i2+10));
var plan='-';
var i3=u.indexOf('RENCANA:');
if(i3>=0){
var t3=u.slice(i3+8).charAt(0);
if(t3==='A')plan='A';
else if(t3==='B')plan='B';
}
return {v:v,conf:conf,plan:plan};
}
function engines(){
var list=[{id:'core:gemini',label:'✨ Gemini'},{id:'core:qwen',label:'🤖 Qwen'}];
var ors=[];var puts=[];
if(window.FF){var m=window.FF.models();for(var i=0;i<m.length;i++){var id=m[i].id;if(id.indexOf('or:')===0)ors.push(m[i]);if(id.indexOf('put:')===0)puts.push(m[i]);}}
if(puts.length===0)puts.push({id:'put:gpt-4o-mini',label:'🪁 Puter GPT-4o mini'});
if(ors.length>0)list.push(ors[0]);
list.push(puts[0]);
if(puts.length>1)list.push(puts[1]);
else if(ors.length>1)list.push(ors[1]);
return list.slice(0,5);
}
async function callEngine(id,prompt){
var i2=id.indexOf(':');
var prov=id.slice(0,i2);
var model=id.slice(i2+1);
if(prov==='core'){if(model==='gemini')return await geminiCall(prompt);return await qwenCall(prompt);}
if(window.FF)return await window.FF.callPrompt(prompt,id);
throw new Error('Free Fleet tidak tersedia');
}
async function callRetry(id,prompt){
try{return await callEngine(id,prompt);}catch(e){return await callEngine(id,prompt);}
}
function withTimeout(p,ms){
return new Promise(function(resolve,reject){
var to=setTimeout(function(){reject(new Error('timeout '+Math.round(ms/1000)+' detik'));},ms);
p.then(function(v){clearTimeout(to);resolve(v);},function(e){clearTimeout(to);reject(e);});
});
}
async function resolveLog(){
var log=lsJSON('ihsg_duel_log',[]);
var due=[];
for(var i=0;i<log.length;i++){
var e=log[i];
if(e.o==null&&e.px&&Date.now()-e.t>20*86400000)due.push(e);
}
if(!due.length)return log;
var codes=[];
for(var d=0;d<due.length;d++){if(codes.indexOf(due[d].c)<0&&codes.length<6)codes.push(due[d].c);}
var prices={};
var settled=await Promise.allSettled(codes.map(function(c){return fetchChart(c+'.JK','1y').then(function(j){var q=j.chart.result[0].indicators.quote[0];var cl=q.close;for(var k=cl.length-1;k>=0;k--){if(cl[k]!=null)return cl[k];}return null;});}));
for(var s=0;s<settled.length;s++){if(settled[s].status==='fulfilled'&&settled[s].value)prices[codes[s]]=settled[s].value;}
for(var k=0;k<log.length;k++){
var e2=log[k];
if(e2.o!=null||!e2.px)continue;
if(Date.now()-e2.t<=20*86400000)continue;
var now=prices[e2.c];
if(!now)continue;
var ret=(now-e2.px)/e2.px*100;
if(e2.v==='BUY')e2.o=ret>0?1:0;
else e2.o=ret<=0?1:0;
}
saveLS('ihsg_duel_log',log);
return log;
}
function engineStats(log){
var map={};
for(var i=0;i<log.length;i++){
var e=log[i];
if(e.o==null)continue;
if(!map[e.eng])map[e.eng]={n:0,hit:0,label:e.label};
map[e.eng].n++;
map[e.eng].hit+=e.o;
}
var out={};
var ks=Object.keys(map);
for(var k=0;k<ks.length;k++){
var m=map[ks[k]];
out[ks[k]]={n:m.n,hit:m.hit,pct:m.n?m.hit/m.n*100:0,label:m.label};
}
return out;
}
function weightOf(stats,id){
var s=stats?stats[id]:null;
if(!s||s.n<5)return 1;
if(s.pct>=60)return 1.5;
if(s.pct<40)return 0.5;
return 1;
}
function block(label,txt,ok,vote,hr){
var col='red';
if(ok)col='green';
var badge='';
if(ok&&vote&&vote.v!=='?'){
var vc='yellow';
if(vote.v==='BUY')vc='green';
if(vote.v==='SELL')vc='red';
badge=' <span class="'+vc+'" style="font-weight:900;">['+vote.v+' '+vote.conf+'/5';
if(vote.plan!=='-')badge+=' • plan '+vote.plan;
badge+=']</span>';
if(hr)badge+=' <span style="color:var(--text-muted);font-size:0.64rem;">HR '+hr.pct.toFixed(0)+'% ('+hr.n+')</span>';
}
return '<div class="report-card" style="margin-top:8px;"><div style="font-size:0.72rem;font-weight:800;color:var('+col+');margin-bottom:4px;">'+esc(label)+badge+'</div><div style="font-size:0.78rem;white-space:pre-wrap;">'+esc(txt)+'</div></div>';
}
function meter(votes,stats){
var cB=0,cW=0,cS=0,cQ=0;
var wB=0,wW=0,wS=0;
for(var i=0;i<votes.length;i++){
var v=votes[i].v;
var w=weightOf(stats,votes[i].id);
if(v==='BUY'){cB++;wB+=w;}
else if(v==='SELL'){cS++;wS+=w;}
else if(v==='WAIT'){cW++;wW+=w;}
else cQ++;
}
var parsed=votes.length-cQ;
if(parsed===0){
return '<div style="font-size:0.76rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:4px;color:var(--yellow);">🗳️ Meter: tidak ada mesin mengikuti format voting - baca narasi manual.</div>';
}
var max=wB;var lab='BUY';
if(wW>max){max=wW;lab='WAIT';}
if(wS>max){max=wS;lab='SELL';}
var agree=max/(wB+wW+wS);
var lamp,col,advice;
if(lab==='SELL'){lamp='🔴';col='red';advice='mayoritas jual/hindari - jangan masuk, tunggu tesis baru.';}
else if(lab==='WAIT'){lamp='🟡';col='yellow';advice='mayoritas tunggu - simpan di watchlist, jangan paksa entry.';}
else if(agree>=0.8){lamp='🟢';col='green';advice='konsensus kuat BUY - ukuran posisi normal sesuai rencana.';}
else if(agree>=0.6){lamp='🟡';col='yellow';advice='BUY tapi suara terbelah - setengah ukuran posisi.';}
else{lamp='🟡';col='yellow';advice='suara sangat terbelah - zona abu-abu, lewat atau ukuran minimal.';}
var h='<div style="font-size:0.78rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:4px;">';
h+='🗳️ <strong>Konsensus berbobot:</strong> '+cB+' BUY / '+cW+' WAIT / '+cS+' SELL (kecocokan '+(agree*100).toFixed(0)+'% dari '+parsed+' suara sah) → '+lamp+' '+advice;
if(cQ>0)h+=' • '+cQ+' mesin tidak ikut format (dikecualikan)';
if(parsed<2)h+=' • ⚠️ suara sah <2 - baca narasi manual juga';
var rec=[];
if(stats){
var ks=Object.keys(stats);
ks.sort(function(a,b){return stats[b].n-stats[a].n;});
for(var r=0;r<ks.length&&r<3;r++){
var s=stats[ks[r]];
if(s.n>=3)rec.push(s.label.replace(/^[^A-Za-z0-9]+/,'')+' '+s.pct.toFixed(0)+'% ('+s.n+')');
}
}
if(rec.length)h+='<br><span style="font-size:0.68rem;color:var(--text-muted);">📈 Rekam jejak 20 hari: '+rec.join(' • ')+'</span>';
h+='</div>';
return h;
}
window.runDuel5=async function(){
if(!window.lastTicker){alert('Proses sebuah saham dulu.');return;}
var btn=document.getElementById('d5Btn');
btn.disabled=true;btn.innerText='Duel berjalan...';
var out=document.getElementById('d5Out');
out.classList.remove('hidden');
out.innerHTML='<div class="skel-box" style="height:80px"></div>';
var list=engines();
var prompt=buildPrompt();
var code=window.lastTicker;
var jobs=list.map(function(en){return callRetry(en.id,prompt).then(function(t){return {en:en,txt:t};});});
var res=await Promise.allSettled(jobs);
var ok=[];var votes=[];var h='';
for(var i=0;i<res.length;i++){
if(res[i].status==='fulfilled'){
var item=res[i].value;
var vt=parseVote(item.txt);
ok.push(item);
votes.push({v:vt.v,id:list[i].id});
if(vt.v!=='?'&&window.lastPrice){
var log0=lsJSON('ihsg_duel_log',[]);
log0.push({t:Date.now(),c:code,eng:list[i].id,label:list[i].label,v:vt.v,px:window.lastPrice,o:null});
if(log0.length>400)log0=log0.slice(log0.length-400);
saveLS('ihsg_duel_log',log0);
}
h+=block(list[i].label,item.txt,true,vt,null);
}else{
h+=block(list[i].label,'Tidak merespon: '+res[i].reason.message,false,null);
}
}
var log=await resolveLog();
var stats=engineStats(log);
h='';
for(var i2=0;i2<res.length;i2++){
if(res[i2].status==='fulfilled'){
var vt2=parseVote(res[i2].value.txt);
h+=block(list[i2].label,res[i2].value.txt,true,vt2,stats[list[i2].id]);
}else{
h+=block(list[i2].label,'Tidak merespon: '+res[i2].reason.message,false,null);
}
}
var head=meter(votes,stats);
head+='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">'+ok.length+'/5 mesin menjawab (voting berbobot rekam jejak).</div>';
h=head+h;
if(ok.length>=2)h+='<button class="btn-copy" style="margin-top:8px;" id="d5SumBtn" onclick="summarizeDuel()">🧠 Ringkas Konsensus</button>';
out.innerHTML=h;
window.__d5ok=ok;
btn.disabled=false;btn.innerText='⚔️ Jalankan Duel 5 Mesin';
};
window.summarizeDuel=async function(){
var ok=window.__d5ok||[];
if(ok.length<2)return;
var btn=document.getElementById('d5SumBtn');
if(btn&&btn.disabled)return;
if(btn){btn.disabled=true;btn.innerText='🧠 Merangkum...';}
var out=document.getElementById('d5Out');
var old=document.getElementById('d5sumCard');
if(old)old.remove();
var d=document.createElement('div');
d.className='report-card';d.style.marginTop='8px';d.id='d5sumCard';
d.innerHTML='<div style="font-size:0.72rem;font-weight:800;color:var(--accent);margin-bottom:4px;">🧠 Konsensus</div><div id="d5sumTxt" style="font-size:0.78rem;white-space:pre-wrap;">Merangkum...</div>';
out.appendChild(d);
var box=document.getElementById('d5sumTxt');
var body='Opini analis AI:'+NL;
for(var i=0;i<ok.length;i++)body+='['+ok[i].en.label+'] '+ok[i].txt+NL;
body+=NL+'Ringkas: titik SETUJU, titik SELISIH, rekomendasi final 1 kalimat. Maks 80 kata.';
var done=false;
var maxTry=ok.length<3?ok.length:3;
for(var k=0;k<maxTry;k++){
if(done)break;
try{
var t=await withTimeout(callEngine(ok[k].en.id,body),45000);
box.innerHTML=esc(t);
done=true;
}catch(e){
box.innerHTML='Mesin '+ok[k].en.label+' gagal ('+esc(e.message)+') - mencoba mesin berikutnya...';
}
}
if(!done)box.innerHTML='⚠️ Semua mesin gagal merangkum (timeout/kuota). Narasi lengkap tetap ada di atas - atau klik Ringkas sekali lagi nanti.';
if(btn){btn.disabled=false;btn.innerText='🧠 Ringkas Konsensus';}
};
})();
/* END duel5 v7 */
