/* planpro.js v2 - Upgrade Kartu Trading Plan & Swing Plan: sizing otomatis, gerbang disiplin, rekomendasi A/B, cetak & salin */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var NL=String.fromCharCode(10);
var busy=false;
var lastWrite=0;
function nums(t){var out=[];var cur='';for(var i=0;i<t.length;i++){var ch=t.charAt(i);if(ch>='0'&&ch<='9'){cur+=ch;}else{if(cur){out.push(parseInt(cur,10));cur='';}}}if(cur)out.push(parseInt(cur,10));return out;}
function g(id){var e=document.getElementById(id);return e?e.innerText:'-';}
function cardByTitle(kw){
var ts=document.querySelectorAll('.card-title');
for(var i=0;i<ts.length;i++){
var t=(ts[i].innerText||'').toUpperCase();
if(t.indexOf(kw)>=0)return ts[i].closest('.card');
}
return null;
}
function getModal(){
var P0=window.portfolio;
if(!Array.isArray(P0))P0=lsJSON('ihsg_portfolio',null);
if(Array.isArray(P0)&&P0.length){
var m=0;
for(var i=0;i<P0.length;i++){var e=P0[i];var l=parseFloat(e.lot||e.qty)||0;var a=parseFloat(e.avg||e.entry||e.price)||0;m+=l*100*a;}
if(m>0)return m;
}
if(P0&&typeof P0==='object'&&!Array.isArray(P0)){
var m2=0;var ks=Object.keys(P0);
for(var k=0;k<ks.length;k++){var v=P0[ks[k]];if(v&&typeof v==='object'){var l2=parseFloat(v.lot||v.qty)||0;var a2=parseFloat(v.avg||v.entry||v.price)||0;m2+=l2*100*a2;}}
if(m2>0)return m2;
}
return 10000000;
}
function sizeFor(entry,sl,riskPct,modal){
var budget=modal*riskPct/100;
var per=entry-sl;
if(per<=0)return{lot:0,riskRp:0,budget:budget};
var lot=Math.floor(budget/per/100);
if(lot<0)lot=0;
return{lot:lot,riskRp:lot*100*per,budget:budget};
}
function gates(){
var rg=(g('regimeOut')||'').toUpperCase();
var gt=g('graderOut')||'';
var ti=gt.indexOf('TIMING ENTRY');
var qn=null,tn=null;
if(ti>=0){var a=nums(gt.slice(0,ti));var b=nums(gt.slice(ti));if(a.length)qn=a[0];if(b.length)tn=b[0];}
else{var c=nums(gt);if(c.length)qn=c[0];}
var heat=lsJSON('ihsg_portdoc_last',null);
var hv=heat&&heat.heat!=null?heat.heat:null;
var list=[];
list.push({ok:rg.indexOf('BEARISH')<0&&rg.length>10,warn:rg.length<=10,lab:'Regime pasar tidak bearish',note:rg.length>10?rg.slice(0,24):'belum terbaca'});
list.push({ok:qn!=null&&qn>=60,warn:qn==null,lab:'Kualitas Grader >=60',note:qn!=null?'skor '+qn:'belum terbaca'});
list.push({ok:tn!=null&&tn>=60,warn:tn==null,lab:'Timing entry >=60',note:tn!=null?'skor '+tn:'belum terbaca'});
list.push({ok:hv!=null&&hv<=6,warn:hv==null,lab:'Portfolio heat <=6%',note:hv!=null?hv.toFixed(1)+'%':'belum direview'});
return list;
}
function gateHtml(list){
var h='';
var bad=0,warn=0;
for(var i=0;i<list.length;i++){
var it=list[i];
var ic=it.ok?'✅':(it.warn?'⚠️':'❌');
if(!it.ok&&!it.warn)bad++;
if(it.warn)warn++;
h+='<div style="display:flex;justify-content:space-between;font-size:0.72rem;padding:2px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span>'+ic+' '+it.lab+'</span><span style="color:var(--text-muted);font-size:0.66rem;">'+it.note+'</span></div>';
}
var verdict,vcol;
if(bad>0){verdict='🔴 JANGAN EKSEKUSI - ada gerbang gagal. Tunggu perbaikan.';vcol='red';}
else if(warn>0){verdict='🟡 Ada data belum terbaca - konfirmasi ulang sebelum entry.';vcol='yellow';}
else{verdict='🟢 Semua gerbang lulus - eksekusi sesuai ukuran di atas.';vcol='green';}
h+='<div style="font-size:0.74rem;font-weight:800;color:var('+vcol+');margin-top:6px;">'+verdict+'</div>';
return h;
}
function fmt(n){return Math.round(n).toLocaleString('id-ID');}
async function enhance(){
if(busy)return;
var code=window.lastTicker;
if(!code)return;
var qCard=cardByTitle('KARTU TRADING PLAN');
var sCard=cardByTitle('SWING PLAN');
if(!qCard&&!sCard)return;
busy=true;
try{
var candle=await SW.candle(code,'1y');
var A=SW.arrays(candle);var n=A.c.length;
if(n<60){busy=false;return;}
var price=(typeof cachePrice==='function'&&cachePrice(code))||A.c[n-1];
var atr=SW.atr(A.h,A.l,A.c,14)[n-1]||price*0.02;
var ma20=SW.sma(A.c,20)[n-1];
var sup=SW.lowest(A.l,n-20,n);
var swingLow=SW.lowest(A.l,n-20,n);
var riskSel=document.getElementById('ppRisk');
var riskPct=riskSel?parseFloat(riskSel.value):1;
var modal=getModal();
var entryA=sup;
var slA=sup-1.2*atr;
var riskA=entryA-slA;
var t1A=entryA+riskA*1.0;
var t2A=entryA+riskA*2.0;
var rrA=riskA>0?(t2A-entryA)/riskA:0;
var szA=sizeFor(entryA,slA,riskPct,modal);
var entryB=ma20*1.01;
var slB=swingLow-0.3*atr;
var riskB=entryB-slB;
var t1B=entryB+riskB*1.5;
var t2B=entryB+riskB*2.5;
var rrB=riskB>0?(t2B-entryB)/riskB:0;
var szB=sizeFor(entryB,slB,riskPct,modal);
var gt=g('graderOut')||'';
var ti=gt.indexOf('TIMING ENTRY');
var qn=null,tn=null;
if(ti>=0){var aa=nums(gt.slice(0,ti));var bb=nums(gt.slice(ti));if(aa.length)qn=aa[0];if(bb.length)tn=bb[0];}
var reco='';
if(qn!=null&&tn!=null&&qn>=60&&tn>=60)reco='🟢 Rencana disarankan: B (swing 7-25 hari) - kualitas & timing lulus.';
else if(tn!=null&&tn>=60)reco='🟡 Rencana disarankan: A (day-trade) ukuran kecil - kualitas sedang.';
else reco='🟠 Belum ada rencana yang lulus timing - tunggu zona entry.';
var gatesList=gates();
var shareQ=qCard?qCard.querySelector('#shareBtn'):null;
var shareS=sCard?sCard.querySelector('#shareBtn'):null;
if(qCard){
var h='<div class="card-title"><span>🧾 Kartu Trading Plan</span><span class="agent-pill master">PLAN PRO v2</span></div>';
h+='<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;"><span style="font-size:0.7rem;color:var(--text-muted);">Risiko/trade:</span><select id="ppRisk" class="fv-input" style="width:80px;margin-top:0;"><option value="0.5">0.5%</option><option value="1">1%</option><option value="2">2%</option></select><button class="btn-mini" onclick="PLANPRO.refresh()">🔄</button></div>';
h+='<div style="font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:4px;">📌 Rencana A - Day-trade / Pullback Support</div>';
h+='<div class="metric-grid" style="margin-bottom:6px;">';
h+='<div class="metric-box"><div class="metric-label">Entry (limit)</div><div class="metric-value" id="rEntry">'+fmt(entryA)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Stop Loss</div><div class="metric-value red" id="rSl">'+fmt(slA)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Target 1 (1R)</div><div class="metric-value green" id="rTp1">'+fmt(t1A)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Target 2 (2R)</div><div class="metric-value green" id="rTp2">'+fmt(t2A)+'</div></div>';
h+='</div>';
h+='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">R/R 1:<span id="rRr">'+rrA.toFixed(2)+'</span> • risiko/share <span id="rPct">'+fmt(riskA)+'</span> • <strong style="color:#fff;">'+szA.lot+' lot</strong> (risiko Rp '+fmt(szA.riskRp)+' = '+riskPct+'% modal '+fmt(modal)+')</div>';
h+='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">'+reco+'</div>';
h+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin-bottom:4px;">🚦 Gerbang Disiplin</div>';
h+=gateHtml(gatesList);
h+='<div style="display:flex;gap:6px;margin-top:8px;"><button class="btn-copy" style="margin-top:0;" onclick="window.print()">🖨 Cetak / PDF</button><button class="btn-copy" style="margin-top:0;" onclick="PLANPRO.copy()">📋 Salin Plan</button></div>';
qCard.innerHTML=h;
var rs=qCard.querySelector('#ppRisk');if(rs){rs.value=String(riskPct);rs.onchange=function(){enhance();};}
if(shareQ)qCard.appendChild(shareQ);
}
if(sCard){
var hs='<div class="card-title"><span>🧾 Kartu Swing Plan</span><span class="agent-pill master">PLAN PRO v2</span></div>';
hs+='<div id="swPlan" style="font-size:0.78rem;color:var(--text-muted);line-height:1.7;">';
hs+='Rencana B - Swing 7-25 hari (pullback MA20).'+NL;
hs+='Zona entry: '+fmt(ma20)+' - '+fmt(ma20*1.03)+' (tengah '+fmt(entryB)+').'+NL;
hs+='Stop Loss: '+fmt(slB)+' (swing low 20h - 0.3 ATR).'+NL;
hs+='Target 1: '+fmt(t1B)+' (1.5R, trim setengah). Target 2: '+fmt(t2B)+' (2.5R).'+NL;
hs+='R/R 1:'+rrB.toFixed(2)+' • ukuran '+szB.lot+' lot (risiko Rp '+fmt(szB.riskRp)+').'+NL;
hs+='Setelah T1: naikkan SL ke break-even; sisa trail MA20.'+NL;
hs+='Batal bila close di bawah '+fmt(slB)+' atau regime berubah bearish.';
hs+='</div>';
hs+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin:8px 0 4px;">🚦 Gerbang Disiplin</div>';
hs+=gateHtml(gatesList);
sCard.innerHTML=hs;
if(shareS)sCard.appendChild(shareS);
}
lastWrite=Date.now();
window.__planproCache={code:code,a:{entry:entryA,sl:slA,t1:t1A,t2:t2A,lot:szA.lot},b:{entry:entryB,sl:slB,t1:t1B,t2:t2B,lot:szB.lot}};
}catch(e){}
busy=false;
}
window.PLANPRO={refresh:function(){busy=false;enhance();},copy:function(){
var c=window.__planproCache;
if(!c){toast('Proses saham dulu.');return;}
var t='PLAN '+c.code+NL+'A (day): entry '+fmt(c.a.entry)+' SL '+fmt(c.a.sl)+' T1 '+fmt(c.a.t1)+' T2 '+fmt(c.a.t2)+' ('+c.a.lot+' lot)'+NL+'B (swing): entry '+fmt(c.b.entry)+' SL '+fmt(c.b.sl)+' T1 '+fmt(c.b.t1)+' T2 '+fmt(c.b.t2)+' ('+c.b.lot+' lot)';
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('📋 Plan disalin.');}).catch(function(){window.prompt('Salin plan:',t);});}
else window.prompt('Salin plan:',t);
}};
var trendEl=document.getElementById('valTrend');
if(trendEl){
var ob=new MutationObserver(function(){clearTimeout(ob._t);ob._t=setTimeout(enhance,1300);});
ob.observe(trendEl,{childList:true,characterData:true,subtree:true});
}
function watchSwing(){
var sp=document.getElementById('swPlan');
if(!sp){setTimeout(watchSwing,1200);return;}
var ob2=new MutationObserver(function(){
if(Date.now()-lastWrite<900)return;
clearTimeout(ob2._t);ob2._t=setTimeout(enhance,500);
});
ob2.observe(sp,{childList:true,characterData:true,subtree:true});
}
setTimeout(watchSwing,1500);
setTimeout(enhance,2000);
})();
/* END planpro v2 */
