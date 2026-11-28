/* planpro.js v3 - Plan Pro: siklus hidup plan, tangga harga SVG, scaling lot, expectancy, heat-after-add, alert ntfy, jurnal, ticket, riwayat */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var NL=String.fromCharCode(10);
var busy=false;
var lastWrite=0;
var override=null;
function nums(t){var out=[];var cur='';for(var i=0;i<t.length;i++){var ch=t.charAt(i);if(ch>='0'&&ch<='9'){cur+=ch;}else{if(cur){out.push(parseInt(cur,10));cur='';}}}if(cur)out.push(parseInt(cur,10));return out;}
function g(id){var e=document.getElementById(id);return e?e.innerText:'-';}
function fmt(n){return Math.round(n).toLocaleString('id-ID');}
function cardByTitle(kw){
var ts=document.querySelectorAll('.card-title');
for(var i=0;i<ts.length;i++){var t=(ts[i].innerText||'').toUpperCase();if(t.indexOf(kw)>=0)return ts[i].closest('.card');}
return null;
}
function getModal(){
var P0=window.portfolio;
if(!Array.isArray(P0))P0=lsJSON('ihsg_portfolio',null);
if(Array.isArray(P0)&&P0.length){var m=0;for(var i=0;i<P0.length;i++){var e=P0[i];m+=(parseFloat(e.lot||e.qty)||0)*100*(parseFloat(e.avg||e.entry||e.price)||0);}if(m>0)return m;}
if(P0&&typeof P0==='object'&&!Array.isArray(P0)){var m2=0;var ks=Object.keys(P0);for(var k=0;k<ks.length;k++){var v=P0[ks[k]];if(v&&typeof v==='object')m2+=(parseFloat(v.lot||v.qty)||0)*100*(parseFloat(v.avg||v.entry||v.price)||0);}if(m2>0)return m2;}
return 10000000;
}
function sizeFor(entry,sl,riskPct,modal){
var budget=modal*riskPct/100;var per=entry-sl;
if(per<=0)return{lot:0,riskRp:0,budget:budget};
var lot=Math.floor(budget/per/100);if(lot<0)lot=0;
return{lot:lot,riskRp:lot*100*per,budget:budget};
}
function notify(title,msg){
toast(title+' '+msg);
var topic=localStorage.getItem('ihsg_ntfy');
if(!topic)return;
try{fetch('https://ntfy.sh/'+encodeURIComponent(topic),{method:'POST',headers:{'Title':title,'Priority':'4'},body:msg}).catch(function(){});}catch(e){}
}
function bandWR(qn){
var J=window.journal;if(!Array.isArray(J))J=lsJSON('ihsg_journal',[]);
var log=lsJSON('ihsg_grader_log',[]);
if(!Array.isArray(J)||!log.length)return 0.45;
var wins=0,tot=0;
for(var i=0;i<J.length;i++){
var e=J[i];if(e.outcome==null||!e.t||!e.d)continue;
var best=null;
for(var k=0;k<log.length;k++){var L=log[k];if(L.c!==e.t||L.t>e.d||e.d-L.t>10*86400000)continue;if(!best||L.t>best.t)best=L;}
if(!best)continue;
var bi=0;if(best.s>=60&&best.s<75)bi=1;if(best.s>=75)bi=2;
var qb=0;if(qn!=null){if(qn>=60&&qn<75)qb=1;if(qn>=75)qb=2;}
if(bi!==qb)continue;
tot++;if(e.outcome>0)wins++;
}
if(tot<5)return 0.45;
return wins/tot;
}
function ladderSvg(sl,entry,t1,t2,price,cur){
var lo=Math.min(sl,price)*0.99;var hi=Math.max(t2,price)*1.01;
var span=(hi-lo)||1;var W=280,H=150,pad=10;
function Y(v){return H-pad-((v-lo)/span)*(H-2*pad);}
var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:150px;display:block;margin:6px 0;">';
s+='<rect x="60" y="'+Y(entry).toFixed(1)+'" width="'+(W-70)+'" height="'+Math.max(2,Y(sl)-Y(entry)).toFixed(1)+'" fill="rgba(239,68,68,.14)"/>';
s+='<rect x="60" y="'+Y(t1).toFixed(1)+'" width="'+(W-70)+'" height="'+Math.max(2,Y(entry)-Y(t1)).toFixed(1)+'" fill="rgba(251,191,36,.12)"/>';
s+='<rect x="60" y="'+Y(t2).toFixed(1)+'" width="'+(W-70)+'" height="'+Math.max(2,Y(t1)-Y(t2)).toFixed(1)+'" fill="rgba(34,197,94,.14)"/>';
var levels=[{v:sl,c:'#ef4444',t:'SL '+fmt(sl)},{v:entry,c:'#fbbf24',t:'ENTRY '+fmt(entry)},{v:t1,c:'#22c55e',t:'T1 '+fmt(t1)},{v:t2,c:'#22c55e',t:'T2 '+fmt(t2)}];
for(var i=0;i<levels.length;i++){
var L=levels[i];var y=Y(L.v);
s+='<line x1="60" x2="'+(W-10)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+L.c+'" stroke-width="1.4" stroke-dasharray="4 3"/>';
s+='<text x="56" y="'+(y+3).toFixed(1)+'" fill="'+L.c+'" font-size="8" text-anchor="end">'+L.t+'</text>';
}
var py=Y(price);
s+='<line x1="60" x2="'+(W-10)+'" y1="'+py.toFixed(1)+'" y2="'+py.toFixed(1)+'" stroke="'+cur+'" stroke-width="2"/>';
s+='<text x="'+(W-12)+'" y="'+(py-4).toFixed(1)+'" fill="'+cur+'" font-size="9" font-weight="bold" text-anchor="end">NOW '+fmt(price)+'</text>';
s+='</svg>';
return s;
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
list.push({ok:rg.indexOf('BEARISH')<0&&rg.length>10,warn:rg.length<=10,lab:'Regime tidak bearish',note:rg.length>10?rg.slice(0,22):'belum terbaca'});
list.push({ok:qn!=null&&qn>=60,warn:qn==null,lab:'Kualitas >=60',note:qn!=null?'skor '+qn:'belum terbaca'});
list.push({ok:tn!=null&&tn>=60,warn:tn==null,lab:'Timing >=60',note:tn!=null?'skor '+tn:'belum terbaca'});
list.push({ok:hv!=null&&hv<=6,warn:hv==null,lab:'Heat <=6%',note:hv!=null?hv.toFixed(1)+'%':'belum review'});
return{list:list,qn:qn,tn:tn,heat:hv};
}
function gateHtml(list){
var h='';var bad=0,warn=0;
for(var i=0;i<list.length;i++){
var it=list[i];var ic=it.ok?'✅':(it.warn?'⚠️':'');
if(!it.ok&&!it.warn)bad++;if(it.warn)warn++;
h+='<div style="display:flex;justify-content:space-between;font-size:0.72rem;padding:2px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span>'+ic+' '+it.lab+'</span><span style="color:var(--text-muted);font-size:0.66rem;">'+it.note+'</span></div>';
}
var verdict,vcol;
if(bad>0){verdict='🔴 JANGAN EKSEKUSI - gerbang gagal.';vcol='red';}
else if(warn>0){verdict='🟡 Data belum lengkap - konfirmasi ulang.';vcol='yellow';}
else{verdict='🟢 Semua gerbang lulus - eksekusi sesuai ukuran.';vcol='green';}
h+='<div style="font-size:0.74rem;font-weight:800;color:var('+vcol+');margin-top:6px;">'+verdict+'</div>';
return h;
}
function scalingHtml(lot,entry,t1,t2){
var l1=Math.floor(lot*0.5);var l2=Math.floor(lot*0.25);var l3=lot-l1-l2;
var p1=l1*100*(t1-entry);var p2=l2*100*(t2-entry);
var h='<div style="font-size:0.72rem;font-weight:800;color:#fff;margin:6px 0 2px;">🪜 Jadwal Scaling</div>';
h+='<div style="font-size:0.7rem;color:var(--text-muted);line-height:1.7;">';
h+='T1: jual '+l1+' lot → +Rp '+fmt(p1)+'<br>';
h+='T2: jual '+l2+' lot → +Rp '+fmt(p2)+'<br>';
h+='Sisa '+l3+' lot: trail MA20 (biarkan runner bekerja)';
h+='</div>';
return h;
}
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
var riskSel=document.getElementById('ppRisk');
var riskPct=riskSel?parseFloat(riskSel.value):1;
var modeSel=document.getElementById('ppMode');
var mode=modeSel?modeSel.value:'B';
var modal=getModal();
var lv;
if(override){lv=override;}
else{
var eA=sup,sA=sup-1.2*atr;
var eB=ma20*1.01,sB=sup-0.3*atr;
lv={
a:{entry:eA,sl:sA,t1:eA+(eA-sA)*1.0,t2:eA+(eA-sA)*2.0},
b:{entry:eB,sl:sB,t1:eB+(eB-sB)*1.5,t2:eB+(eB-sB)*2.5}
};
}
var pri=mode==='A'?lv.a:lv.b;
var rr=pri.entry>pri.sl?(pri.t2-pri.entry)/(pri.entry-pri.sl):0;
var sz=sizeFor(pri.entry,pri.sl,riskPct,modal);
var szA=sizeFor(lv.a.entry,lv.a.sl,riskPct,modal);
var szB=sizeFor(lv.b.entry,lv.b.sl,riskPct,modal);
var gt=gates();
var wr=bandWR(gt.qn);
var expR=wr*rr-(1-wr);
var expRp=expR*sz.riskRp;
var baseHeat=gt.heat!=null?gt.heat:0;
var addPct=modal>0?sz.riskRp/modal*100:0;
var newHeat=baseHeat+addPct;
var key='planpro_state_'+code;
var st=lsJSON(key,null);
var bornKey='planpro_born_'+code;
var born=lsJSON(bornKey,0);
if(!born){born=Date.now();saveLS(bornKey,born);}
var days=(Date.now()-born)/86400000;
var zoneHi=mode==='A'?lv.a.entry*1.01:lv.b.entry*1.03;
var basi=(days>5||price>zoneHi*1.06);
var statusLab='MENUNGGU ZONA';var statusCol='yellow';
if(st&&st.status==='ACTIVE'){
if(price<=st.sl){st.status='DONE';st.result='STOP';notify('🛑 STOP',''+code+' kena SL '+fmt(st.sl));}
else if(!st.t1&&price>=st.t1){st.t1=true;st.sl=Math.max(st.sl,st.entry);notify('🎯 T1',''+code+' capai T1 - trim 50% & SL ke BE');}
else if(st.t1&&!st.t2&&price>=st.t2){st.t2=true;st.status='DONE';st.result='TARGET';notify('🏆 TARGET',''+code+' capai T2 - sisa trail');}
if(st.t1&&st.status==='ACTIVE')st.sl=Math.max(st.sl,ma20-0.5*atr);
saveLS(key,st);
}
if(st&&st.status==='ACTIVE'){statusLab='AKTIF '+(st.t1?'(T1 ✔ trail)':'');statusCol='green';}
if(st&&st.status==='DONE'){statusLab=st.result==='STOP'?'STOP LOSS':'TARGET TERCAPAI';statusCol=st.result==='STOP'?'red':'green';}
if(st&&st.alerts&&st.status==='WAIT'){
var zl=mode==='A'?lv.a.entry:lv.b.entry*0.99;
if(price>=zl&&price<=zoneHi){
var lastN=st.lastZone||0;
if(Date.now()-lastN>3600000){st.lastZone=Date.now();saveLS(key,st);notify('🔔 ZONA',''+code+' masuk zona entry '+fmt(zl)+'-'+fmt(zoneHi));}
}
}
var liveR='';
if(st&&st.status==='ACTIVE'&&st.entry>st.sl0){
var rNow=(price-st.entry)/(st.entry-st.sl0);
liveR=' • P&L live '+(rNow>=0?'+':'')+rNow.toFixed(2)+'R';
}
var reco='';
if(gt.qn!=null&&gt.tn!=null&&gt.qn>=60&&gt.tn>=60)reco='🟢 Disarankan: '+mode+' - kualitas & timing lulus.';
else if(gt.tn!=null&&gt.tn>=60)reco='🟡 Timing oke, kualitas sedang - ukuran kecil.';
else reco='🟠 Timing belum lulus - tunggu zona.';
var hist=lsJSON('planpro_hist',[]);
if(!hist.length||hist[0].code!==code||Date.now()-hist[0].t>3600000){
hist.unshift({t:Date.now(),code:code,mode:mode,a:lv.a,b:lv.b,lot:sz.lot});
if(hist.length>8)hist=hist.slice(0,8);
saveLS('planpro_hist',hist);
}
var shareQ=qCard?qCard.querySelector('#shareBtn'):null;
var shareS=sCard?sCard.querySelector('#shareBtn'):null;
var ctrl='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">';
ctrl+='<select id="ppRisk" class="fv-input" style="width:74px;margin-top:0;"><option value="0.5">0.5%</option><option value="1">1%</option><option value="2">2%</option></select>';
ctrl+='<select id="ppMode" class="fv-input" style="width:96px;margin-top:0;"><option value="A">Plan A</option><option value="B">Plan B</option></select>';
ctrl+='<select id="ppHist" class="fv-input" style="width:120px;margin-top:0;"></select>';
ctrl+='<button class="btn-mini" onclick="PLANPRO.loadHist()">↩</button>';
ctrl+='<button class="btn-mini" onclick="PLANPRO.refresh()">🔄</button>';
ctrl+='</div>';
var statusLine='<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px;"><span style="font-size:0.72rem;font-weight:800;color:var('+statusCol+');">● '+statusLab+liveR+'</span>'+(basi?'<span style="font-size:0.68rem;font-weight:800;color:var(--red);">⚠ PLAN BASI / harga kejar</span>':'')+'</div>';
var exec='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:6px 0;"><input id="ppEntryPx" type="number" class="fv-input" style="width:90px;margin-top:0;" placeholder="harga entry"><button class="btn-mini" onclick="PLANPRO.doEntry()">✅ Saya Entry</button><button class="btn-mini" onclick="PLANPRO.toggleAlert()">🔔 Alert</button><button class="btn-mini" onclick="PLANPRO.resetState()">⏹ Reset</button></div>';
var metrics='<div class="metric-grid" style="margin-bottom:6px;">';
metrics+='<div class="metric-box"><div class="metric-label">Entry</div><div class="metric-value" id="rEntry">'+fmt(pri.entry)+'</div></div>';
metrics+='<div class="metric-box"><div class="metric-label">Stop Loss</div><div class="metric-value red" id="rSl">'+fmt(pri.sl)+'</div></div>';
metrics+='<div class="metric-box"><div class="metric-label">Target 1</div><div class="metric-value green" id="rTp1">'+fmt(pri.t1)+'</div></div>';
metrics+='<div class="metric-box"><div class="metric-label">Target 2</div><div class="metric-value green" id="rTp2">'+fmt(pri.t2)+'</div></div>';
metrics+='</div>';
var info='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">R/R 1:<span id="rRr">'+rr.toFixed(2)+'</span> • risiko/share <span id="rPct">'+fmt(pri.entry-pri.sl)+'</span> • <strong style="color:#fff;">'+sz.lot+' lot</strong> (Rp '+fmt(sz.riskRp)+')</div>';
var edge='<div style="font-size:0.72rem;padding:6px 8px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin-bottom:6px;color:var(--text-muted);">🎲 Expectancy '+(expR>=0?'+':'')+expR.toFixed(2)+'R ('+(expRp>=0?'+':'')+'Rp '+fmt(expRp)+') • WR band '+(wr*100).toFixed(0)+'% • Heat setelah add: '+newHeat.toFixed(1)+'% '+(newHeat>6?'🔴':'🟢')+'</div>';
if(qCard){
var h='<div class="card-title"><span>🧾 Kartu Trading Plan</span><span class="agent-pill master">PLAN PRO v3</span></div>';
h+=ctrl+statusLine;
h+='<div style="font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:2px;">📌 Rencana A - Day-trade Pullback</div>';
h+=ladderSvg(lv.a.sl,lv.a.entry,lv.a.t1,lv.a.t2,price,'#38bdf8');
h+=metrics+info+edge+scalingHtml(szA.lot,lv.a.entry,lv.a.t1,lv.a.t2);
h+='<div style="font-size:0.72rem;color:var(--text-muted);margin:6px 0;">'+reco+'</div>';
h+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin-bottom:4px;">🚦 Gerbang Disiplin</div>'+gateHtml(gt.list);
h+=exec;
h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;"><button class="btn-copy" style="margin-top:0;" onclick="PLANPRO.ticket()">🎫 Ticket</button><button class="btn-copy" style="margin-top:0;" onclick="PLANPRO.toJournal()">📓 Jurnal</button><button class="btn-copy" style="margin-top:0;" onclick="PLANPRO.copy()">📋 Salin</button><button class="btn-copy" style="margin-top:0;" onclick="window.print()">🖨 Cetak</button></div>';
qCard.innerHTML=h;
var rs=qCard.querySelector('#ppRisk');if(rs){rs.value=String(riskPct);rs.onchange=function(){PLANPRO.refresh();};}
var ms=qCard.querySelector('#ppMode');if(ms){ms.value=mode;ms.onchange=function(){PLANPRO.refresh();};}
var hs=qCard.querySelector('#ppHist');
if(hs){var op='';for(var i2=0;i2<hist.length;i2++){op+='<option value="'+i2+'">'+hist[i2].code+' '+new Date(hist[i2].t).toLocaleDateString('id-ID')+'</option>';}hs.innerHTML=op;}
var ep=qCard.querySelector('#ppEntryPx');if(ep&&st&&st.entry)ep.value=st.entry;
if(shareQ)qCard.appendChild(shareQ);
}
if(sCard){
var hs2='<div class="card-title"><span>🧾 Kartu Swing Plan</span><span class="agent-pill master">PLAN PRO v3</span></div>';
hs2+=statusLine;
hs2+='<div id="swPlan" style="font-size:0.78rem;color:var(--text-muted);line-height:1.7;">';
hs2+='Rencana B - Swing 7-25 hari (pullback MA20).'+NL;
hs2+='Zona entry: '+fmt(lv.b.entry*0.99)+' - '+fmt(lv.b.entry*1.03)+'.'+NL;
hs2+='Stop Loss: '+fmt(lv.b.sl)+' (swing low - 0.3 ATR).'+NL;
hs2+='T1: '+fmt(lv.b.t1)+' (1.5R, trim 50%). T2: '+fmt(lv.b.t2)+' (2.5R).'+NL;
hs2+='R/R 1:'+((lv.b.entry>lv.b.sl)?((lv.b.t2-lv.b.entry)/(lv.b.entry-lv.b.sl)).toFixed(2):'-')+' • ukuran '+szB.lot+' lot (Rp '+fmt(szB.riskRp)+').'+NL;
hs2+='Setelah T1: SL ke break-even lalu trail MA20.'+NL;
hs2+='Batal bila close di bawah '+fmt(lv.b.sl)+' atau regime bearish.';
hs2+='</div>';
hs2+=ladderSvg(lv.b.sl,lv.b.entry,lv.b.t1,lv.b.t2,price,'#22c55e');
hs2+=scalingHtml(szB.lot,lv.b.entry,lv.b.t1,lv.b.t2);
hs2+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin:8px 0 4px;">🚦 Gerbang Disiplin</div>'+gateHtml(gt.list);
sCard.innerHTML=hs2;
if(shareS)sCard.appendChild(shareS);
}
lastWrite=Date.now();
window.__planproCache={code:code,mode:mode,pri:pri,lot:sz.lot,a:lv.a,b:lv.b};
}catch(e){}
busy=false;
}
window.PLANPRO={
refresh:function(){override=null;busy=false;enhance();},
loadHist:function(){
var sel=document.getElementById('ppHist');
var hist=lsJSON('planpro_hist',[]);
var i=sel?parseInt(sel.value,10):0;
if(hist[i]){override={a:hist[i].a,b:hist[i].b};busy=false;enhance();toast('↩ Plan riwayat dimuat.');}
},
doEntry:function(){
var c=window.__planproCache;if(!c){toast('Proses saham dulu.');return;}
var inp=document.getElementById('ppEntryPx');
var px=inp?parseFloat(inp.value):0;
if(!px||px<=0)px=c.pri.entry;
var key='planpro_state_'+c.code;
var old=lsJSON(key,null);
var st={status:'ACTIVE',entry:px,sl0:c.pri.sl,sl:c.pri.sl,t1:c.pri.t1,t2:c.pri.t2,lot:c.lot,mode:c.mode,date:Date.now(),t1:false,t2:false,alerts:old?old.alerts:false};
saveLS(key,st);
notify('✅ ENTRY',''+c.code+' '+c.lot+' lot @ '+fmt(px));
busy=false;enhance();
},
resetState:function(){
var c=window.__planproCache;if(!c)return;
localStorage.removeItem('planpro_state_'+c.code);
localStorage.removeItem('planpro_born_'+c.code);
busy=false;enhance();toast('⏹ Status plan direset.');
},
toggleAlert:function(){
var c=window.__planproCache;if(!c){toast('Proses saham dulu.');return;}
var key='planpro_state_'+c.code;
var st=lsJSON(key,null)||{status:'WAIT',alerts:false};
st.alerts=!st.alerts;
saveLS(key,st);
toast(st.alerts?'🔔 Alert plan AKTIF (zona/SL/T1 via ntfy).':'🔕 Alert plan dimatikan.');
busy=false;enhance();
},
toJournal:function(){
var c=window.__planproCache;if(!c){toast('Proses saham dulu.');return;}
var J=window.journal;
var arr=Array.isArray(J)?J:lsJSON('ihsg_journal',[]);
arr.push({t:c.code,d:Date.now(),p:c.pri.entry,setup:'planpro-'+c.mode,outcome:null});
if(Array.isArray(J))window.journal=arr;
saveLS('ihsg_journal',arr);
toast('📓 Tercatat ke jurnal: '+c.code+' ('+c.mode+').');
},
ticket:function(){
var c=window.__planproCache;if(!c){toast('Proses saham dulu.');return;}
var t='BUY '+c.code+' '+c.lot+' lot @ '+fmt(c.pri.entry)+' | SL '+fmt(c.pri.sl)+' | T1 '+fmt(c.pri.t1)+' | T2 '+fmt(c.pri.t2);
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('🎫 Ticket broker disalin.');}).catch(function(){window.prompt('Ticket:',t);});}
else window.prompt('Ticket:',t);
},
copy:function(){
var c=window.__planproCache;if(!c){toast('Proses saham dulu.');return;}
var t='PLAN '+c.code+' ('+c.mode+')'+NL+'Entry '+fmt(c.pri.entry)+' SL '+fmt(c.pri.sl)+' T1 '+fmt(c.pri.t1)+' T2 '+fmt(c.pri.t2)+' ('+c.lot+' lot)';
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('📋 Plan disalin.');}).catch(function(){window.prompt('Salin plan:',t);});}
else window.prompt('Salin plan:',t);
}
};
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
if(!window.__planproTick){
window.__planproTick=setInterval(function(){
var c=window.lastTicker;
if(!c)return;
var st=lsJSON('planpro_state_'+c,null);
if(st&&(st.status==='ACTIVE'||st.alerts))enhance();
},60000);
}
})();
/* END planpro v3 */
