/* agent-grader.js v4 - Setup Grader: skor KUALITAS + skor TIMING terpisah + kalibrasi + aturan */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var anchor=document.getElementById('regimeOut')?document.getElementById('regimeOut').closest('.card'):(document.getElementById('moneyflowOut')?document.getElementById('moneyflowOut').closest('.card'):null);
P.card('tab-analysis',
'<div class="card-title"><span>🎯 Setup Grader</span><span class="agent-pill master">Kualitas + Timing</span></div>'+
'<div id="graderOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - skor kualitas setup DAN skor timing entry dipisah, supaya jelas: beli sekarang atau tunggu harga.</div>',
anchor);
function domText(id){var e=document.getElementById(id);return e?e.innerText.toUpperCase():'';}
function domReady(id){
var e=document.getElementById(id);
if(!e)return true;
if(e.querySelector('.skel-box'))return false;
var t=e.innerText||'';
return t.length>=15;
}
function agentsReady(){return domReady('bandarOut')&&domReady('moneyflowOut')&&domReady('regimeOut');}
function waitAgents(maxMs){
return new Promise(function(resolve){
var t0=Date.now();
function tick(){
if(agentsReady()||Date.now()-t0>maxMs){resolve(agentsReady());return;}
setTimeout(tick,600);
}
tick();
});
}
function isNA(txt){return txt.length<15||txt.indexOf('TIDAK CUKUP')>=0||txt.indexOf('TIDAK LENGKAP')>=0||txt.indexOf('GAGAL')>=0;}
function logScore(code,score,tm){
var log=lsJSON('ihsg_grader_log',[]);
log.push({t:Date.now(),c:code,s:score,tm:tm});
if(log.length>300)log=log.slice(log.length-300);
saveLS('ihsg_grader_log',log);
}
function calibration(){
var J=window.journal;
if(!Array.isArray(J))J=lsJSON('ihsg_journal',[]);
if(!Array.isArray(J)||!J.length)return null;
var log=lsJSON('ihsg_grader_log',[]);
if(!log.length)return null;
var pairs=[];
for(var i=0;i<J.length;i++){
var e=J[i];
if(e.outcome==null||!e.t||!e.d)continue;
var best=null;
for(var k=0;k<log.length;k++){
var L=log[k];
if(L.c!==e.t)continue;
if(L.t>e.d)continue;
if(e.d-L.t>10*86400000)continue;
if(!best||L.t>best.t)best=L;
}
if(best)pairs.push({s:best.s,o:e.outcome});
}
if(pairs.length<8)return null;
var bands=[{n:0,sum:0},{n:0,sum:0},{n:0,sum:0}];
for(var p=0;p<pairs.length;p++){
var idx=0;
if(pairs[p].s>=60&&pairs[p].s<75)idx=1;
if(pairs[p].s>=75)idx=2;
bands[idx].n++;
bands[idx].sum+=pairs[p].o;
}
var avg=[];
for(var b=0;b<3;b++){
if(bands[b].n>0)avg.push(bands[b].sum/bands[b].n);
else avg.push(null);
}
var T=75;
if(avg[2]!=null&&avg[2]<=0)T=80;
else if(avg[1]!=null&&avg[1]>0&&avg[2]!=null&&avg[2]<=0)T=60;
return {n:pairs.length,bands:bands,avg:avg,T:T};
}
function computeTiming(A,n){
var rows=[];var score=0;
var ma20=SW.sma(A.c,20);
var m20=ma20[n-1];
var price=A.c[n-1];
var d=m20?(price-m20)/m20*100:0;
var t1=0;
if(d>=-2&&d<=3)t1=30;
else if(d>3&&d<=6)t1=15;
else if(d<-2)t1=10;
else t1=0;
rows.push({lab:'Jarak ke zona entry (MA20)',pts:t1,max:30,ok:t1>=25,warn:t1>=10&&t1<25,note:(d>=0?'+':'')+d.toFixed(1)+'% dari MA20'});
score+=t1;
var rsi=SW.rsi(A.c,14)[n-1];
var t2=0;
if(rsi<=65)t2=25;
else if(rsi<=72)t2=12;
else t2=0;
rows.push({lab:'RSI tidak jenuh',pts:t2,max:25,ok:t2>=20,warn:t2>=10&&t2<20,note:'RSI '+rsi.toFixed(0)});
score+=t2;
var res=SW.highest(A.h,n-20,n);
var dr=res?(res-price)/price*100:0;
var t3=0;
if(dr>=3)t3=25;
else if(dr>=1)t3=12;
else t3=0;
rows.push({lab:'Ruang ke resist 20 hari',pts:t3,max:25,ok:t3>=20,warn:t3>=10&&t3<20,note:(dr>=0?'+':'')+dr.toFixed(1)+'%'});
score+=t3;
var bull=A.c[n-1]>A.o[n-1];
var up=A.c[n-1]>A.c[n-2];
var t4=0;
if(bull&&up)t4=20;
else if(bull)t4=10;
else t4=0;
rows.push({lab:'Konfirmasi candle hari ini',pts:t4,max:20,ok:t4>=15,warn:t4>=8&&t4<15,note:bull?'bullish':'bearish'});
score+=t4;
var zone='';
if(m20)zone=Math.round(m20*0.99).toLocaleString('id-ID')+' - '+Math.round(m20*1.03).toLocaleString('id-ID');
return {score:score,rows:rows,zone:zone};
}
async function grade(code){
var candle=await SW.candle(code,'1y');
var A=SW.arrays(candle);var n=A.c.length;
var items=[];
var ma20=SW.sma(A.c,20),ma50=SW.sma(A.c,50);
var m20=ma20[n-1],m50=ma50[n-1],price=A.c[n-1];
var slope=(m20!=null&&ma20[n-6]!=null&&ma20[n-6]!==0)?(m20-ma20[n-6])/ma20[n-6]*100:0;
var t=0;
if(price>m20)t+=8;
if(m20>m50)t+=7;
if(slope>0.3)t+=5;
items.push({lab:'Tren & struktur',pts:t,max:20,ok:t>=15,warn:t>=8&&t<15,note:'harga vs MA20/MA50'});
var wC=null;try{var wj=await fetchChart(code+'.JK','1y','1wk');wC=wj.chart.result[0];}catch(e){}
var mtf=wC?SW.tfScore(candle,wC):null;
var mp=mtf==null?0:Math.round(mtf*0.15);
items.push({lab:'Multi-TF (DxW)',pts:mp,max:15,ok:mp>=11,warn:mp>=7&&mp<11,note:mtf==null?'n/a':'skor '+mtf});
var rsi=SW.rsi(A.c,14)[n-1];
var mo=0;
if(rsi>=45&&rsi<=65)mo=10;else if(rsi>65&&rsi<=72)mo=6;else if(rsi>=38&&rsi<45)mo=5;else if(rsi>72)mo=2;else mo=3;
items.push({lab:'Momentum RSI',pts:mo,max:10,ok:mo>=8,warn:mo>=4&&mo<8,note:'RSI '+rsi.toFixed(0)});
var q=candle.indicators.quote[0];var vol=[];if(q.volume){for(var i=0;i<q.volume.length;i++){if(q.volume[i]!=null)vol.push(q.volume[i]);}}
var vp=0;
if(vol.length>=21){var avg=0;for(var k=vol.length-21;k<vol.length-1;k++)avg+=vol[k];avg/=20;var lv=vol[vol.length-1];var ratio=avg>0?lv/avg:1;var chg=(A.c[n-1]-A.c[n-2])/A.c[n-2]*100;
if(chg>0&&ratio>=1.2)vp=10;else if(chg<0&&ratio<0.9)vp=8;else if(chg>0)vp=6;else vp=4;}
items.push({lab:'Konfirmasi volume',pts:vp,max:10,ok:vp>=8,warn:vp>=5&&vp<8,note:'vol vs rata-rata'});
var bt=domText('bandarOut');var bp;var bnote;
if(isNA(bt)){bp=5;bnote='n/a (agent belum siap)';}
else if(bt.indexOf('AKUMULASI KUAT')>=0){bp=15;bnote='akumulasi kuat';}
else if(bt.indexOf('AKUMULASI SEDANG')>=0){bp=11;bnote='akumulasi';}
else if(bt.indexOf('KONSOLIDASI')>=0){bp=6;bnote='konsolidasi';}
else if(bt.indexOf('NETRAL')>=0){bp=5;bnote='netral';}
else if(bt.indexOf('DISTRIBUSI')>=0){bp=0;bnote='DISTRIBUSI (bandar keluar)';}
else{bp=5;bnote='n/a';}
items.push({lab:'Tape Reader (bandar)',pts:bp,max:15,ok:bp>=11,warn:bp>=5&&bp<11,note:bnote});
var mf=domText('moneyflowOut');var mfp;var mnote;
if(isNA(mf)){mfp=5;mnote='n/a (agent belum siap)';}
else if(mf.indexOf('SANGAT KUAT')>=0){mfp=12;mnote='masuk deras (jenuh)';}
else if(mf.indexOf('KUAT')>=0){mfp=15;mnote='dana masuk';}
else if(mf.indexOf('NETRAL')>=0){mfp=7;mnote='netral';}
else if(mf.indexOf('SANGAT LEMAH')>=0){mfp=2;mnote='keluar deras (oversold)';}
else if(mf.indexOf('LEMAH')>=0){mfp=0;mnote='dana keluar';}
else{mfp=5;mnote='n/a';}
items.push({lab:'Money Flow',pts:mfp,max:15,ok:mfp>=12,warn:mfp>=6&&mfp<12,note:mnote});
var rg=domText('regimeOut');var rgp;var rnote;
if(isNA(rg)){rgp=5;rnote='n/a (agent belum siap)';}
else if(rg.indexOf('BEARISH')>=0){rgp=0;rnote='pasar bearish';}
else if(rg.indexOf('CAMPURAN')>=0){rgp=5;rnote='pasar campuran';}
else if(rg.indexOf('NETRAL-BULLISH')>=0){rgp=10;rnote='netral-bullish';}
else if(rg.indexOf('BULLISH')>=0){rgp=15;rnote='pasar bullish';}
else{rgp=5;rnote='n/a';}
items.push({lab:'Market Regime',pts:rgp,max:15,ok:rgp>=10,warn:rgp>=5&&rgp<10,note:rnote});
var total=0;for(var x=0;x<items.length;x++)total+=items[x].pts;
var timing=computeTiming(A,n);
logScore(code,total,timing.score);
return {total:total,items:items,timing:timing};
}
function render(res){
var box=document.getElementById('graderOut');if(!box)return;
var s=res.total;
var cal=calibration();
var down=false;
if(cal){
var bi=0;
if(s>=60&&s<75)bi=1;
if(s>=75)bi=2;
var bavg=cal.avg[bi];
if(bavg!=null&&bavg<0&&cal.bands[bi].n>=4)down=true;
}
var gr=s>=75?'A':s>=60?'B':s>=45?'C':'D';
if(down){
if(gr==='A')gr='B';
else if(gr==='B')gr='C';
else gr='D';
}
var verdict=s>=75?'AMBIL - setup berkualitas':s>=60?'BOLEH - disiplin ketat':s>=45?'LEWATI - kecuali konviksi khusus':'HINDARI - risiko dominan';
if(down)verdict+=' (kalibrasi: band skor ini historis rugi untuk Anda)';
var col=s>=75?'green':s>=60?'yellow':s>=45?'yellow':'red';
if(down&&col==='green')col='yellow';
var h='<div style="display:flex;align-items:center;gap:14px;margin-bottom:6px;">';
h+='<div style="font-family:var(--mono);font-size:2.2rem;font-weight:900;color:var('+col+');">'+s+'</div>';
h+='<div><div style="font-weight:800;color:var('+col+');font-size:1rem;">KUALITAS: PERINGKAT '+gr+' - '+verdict+'</div>';
h+='<div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">Skor confluence 0-100 dari 7 komponen</div></div></div>';
var ts=res.timing.score;
var tcol=ts>=60?'green':ts>=40?'yellow':'red';
h+='<div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">';
h+='<div style="font-family:var(--mono);font-size:1.6rem;font-weight:900;color:var('+tcol+');">'+ts+'</div>';
h+='<div><div style="font-weight:800;color:var('+tcol+');font-size:0.9rem;">TIMING ENTRY</div>';
h+='<div style="font-size:0.66rem;color:var(--text-muted);">masuk sekarang atau tunggu harga</div></div></div>';
for(var ti=0;ti<res.timing.rows.length;ti++){
var tr=res.timing.rows[ti];
var tic=tr.ok?'✅':tr.warn?'⚠️':'❌';
h+='<div style="display:flex;justify-content:space-between;font-size:0.72rem;padding:2px 0;border-bottom:1px dashed rgba(255,255,255,.06);">';
h+='<span>'+tic+' '+tr.lab+' <span style="color:var(--text-muted);font-size:0.64rem;">('+tr.note+')</span></span>';
h+='<span style="font-family:var(--mono);font-weight:700;">'+tr.pts+'/'+tr.max+'</span></div>';
}
var combo='';
if(s>=70&&ts>=60)combo='🟢 Kualitas + timing sejajar - eksekusi sesuai rencana.';
else if(s>=70&&ts<60)combo='🟡 Setup bagus tapi harga mahal - tunggu zona Rp '+res.timing.zone+'.';
else if(s>=60&&ts>=60)combo='🟡 Timing oke, kualitas sedang - ukuran posisi kecil.';
else combo='🔴 Kualitas atau timing belum lulus - lewat dulu.';
h+='<div style="font-size:0.76rem;font-weight:700;padding:8px 10px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin:8px 0;color:var(--text-muted);">'+combo+'</div>';
if(cal){
var line='🎚️ Kalibrasi pribadi ('+cal.n+' pasangan): ';
line+='<60 → '+(cal.avg[0]!=null?(cal.avg[0]>=0?'+':'')+cal.avg[0].toFixed(1)+'%':'-');
line+=' | 60-74 → '+(cal.avg[1]!=null?(cal.avg[1]>=0?'+':'')+cal.avg[1].toFixed(1)+'%':'-');
line+=' | >=75 → '+(cal.avg[2]!=null?(cal.avg[2]>=0?'+':'')+cal.avg[2].toFixed(1)+'%':'-');
line+=' • ambang pribadi: >='+cal.T;
h+='<div style="font-size:0.7rem;padding:6px 8px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin-bottom:8px;color:var(--text-muted);">'+line+'</div>';
}
var rules=lsJSON('ihsg_rules',[]);
if(rules.length){
var rl='📌 Aturan pribadi Anda: ';
for(var r0=0;r0<rules.length&&r0<2;r0++)rl+=(r0>0?' • ':'')+rules[r0];
h+='<div style="font-size:0.7rem;padding:6px 8px;border:1px solid rgba(251,191,36,.35);border-radius:10px;background:rgba(251,191,36,.08);margin-bottom:8px;color:var(--yellow);">'+rl+'</div>';
}
for(var i=0;i<res.items.length;i++){
var it=res.items[i];
var ic=it.ok?'✅':it.warn?'⚠️':'❌';
h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);">';
h+='<span>'+ic+' '+it.lab+' <span style="color:var(--text-muted);font-size:0.66rem;">('+it.note+')</span></span>';
h+='<span style="font-family:var(--mono);font-weight:700;">'+it.pts+'/'+it.max+'</span></div>';
}
h+='<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Kualitas = apakah setup layak. Timing = apakah harganya pantas hari ini. Keduanya harus lulus.</div>';
box.innerHTML=h;
}
var trendEl=document.getElementById('valTrend');
var obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(function(){
var c=window.lastTicker;if(!c)return;
var box=document.getElementById('graderOut');if(box)box.innerHTML='<div class="skel-box" style="height:60px"></div>';
waitAgents(8000).then(function(){return grade(c);}).then(render).catch(function(e){if(box)box.innerHTML='<span style="color:var(--red);">Grader gagal: '+esc(e.message)+'</span>';});
},900);});
if(trendEl)obs.observe(trendEl,{childList:true,characterData:true,subtree:true});
})();
/* END agent-grader v4 */
