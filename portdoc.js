/* portdoc.js v5 - Doctor kritis + stress test IHSG + resep lot konkret (menggantikan poheat.js) */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var NL=String.fromCharCode(10);
var lastSrc='';
function looksPos(o){if(!o||typeof o!=='object')return false;var c=!!(o.t||o.code||o.ticker||o.symbol||o.kode);var l=!!(o.lot||o.qty||o.shares||o.jumlah);var p=!!(o.avg||o.entry||o.price||o.buy||o.harga||o.avgPrice);return c&&l&&p;}
function cleanCode(s){var o='';var u=String(s).toUpperCase();for(var i=0;i<u.length;i++){var ch=u.charAt(i);if((ch>='A'&&ch<='Z')||(ch>='0'&&ch<='9'))o+=ch;}return o.slice(0,6);}
function parseDomPorto(){
var cards=document.querySelectorAll('#tab-porto .card');var target=null;
for(var i=0;i<cards.length;i++){var t=(cards[i].innerText||'').toUpperCase();if(t.indexOf('PORTFOLIO SAYA')>=0){target=cards[i];break;}}
if(!target)return [];
var lines=(target.innerText||'').split(NL);var out=[];var prev='';
for(var l=0;l<lines.length;l++){
var line=lines[l].trim();var idx=line.indexOf(' lot @');
if(idx>=0){
var head=line.slice(0,idx);var tail=line.slice(idx+6);
var parts=head.split(' ');var toks=[];
for(var p=0;p<parts.length;p++){if(parts[p])toks.push(parts[p]);}
var lot=0,code='';
if(toks.length>=2){lot=parseFloat(toks[toks.length-1]);code=cleanCode(toks.slice(0,toks.length-1).join(' '));}
else if(toks.length===1){lot=parseFloat(toks[0]);code=cleanCode(prev);}
var avg=parseFloat(tail);
if(code&&lot>0&&avg>0)out.push({t:code,lot:lot,avg:avg});
}
prev=line;
}
return out;
}
function getPorto(){
lastSrc='';
var gn=['portfolio','portofolio','myPortfolio','PORTFOLIO','porto','positions','myPorto'];
for(var i=0;i<gn.length;i++){var v=window[gn[i]];if(Array.isArray(v)&&v.length&&looksPos(v[0])){lastSrc='global:'+gn[i];return v;}}
var ks=['ihsg_porto','ihsg_portfolio','portfolio','ihsg_portofolio','portofolio','ihsg_myporto'];
for(var k=0;k<ks.length;k++){var a=lsJSON(ks[k],null);if(Array.isArray(a)&&a.length&&looksPos(a[0])){lastSrc=ks[k];return a;}}
try{
for(var s=0;s<localStorage.length;s++){
var key=localStorage.key(s);if(!key)continue;
var raw=localStorage.getItem(key);if(!raw)continue;
if(raw.charAt(0)==='['){var arr=null;try{arr=JSON.parse(raw);}catch(e){continue;}if(Array.isArray(arr)&&arr.length&&looksPos(arr[0])){lastSrc='scan:'+key;return arr;}continue;}
if(raw.charAt(0)==='{'){
var ob=null;try{ob=JSON.parse(raw);}catch(e2){continue;}
if(!ob||typeof ob!=='object')continue;
var props=['positions','position','list','items','data','porto','portfolio','saham'];var found=null;
for(var pp=0;pp<props.length;pp++){if(Array.isArray(ob[props[pp]])&&ob[props[pp]].length&&looksPos(ob[props[pp]][0])){found=ob[props[pp]];break;}}
if(!found){var ks2=Object.keys(ob);var mapArr=[];
for(var kk=0;kk<ks2.length;kk++){var vv=ob[ks2[kk]];
if(vv&&typeof vv==='object'){var ll=parseFloat(vv.lot||vv.qty||vv.shares||vv.jumlah)||0;var pr=parseFloat(vv.avg||vv.entry||vv.price||vv.buy||vv.harga||vv.avgPrice)||0;if(ll>0&&pr>0)mapArr.push({t:ks2[kk],lot:ll,avg:pr});}}
if(mapArr.length)found=mapArr;}
if(found){lastSrc='scan-obj:'+key;return found;}
}
}
}catch(e3){}
var dom=parseDomPorto();if(dom.length){lastSrc='dom:Portfolio Saya';return dom;}
return [];
}
function codeOf(e){return e.t||e.code||e.ticker||e.symbol||e.kode||'';}
function lotOf(e){return parseFloat(e.lot||e.qty||e.shares||e.jumlah)||0;}
function avgOf(e){return parseFloat(e.avg||e.entry||e.price||e.buy||e.harga||e.avgPrice)||0;}
function rets60(c){var r=[];var s=Math.max(1,c.length-60);for(var i=s;i<c.length;i++){if(c[i-1])r.push((c[i]-c[i-1])/c[i-1]);}return r;}
function corr(a,b){var n=Math.min(a.length,b.length);if(n<10)return 0;var ma=0,mb=0;for(var i=0;i<n;i++){ma+=a[i];mb+=b[i];}ma/=n;mb/=n;var num=0,da=0,db=0;for(var j=0;j<n;j++){var x=a[j]-ma,y=b[j]-mb;num+=x*y;da+=x*x;db+=y*y;}if(da===0||db===0)return 0;return num/Math.sqrt(da*db);}
function betaOf(a,b){var n=Math.min(a.length,b.length);if(n<10)return 1;var ma=0,mb=0;for(var i=0;i<n;i++){ma+=a[i];mb+=b[i];}ma/=n;mb/=n;var num=0,den=0;for(var j=0;j<n;j++){num+=(a[j]-ma)*(b[j]-mb);den+=(b[j]-mb)*(b[j]-mb);}if(den===0)return 1;return num/den;}
function volAligned(candle){var q=candle.indicators.quote[0];var v=[];for(var i=0;i<q.close.length;i++){if(q.close[i]==null||q.open[i]==null)continue;v.push(q.volume?q.volume[i]:0);}return v;}
function f2(x){return x!=null&&isFinite(x)?x.toFixed(2):'-';}
function pc(x){return x!=null&&isFinite(x)?(x*100).toFixed(1)+'%':'-';}
function macdDir(c){var e12=SW.ema(c,12),e26=SW.ema(c,26);var m=[];for(var i=0;i<c.length;i++)m.push((e12[i]||0)-(e26[i]||0));var sig=SW.ema(m,9);var n=c.length;var h1=m[n-1]-(sig[n-1]||0),h2=m[n-4]-(sig[n-4]||0);return h1>h2?'MEMBAIK':'MEMBURUK';}
function divFlag(A){var l=A.l,h=A.h,c=A.c;var n=c.length;var rsi=SW.rsi(c,14);var L=[],H=[];
for(var i=2;i<n-2;i++){if(i<n-60)continue;
if(l[i]<=l[i-1]&&l[i]<=l[i-2]&&l[i]<=l[i+1]&&l[i]<=l[i+2])L.push(i);
if(h[i]>=h[i-1]&&h[i]>=h[i-2]&&h[i]>=h[i+1]&&h[i]>=h[i+2])H.push(i);}
if(L.length>=2){var a=L[L.length-2],b=L[L.length-1];if(l[b]<l[a]&&rsi[b]>rsi[a]+1)return 'BULLISH';}
if(H.length>=2){var a2=H[H.length-2],b2=H[H.length-1];if(h[b2]>h[a2]&&rsi[b2]<rsi[a2]-1)return 'BEARISH';}
return 'TIDAK ADA';}
function mfiCmf(A,vol){var c=A.c,h=A.h,l=A.l;var n=c.length;var tp=[];for(var i=0;i<n;i++)tp.push((h[i]+l[i]+c[i])/3);var pos=0,neg=0;
for(var i2=Math.max(1,n-14);i2<n;i2++){var mv=tp[i2]*(vol[i2]||0);if(tp[i2]>tp[i2-1])pos+=mv;else if(tp[i2]<tp[i2-1])neg+=mv;}
var mfi=neg===0?100:100-100/(1+pos/neg);
var mfv=0,vs=0;
for(var i3=n-20;i3<n;i3++){var mf2=(h[i3]===l[i3])?0:(((c[i3]-l[i3])-(h[i3]-c[i3]))/(h[i3]-l[i3]));mfv+=mf2*(vol[i3]||0);vs+=(vol[i3]||0);}
return {mfi:mfi,cmf:vs?mfv/vs:0};}
function bandarLite(A,vol){var n=A.c.length;var avg=0;for(var i=n-21;i<n-1;i++)avg+=vol[i];avg/=20;var lv=vol[n-1];var vr=avg>0?lv/avg:0;var chg=(A.c[n-1]-A.c[n-2])/A.c[n-2]*100;var ma20=SW.sma(A.c,20)[n-1];var above=ma20?A.c[n-1]>ma20:false;
if(vr>=1.5&&chg>0&&above)return 'AKUMULASI KUAT';if(vr>=1.3&&chg>0)return 'AKUMULASI';if(vr>=1.5&&chg<0)return 'DISTRIBUSI';if(vr<0.7&&Math.abs(chg)<1)return 'KONSOLIDASI';return 'NETRAL';}
async function fundOf(code){
try{
if(!GAS_PROXY)return null;
var u='https://query1.finance.yahoo.com/v10/finance/quoteSummary/'+code+'.JK?modules=summaryDetail,defaultKeyStatistics,financialData';
var r=await fetch(GAS_PROXY+'?url='+encodeURIComponent(u));
if(!r.ok)return null;
var wrap=JSON.parse(await r.text());
var j=JSON.parse(wrap.body||'null');
var res=j&&j.quoteSummary&&j.quoteSummary.result&&j.quoteSummary.result[0];
if(!res)return null;
var sd=res.summaryDetail||{},ks=res.defaultKeyStatistics||{},fd=res.financialData||{};
function num(o){return o&&o.raw!=null?o.raw:null;}
return {pe:num(sd.trailingPE),pb:num(ks.priceToBook)||num(sd.priceToBook),revG:num(fd.revenueGrowth),margin:num(fd.profitMargins),roe:num(fd.returnOnEquity),de:num(ks.debtToEquity)||num(fd.debtToEquity),target:num(fd.targetMeanPrice),rec:fd.recommendationKey||null};
}catch(e){return null;}
}
function regimeIHSG(IA){var n=IA.c.length;var ma20=SW.sma(IA.c,20),ma50=SW.sma(IA.c,50),rsi=SW.rsi(IA.c,14);var p=IA.c[n-1],m20=ma20[n-1],m50=ma50[n-1],r=rsi[n-1];
if(p>m20&&m20>m50&&r>=50&&r<=70)return 'BULLISH';if(p>m50&&r>=40&&r<=60)return 'NETRAL-BULLISH';if(p<m20&&p>m50)return 'CAMPURAN';return 'BEARISH';}
var tab=document.getElementById('tab-porto');
var anchor=tab?tab.querySelector('.card'):null;
P.card('tab-porto','<div class="card-title"><span>🌡️ Portfolio Heat</span><span class="agent-pill tech">Risiko Agregat</span></div><button class="btn-copy" style="margin-top:0;" id="phBtn" onclick="runHeat()">🌡️ Hitung Portfolio Heat</button><div id="phOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Total risiko bila semua Stop Loss (2xATR) tersentuh bersamaan + deteksi posisi berkorelasi tinggi.</div>',anchor);
P.card('tab-porto','<div class="card-title"><span>🩺 Portfolio Doctor</span><span class="agent-pill master">AI Risk Manager Kritis</span></div><button class="btn-copy" style="margin-top:0;" id="pdBtn" onclick="runPortDoc()">🩺 Minta Review AI</button><div id="pdOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Tesis teknikal+fundamental per posisi + stress test IHSG + resep lot konkret, lalu verdict HOLD/ADD/TRIM/EXIT dari AI.</div>',document.getElementById('phOut').closest('.card'));
window.runHeat=async function(){
var out=document.getElementById('phOut');
var porto=getPorto();
if(!porto.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Portfolio kosong (sumber: '+(lastSrc||'tidak ketemu')+'). Scroll agar kartu Portfolio Saya terlihat, coba lagi.</div>';return;}
out.innerHTML='<div class="skel-box" style="height:60px"></div>';
var list=[];for(var i0=0;i0<porto.length;i0++){var e0=porto[i0];var c0=cleanCode(codeOf(e0));var l0=lotOf(e0);var a0=avgOf(e0);if(c0&&l0>0&&a0>0)list.push({t:c0,lot:l0,avg:a0});}
var modal=0;for(var i=0;i<list.length;i++)modal+=list[i].lot*100*list[i].avg;
if(!list.length||modal<=0){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data posisi tidak lengkap.</div>';return;}
var settled=await Promise.allSettled(list.map(function(p){return SW.candle(p.t,'1y');}));
var rows=[];
settled.forEach(function(res,i){
if(res.status!=='fulfilled')return;
var p=list[i];var A=SW.arrays(res.value);var n=A.c.length;if(n<30)return;
var atr=SW.atr(A.h,A.l,A.c,14)[n-1]||A.c[n-1]*0.03;
var price=(typeof cachePrice==='function'&&cachePrice(p.t))||A.c[n-1];
var sl=p.avg-2*atr;if(sl<0)sl=0;
var riskRp=p.lot*100*Math.max(0,p.avg-sl);var cap=p.lot*100*p.avg*0.5;if(riskRp>cap)riskRp=cap;
rows.push({t:p.t,lot:p.lot,sl:sl,riskPct:riskRp/modal*100,rets:rets60(A.c)});
});
var heat=0;for(var k=0;k<rows.length;k++)heat+=rows[k].riskPct;
var pairs=[];
for(var a=0;a<rows.length;a++){for(var b=a+1;b<rows.length;b++){var c=corr(rows[a].rets,rows[b].rets);if(c>0.7)pairs.push(rows[a].t+' x '+rows[b].t+' ('+c.toFixed(2)+')');}}
var col=heat<3?'green':(heat<=6?'yellow':'red');
var verdict=heat<3?'AMAN - ruang tambah posisi terbuka':(heat<=6?'SEDANG - hati-hati menambah posisi':'PANAS - kurangi ukuran atau tambah hedge');
var h='<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;"><div style="font-family:var(--mono);font-size:2rem;font-weight:900;color:var(--'+col+');">'+heat.toFixed(1)+'%</div><div><div style="font-weight:800;color:var(--'+col+');">'+verdict+'</div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">Sumber: '+(lastSrc||'-')+'</div></div></div>';
for(var r2=0;r2<rows.length;r2++){var rw=rows[r2];h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span>'+rw.t+' <span style="color:var(--text-muted);font-size:0.66rem;">'+rw.lot+' lot - SL asum '+Math.round(rw.sl).toLocaleString('id-ID')+'</span></span><span style="font-family:var(--mono);font-weight:700;">'+rw.riskPct.toFixed(1)+'%</span></div>';}
if(pairs.length)h+='<div style="font-size:0.72rem;color:var(--yellow);margin-top:8px;">⚠️ Korelasi tinggi: '+pairs.join(', ')+'</div>';
out.innerHTML=h;
};
function chipHtml(last){var p=getPorto();var h='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:0.7rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:10px;"><span style="font-weight:800;color:#fff;">🩺 Portfolio:</span><span>'+p.length+' posisi</span>';
if(last){h+='<span class="'+(last.pnl>=0?'green':'red')+'" style="font-weight:700;">P&L '+(last.pnl>=0?'+':'')+last.pnl.toFixed(1)+'%</span><span>Heat '+last.heat.toFixed(1)+'%</span>';if(last.flags)h+='<span class="yellow">⚠ '+last.flags+' peringatan</span>';}
else h+='<span style="color:var(--text-muted);">belum direview</span>';
h+='<button class="btn-mini" onclick="goPortDoc()">Review</button></div>';return h;}
function mountChips(){var last=lsJSON('ihsg_portdoc_last',null);var html=chipHtml(last);var tabs=['tab-analysis','tab-market'];
for(var i=0;i<tabs.length;i++){var t=document.getElementById(tabs[i]);if(!t)continue;var old=document.getElementById('portChip_'+i);if(old)old.remove();var div=document.createElement('div');div.id='portChip_'+i;div.innerHTML=html;t.insertBefore(div,t.firstChild);}}
window.goPortDoc=function(){switchTab('porto');setTimeout(function(){window.runPortDoc();},300);};
window.runPortDoc=async function(){
var out=document.getElementById('pdOut');
var porto=getPorto();
if(!porto.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Portfolio kosong (sumber: '+(lastSrc||'tidak ketemu')+'). Scroll kartu Portfolio Saya ke layar, coba lagi.</div>';return;}
out.innerHTML='<div class="skel-box" style="height:80px"></div>';
var btn=document.getElementById('pdBtn');if(btn){btn.disabled=true;btn.innerText='Membedah tesis + simulasi...';}
try{
var ij=await fetchChart('^JKSE','1y');var IA=SW.arrays(ij.chart.result[0]);var reg=regimeIHSG(IA);
var iRets=rets60(IA.c);
var list=[];for(var i0=0;i0<porto.length;i0++){var e0=porto[i0];var c0=cleanCode(codeOf(e0));var l0=lotOf(e0);var a0=avgOf(e0);if(c0&&l0>0&&a0>0)list.push({t:c0,lot:l0,avg:a0});}
var totalValue=0,totalCost=0;var rows=[];
var settled=await Promise.allSettled(list.map(function(p){return SW.candle(p.t,'1y');}));
var wks=await Promise.allSettled(list.map(function(p){return fetchChart(p.t+'.JK','1y','1wk').then(function(j){return j.chart.result[0];}).catch(function(){return null;});}));
var funds=await Promise.allSettled(list.map(function(p){return fundOf(p.t);}));
settled.forEach(function(res,i){
var p=list[i];var price=null,A=null,n=0,candle=null;
if(res.status==='fulfilled'){candle=res.value;A=SW.arrays(candle);n=A.c.length;price=(typeof cachePrice==='function'&&cachePrice(p.t))||A.c[n-1];}
else{price=(typeof cachePrice==='function'&&cachePrice(p.t))||p.avg;}
if(!price)return;
var value=p.lot*100*price,cost=p.lot*100*p.avg;totalValue+=value;totalCost+=cost;
var pnl=(price-p.avg)/p.avg*100;
var T={trend:'?',slope:0,mtf:null,rsi:null,macd:'-',sup:null,res:null,distSup:0,distRes:0,vr:0,bandar:'-',mfi:null,cmf:null,atrpct:0,div:'-',m20:null,m50:null,m200:null};
var vol=[];
if(A&&n>60){
vol=volAligned(candle);
var ma20=SW.sma(A.c,20),ma50=SW.sma(A.c,50),ma200=SW.sma(A.c,200);
T.m20=ma20[n-1];T.m50=ma50[n-1];T.m200=ma200[n-1];
T.slope=(ma20[n-6]!=null&&ma20[n-6]!==0)?(ma20[n-1]-ma20[n-6])/ma20[n-6]*100:0;
T.trend=(price>T.m20&&T.m20>T.m50)?'NAIK':(price>T.m50?'DATAR':'TURUN');
T.rsi=SW.rsi(A.c,14)[n-1];
T.macd=macdDir(A.c);
T.sup=SW.lowest(A.l,n-60,n);T.res=SW.highest(A.h,n-60,n);
T.distSup=(price-T.sup)/price*100;T.distRes=(T.res-price)/price*100;
var avg20=0;for(var v1=n-21;v1<n-1;v1++)avg20+=vol[v1];avg20/=20;T.vr=avg20>0?vol[n-1]/avg20:0;
T.bandar=bandarLite(A,vol);
var mc=mfiCmf(A,vol);T.mfi=mc.mfi;T.cmf=mc.cmf;
var atr=SW.atr(A.h,A.l,A.c,14)[n-1];T.atrpct=atr?atr/price*100:0;
T.div=divFlag(A);
var wC=wks[i].status==='fulfilled'?wks[i].value:null;
if(wC)T.mtf=SW.tfScore(candle,wC);
}
var F=funds[i].status==='fulfilled'?funds[i].value:null;
var sl2=p.avg-2*(T.atrpct/100*price||p.avg*0.06);
var distSL=sl2>0?(price-sl2)/price*100:0;
var beta=1;
if(A&&n>60)beta=betaOf(rets60(A.c),iRets);
rows.push({code:p.t,lot:p.lot,avg:p.avg,price:price,value:value,pnl:pnl,weight:0,T:T,F:F,distSL:distSL,beta:beta,rets:A?rets60(A.c):[]});
});
if(!rows.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data posisi tidak lengkap.</div>';return;}
for(var w=0;w<rows.length;w++)rows[w].weight=totalValue>0?rows[w].value/totalValue*100:0;
var pnlTotal=totalCost>0?(totalValue-totalCost)/totalCost*100:0;
var heat=0;
for(var h2=0;h2<rows.length;h2++){var r2=rows[h2];var slA=r2.avg-2*(r2.T.atrpct/100*r2.price||r2.avg*0.06);var riskRp=r2.lot*100*Math.max(0,r2.avg-slA);var cap=r2.lot*100*r2.avg*0.5;if(riskRp>cap)riskRp=cap;r2.riskPct=totalCost>0?riskRp/totalCost*100:0;heat+=r2.riskPct;}
var maxW=0,maxCode='';for(var mI=0;mI<rows.length;mI++){if(rows[mI].weight>maxW){maxW=rows[mI].weight;maxCode=rows[mI].code;}}
var pairs=[];
for(var a=0;a<rows.length;a++){for(var b=a+1;b<rows.length;b++){var cc=corr(rows[a].rets,rows[b].rets);if(cc>0.7)pairs.push(rows[a].code+'x'+rows[b].code);}}
var flags=0;for(var fI=0;fI<rows.length;fI++){if(rows[fI].distSL<2||rows[fI].weight>40||rows[fI].T.trend==='TURUN')flags++;}
var stress=[];
var scen=[-5,0,5];
for(var sI=0;sI<3;sI++){
var tot=0;
for(var sJ=0;sJ<rows.length;sJ++)tot+=rows[sJ].weight/100*rows[sJ].beta*scen[sI];
stress.push(tot);
}
var recipe=[];
if(heat>6){
var target=4;var excess=heat-target;
var order=rows.slice().sort(function(x,y){
var px=(x.T.trend==='TURUN'?0:1);
var py=(y.T.trend==='TURUN'?0:1);
if(px!==py)return px-py;
return y.riskPct-x.riskPct;
});
for(var oI=0;oI<order.length&&excess>0.3&&recipe.length<2;oI++){
var rp=order[oI];
if(rp.riskPct<=0.5)continue;
var riskPerLot=rp.riskPct/rp.lot;
var share=excess*(rp.riskPct/heat);
var lots=Math.ceil(share/riskPerLot);
if(lots<1)lots=1;
if(lots>rp.lot)lots=rp.lot;
recipe.push({code:rp.code,from:rp.lot,to:rp.lot-lots,sell:lots,newHeat:0});
excess-=lots*riskPerLot;
}
var newHeat=heat;
for(var rI=0;rI<recipe.length;rI++){
var rc=recipe[rI];
var orig=null;
for(var oJ=0;oJ<rows.length;oJ++){if(rows[oJ].code===rc.code)orig=rows[oJ];}
if(orig)newHeat-=rc.sell*(orig.riskPct/orig.lot);
rc.newHeat=newHeat;
}
}
var L=[];
L.push('REGIME PASAR (IHSG): '+reg);
L.push('PORTOFOLIO: nilai '+Math.round(totalValue).toLocaleString('id-ID')+', P&L '+(pnlTotal>=0?'+':'')+pnlTotal.toFixed(1)+'%, heat '+heat.toFixed(1)+'%, terberat '+maxCode+' '+maxW.toFixed(0)+'%'+(pairs.length?', korelasi tinggi: '+pairs.join(', '):'')+'.');
L.push('STRESS TEST (beta per posisi): IHSG -5% → port '+(stress[0]>=0?'+':'')+stress[0].toFixed(1)+'% | IHSG 0% → 0% | IHSG +5% → '+(stress[2]>=0?'+':'')+stress[2].toFixed(1)+'%.');
if(recipe.length){
var rl2='RESEP OTOMATIS (validasi/adjust): ';
for(var rJ=0;rJ<recipe.length;rJ++)rl2+=recipe[rJ].code+' jual '+recipe[rJ].sell+' lot (sisa '+recipe[rJ].to+') → heat '+recipe[rJ].newHeat.toFixed(1)+'%; ';
L.push(rl2);
}else{
L.push('RESEP OTOMATIS: tidak perlu trim (heat masih <=6%).');
}
for(var pI=0;pI<rows.length;pI++){
var rw=rows[pI];var T=rw.T;var F=rw.F;
L.push('--- '+rw.code+' | P&L '+(rw.pnl>=0?'+':'')+rw.pnl.toFixed(1)+'% | berat '+rw.weight.toFixed(0)+'% | beta '+rw.beta.toFixed(2)+' | entry '+Math.round(rw.avg)+' vs harga '+Math.round(rw.price)+' ---');
L.push('TEKNIKAL: tren '+T.trend+' (MA20 '+(T.m20?Math.round(T.m20):'-')+', MA50 '+(T.m50?Math.round(T.m50):'-')+', MA200 '+(T.m200?Math.round(T.m200):'-')+', slope MA20 '+T.slope.toFixed(2)+'%), MTF '+(T.mtf!=null?T.mtf:'-')+'/100, RSI '+(T.rsi!=null?T.rsi.toFixed(0):'-')+', MACD '+T.macd+', support '+Math.round(T.sup||0)+' (-'+T.distSup.toFixed(1)+'%), resist '+Math.round(T.res||0)+' (+'+T.distRes.toFixed(1)+'%), vol '+T.vr.toFixed(1)+'x ('+T.bandar+'), MFI '+(T.mfi!=null?T.mfi.toFixed(0):'-')+' CMF '+(T.cmf!=null?T.cmf.toFixed(2):'-')+', ATR '+T.atrpct.toFixed(1)+'%, divergensi '+T.div);
L.push('FUNDAMENTAL: '+(F?('PER '+f2(F.pe)+', PBV '+f2(F.pb)+', growth pendapatan '+pc(F.revG)+', margin '+pc(F.margin)+', ROE '+pc(F.roe)+', D/E '+f2(F.de)+(F.target?', target analis '+Math.round(F.target)+' (upside '+(((F.target-rw.price)/rw.price)*100).toFixed(1)+'%)':'')+(F.rec?', rekomendasi '+F.rec:'')):'tidak tersedia'));
L.push('POSISI: jarak ke SL asumsi '+rw.distSL.toFixed(1)+'%'+(rw.distSL<2?' [DEKAT SL]':'')+(rw.weight>40?' [OVERWEIGHT]':''));
}
var prompt='Anda manajer risiko KRITIS untuk portofolio saham Indonesia. Data:'+NL+L.join(NL)+NL+NL+'ATURAN: nilai VALIDITAS TESIS tiap posisi (teknikal+fundamental), bukan sekadar P&L/heat. Jangan anchor harga beli. Validasi atau koreksi RESEP OTOMATIS di atas (boleh beda bila tesis posisi masih kuat). Untuk tiap posisi tulis 3 baris:'+NL+'TESIS: (1 kalimat + angka kunci)'+NL+'FALSIFIKASI: (level harga spesifik pembatal tesis)'+NL+'VERDICT: KODE = HOLD/ADD/TRIM/EXIT (keyakinan x/5) + aksi konkret'+NL+'Lalu PORTOFOLIO: 2-3 keputusan (konsentrasi, korelasi, stress test, regime). Maks 260 kata, Indonesia.';
var narrative='';
try{narrative=await window.callLLM(prompt);}catch(e){narrative='(AI gagal: '+e.message+') Data mentah:'+NL+L.join(NL);}
var h='<div class="metric-grid" style="margin-bottom:8px;">';
h+='<div class="metric-box"><div class="metric-label">Nilai Pasar</div><div class="metric-value">'+(totalValue/1e6).toFixed(2)+' jt</div></div>';
h+='<div class="metric-box"><div class="metric-label">P&L Total</div><div class="metric-value '+(pnlTotal>=0?'green':'red')+'">'+(pnlTotal>=0?'+':'')+pnlTotal.toFixed(1)+'%</div></div>';
h+='<div class="metric-box"><div class="metric-label">Heat</div><div class="metric-value '+(heat<3?'green':heat<=6?'yellow':'red')+'">'+heat.toFixed(1)+'%</div></div>';
h+='<div class="metric-box"><div class="metric-label">Terberat</div><div class="metric-value '+(maxW>40?'red':'green')+'">'+maxCode+' '+maxW.toFixed(0)+'%</div></div></div>';
h+='<div style="font-size:0.72rem;padding:6px 8px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin-bottom:8px;color:var(--text-muted);">️ Stress test: IHSG -5% → <strong class="'+(stress[0]<-4?'red':'yellow')+'">'+(stress[0]>=0?'+':'')+stress[0].toFixed(1)+'%</strong> | IHSG +5% → <strong class="green">+'+stress[2].toFixed(1)+'%</strong> (berbasis beta tiap posisi)</div>';
if(recipe.length){
var rh='🧾 <strong>Resep lot:</strong> ';
for(var rK=0;rK<recipe.length;rK++)rh+=recipe[rK].code+' '+recipe[rK].from+'→'+recipe[rK].to+' lot (jual '+recipe[rK].sell+') ';
rh+='→ heat jadi '+recipe[recipe.length-1].newHeat.toFixed(1)+'%.';
h+='<div style="font-size:0.74rem;padding:8px 10px;border:1px solid rgba(34,197,94,.35);border-radius:10px;background:rgba(34,197,94,.08);margin-bottom:8px;color:var(--green);">'+rh+'</div>';
}
for(var dI=0;dI<rows.length;dI++){
var rd=rows[dI];
var warn='';if(rd.distSL<2)warn+='⚠ dekat SL ';if(rd.weight>40)warn+='⚠ overweight ';if(rd.T.trend==='TURUN')warn+='⚠ tren turun ';
var fundLine=rd.F?('PER '+f2(rd.F.pe)+' PBV '+f2(rd.F.pb)+(rd.F.target?' target '+(((rd.F.target-rd.price)/rd.price)*100).toFixed(0)+'%':'')):'fund -';
h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span><strong>'+rd.code+'</strong> <span style="color:var(--text-muted);font-size:0.64rem;">'+rd.lot+' lot - '+rd.T.trend+' - '+fundLine+(warn?' - '+warn:'')+'</span></span><span style="font-family:var(--mono);font-weight:700;" class="'+(rd.pnl>=0?'green':'red')+'">'+(rd.pnl>=0?'+':'')+rd.pnl.toFixed(1)+'%</span></div>';
}
h+='<div class="report-card" style="margin-top:10px;white-space:pre-wrap;">'+esc(narrative)+'</div>';
h+='<div style="font-size:0.64rem;color:#64748b;margin-top:6px;">Review '+new Date().toLocaleString('id-ID')+' - sumber: '+(lastSrc||'-')+'. Keputusan final di tangan Anda.</div>';
out.innerHTML=h;
saveLS('ihsg_portdoc_last',{t:Date.now(),pnl:pnlTotal,heat:heat,flags:flags});
mountChips();
}catch(e){out.innerHTML='<div style="color:var(--red);">Review gagal: '+esc(e.message)+'</div>';}
finally{if(btn){btn.disabled=false;btn.innerText='🩺 Minta Review AI';}}
};
setTimeout(mountChips,1200);
})();
/* END portdoc v5 */
