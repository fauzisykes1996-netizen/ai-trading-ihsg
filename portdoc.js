/* portdoc.js v2 - Portfolio Heat + Portfolio Doctor: auto-deteksi penyimpanan portfolio */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var NL=String.fromCharCode(10);
 var lastSrc='';
 function looksPos(o){
  if(!o||typeof o!=='object')return false;
  var c=!!(o.t||o.code||o.ticker||o.symbol||o.kode);
  var l=!!(o.lot||o.qty||o.shares||o.jumlah);
  var p=!!(o.avg||o.entry||o.price||o.buy||o.harga||o.avgPrice);
  return c&&l&&p;
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
    var raw=localStorage.getItem(key);
    if(!raw||raw.charAt(0)!=='[')continue;
    var arr=null;try{arr=JSON.parse(raw);}catch(e){continue;}
    if(Array.isArray(arr)&&arr.length&&looksPos(arr[0])){lastSrc='scan:'+key;return arr;}
   }
  }catch(e2){}
  return [];
 }
 function codeOf(e){return e.t||e.code||e.ticker||e.symbol||e.kode||'';}
 function lotOf(e){return parseFloat(e.lot||e.qty||e.shares||e.jumlah)||0;}
 function avgOf(e){return parseFloat(e.avg||e.entry||e.price||e.buy||e.harga||e.avgPrice)||0;}
 function rets60(c){var r=[];var s=Math.max(1,c.length-60);for(var i=s;i<c.length;i++){if(c[i-1])r.push((c[i]-c[i-1])/c[i-1]);}return r;}
 function corr(a,b){var n=Math.min(a.length,b.length);if(n<10)return 0;var ma=0,mb=0;for(var i=0;i<n;i++){ma+=a[i];mb+=b[i];}ma/=n;mb/=n;var num=0,da=0,db=0;for(var j=0;j<n;j++){var x=a[j]-ma,y=b[j]-mb;num+=x*y;da+=x*x;db+=y*y;}if(da===0||db===0)return 0;return num/Math.sqrt(da*db);}
 function regimeIHSG(IA){
  var n=IA.c.length;var ma20=SW.sma(IA.c,20),ma50=SW.sma(IA.c,50),rsi=SW.rsi(IA.c,14);
  var p=IA.c[n-1],m20=ma20[n-1],m50=ma50[n-1],r=rsi[n-1];
  if(p>m20&&m20>m50&&r>=50&&r<=70)return{lab:'BULLISH'};
  if(p>m50&&r>=40&&r<=60)return{lab:'NETRAL-BULLISH'};
  if(p<m20&&p>m50)return{lab:'CAMPURAN'};
  return{lab:'BEARISH'};
 }
 var tab=document.getElementById('tab-porto');
 var anchor=tab?tab.querySelector('.card'):null;
 P.card('tab-porto',
  '<div class="card-title"><span>🌡️ Portfolio Heat</span><span class="agent-pill tech">Risiko Agregat</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="phBtn" onclick="runHeat()">🌡️ Hitung Portfolio Heat</button>'+
  '<div id="phOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Total risiko bila semua Stop Loss (2xATR) tersentuh bersamaan + deteksi posisi berkorelasi tinggi.</div>',anchor);
 P.card('tab-porto',
  '<div class="card-title"><span>🩺 Portfolio Doctor</span><span class="agent-pill master">AI Risk Manager</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="pdBtn" onclick="runPortDoc()">🩺 Minta Review AI</button>'+
  '<div id="pdOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Membaca semua posisi, menghitung risiko & korelasi, lalu AI memberi verdict HOLD/ADD/TRIM/EXIT per posisi + keputusan tingkat portofolio.</div>',document.getElementById('phOut').closest('.card'));

 function buildRows(porto,modal){
  var rows=[];
  for(var i=0;i<porto.length;i++){
   var e=porto[i];var code=codeOf(e).toUpperCase();var lot=lotOf(e);var avg=avgOf(e);
   if(code&&lot>0&&avg>0)rows.push({t:code,lot:lot,avg:avg});
  }
  return rows;
 }
 window.runHeat=async function(){
  var out=document.getElementById('phOut');
  var porto=getPorto();
  if(!porto.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Portfolio masih terbaca kosong. Sumber dicari: '+(lastSrc||'tidak ketemu')+'. Pastikan posisi tersimpan di kartu Portfolio Saya.</div>';return;}
  out.innerHTML='<div class="skel-box" style="height:60px"></div>';
  var list=buildRows(porto);
  var modal=0;for(var i=0;i<list.length;i++)modal+=list[i].lot*100*list[i].avg;
  if(!list.length||modal<=0){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data posisi tidak lengkap (lot & harga rata-rata wajib diisi).</div>';return;}
  var settled=await Promise.allSettled(list.map(function(p){return SW.candle(p.t,'1y');}));
  var rows=[];
  settled.forEach(function(res,i){
   if(res.status!=='fulfilled')return;
   var p=list[i];var A=SW.arrays(res.value);var n=A.c.length;if(n<30)return;
   var atr=SW.atr(A.h,A.l,A.c,14)[n-1]||A.c[n-1]*0.03;
   var price=(typeof cachePrice==='function'&&cachePrice(p.t))||A.c[n-1];
   var sl=p.avg-2*atr;if(sl<0)sl=0;
   var riskRp=p.lot*100*Math.max(0,p.avg-sl);
   var cap=p.lot*100*p.avg*0.5;if(riskRp>cap)riskRp=cap;
   rows.push({t:p.t,lot:p.lot,sl:sl,riskPct:riskRp/modal*100,rets:rets60(A.c)});
  });
  var heat=0;for(var k=0;k<rows.length;k++)heat+=rows[k].riskPct;
  var pairs=[];
  for(var a=0;a<rows.length;a++){for(var b=a+1;b<rows.length;b++){var c=corr(rows[a].rets,rows[b].rets);if(c>0.7)pairs.push(rows[a].t+' x '+rows[b].t+' ('+c.toFixed(2)+')');}}
  var col=heat<3?'green':(heat<=6?'yellow':'red');
  var verdict=heat<3?'AMAN - ruang tambah posisi terbuka':(heat<=6?'SEDANG - hati-hati menambah posisi':'PANAS - kurangi ukuran atau tambah hedge');
  var h='<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">';
  h+='<div style="font-family:var(--mono);font-size:2rem;font-weight:900;color:var(--'+col+');">'+heat.toFixed(1)+'%</div>';
  h+='<div><div style="font-weight:800;color:var(--'+col+');">'+verdict+'</div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">Sumber data: '+(lastSrc||'-')+'</div></div></div>';
  for(var r2=0;r2<rows.length;r2++){
   var rw=rows[r2];
   h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span>'+rw.t+' <span style="color:var(--text-muted);font-size:0.66rem;">'+rw.lot+' lot - SL asum '+Math.round(rw.sl).toLocaleString('id-ID')+'</span></span><span style="font-family:var(--mono);font-weight:700;">'+rw.riskPct.toFixed(1)+'%</span></div>';
  }
  if(pairs.length)h+='<div style="font-size:0.72rem;color:var(--yellow);margin-top:8px;">⚠️ Korelasi tinggi (&gt;0,7): '+pairs.join(', ')+' - posisi ini cenderung jatuh bersama.</div>';
  h+='<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Heat &lt; 3% agresif aman, 3-6% moderat, &gt; 6% = satu berita buruk melukai semua posisi.</div>';
  out.innerHTML=h;
 };

 function chipHtml(last){
  var p=getPorto();
  var h='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:0.7rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:10px;">';
  h+='<span style="font-weight:800;color:#fff;">🩺 Portfolio:</span>';
  h+='<span>'+p.length+' posisi</span>';
  if(last){
   h+='<span class="'+(last.pnl>=0?'green':'red')+'" style="font-weight:700;">P&L '+(last.pnl>=0?'+':'')+last.pnl.toFixed(1)+'%</span>';
   h+='<span>Heat '+last.heat.toFixed(1)+'%</span>';
   if(last.flags)h+='<span class="yellow">⚠ '+last.flags+' peringatan</span>';
  }else{h+='<span style="color:var(--text-muted);">belum direview</span>';}
  h+='<button class="btn-mini" onclick="goPortDoc()">Review</button></div>';
  return h;
 }
 function mountChips(){
  var last=lsJSON('ihsg_portdoc_last',null);
  var html=chipHtml(last);
  var tabs=['tab-analysis','tab-market'];
  for(var i=0;i<tabs.length;i++){
   var t=document.getElementById(tabs[i]);if(!t)continue;
   var old=document.getElementById('portChip_'+i);if(old)old.remove();
   var div=document.createElement('div');div.id='portChip_'+i;div.innerHTML=html;
   t.insertBefore(div,t.firstChild);
  }
 }
 window.goPortDoc=function(){switchTab('porto');setTimeout(function(){window.runPortDoc();},300);};

 window.runPortDoc=async function(){
  var out=document.getElementById('pdOut');
  var porto=getPorto();
  if(!porto.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Portfolio terbaca kosong (sumber: '+(lastSrc||'tidak ketemu')+'). Isi posisi di kartu Portfolio Saya dulu.</div>';return;}
  out.innerHTML='<div class="skel-box" style="height:80px"></div>';
  var btn=document.getElementById('pdBtn');if(btn){btn.disabled=true;btn.innerText='Menganalisis portfolio...';}
  try{
   var ij=await fetchChart('^JKSE','1y');var IA=SW.arrays(ij.chart.result[0]);var reg=regimeIHSG(IA);
   var list=buildRows(porto);
   var totalValue=0,totalCost=0;var rows=[];
   var settled=await Promise.allSettled(list.map(function(p){return SW.candle(p.t,'1y');}));
   settled.forEach(function(res,i){
    var p=list[i];var price=null,A=null,n=0;
    if(res.status==='fulfilled'){A=SW.arrays(res.value);n=A.c.length;price=(typeof cachePrice==='function'&&cachePrice(p.t))||A.c[n-1];}
    else{price=(typeof cachePrice==='function'&&cachePrice(p.t))||p.avg;}
    if(!price)return;
    var value=p.lot*100*price,cost=p.lot*100*p.avg;
    totalValue+=value;totalCost+=cost;
    var pnl=(price-p.avg)/p.avg*100;
    var trend='?',rsi=null,atrpct=0,distSL=0;
    if(A&&n>60){
     var ma20=SW.sma(A.c,20)[n-1],ma50=SW.sma(A.c,50)[n-1];
     rsi=SW.rsi(A.c,14)[n-1];
     var atr=SW.atr(A.h,A.l,A.c,14)[n-1];
     atrpct=atr?atr/price*100:0;
     trend=(price>ma20&&ma20>ma50)?'NAIK':(price>ma50?'DATAR':'TURUN');
     var sl=p.avg-2*atr;distSL=sl>0?(price-sl)/price*100:0;
    }
    rows.push({code:p.t,lot:p.lot,avg:p.avg,price:price,value:value,pnl:pnl,weight:0,trend:trend,rsi:rsi,atrpct:atrpct,distSL:distSL,rets:A?rets60(A.c):[]});
   });
   if(!rows.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data posisi tidak lengkap.</div>';return;}
   for(var w=0;w<rows.length;w++)rows[w].weight=totalValue>0?rows[w].value/totalValue*100:0;
   var pnlTotal=totalCost>0?(totalValue-totalCost)/totalCost*100:0;
   var heat=0;
   for(var h2=0;h2<rows.length;h2++){var r2=rows[h2];var slA=r2.avg-2*(r2.atrpct/100*r2.price||r2.avg*0.06);var riskRp=r2.lot*100*Math.max(0,r2.avg-slA);var cap=r2.lot*100*r2.avg*0.5;if(riskRp>cap)riskRp=cap;heat+=totalCost>0?riskRp/totalCost*100:0;}
   var maxW=0,maxCode='';for(var mI=0;mI<rows.length;mI++){if(rows[mI].weight>maxW){maxW=rows[mI].weight;maxCode=rows[mI].code;}}
   var pairs=[];
   for(var a=0;a<rows.length;a++){for(var b=a+1;b<rows.length;b++){var c=corr(rows[a].rets,rows[b].rets);if(c>0.7)pairs.push(rows[a].code+'x'+rows[b].code);}}
   var flags=0;for(var fI=0;fI<rows.length;fI++){if(rows[fI].distSL<2||rows[fI].weight>40||rows[fI].trend==='TURUN')flags++;}
   var L=[];
   L.push('REGIME PASAR (IHSG): '+reg.lab);
   L.push('PORTFOLIO: nilai '+Math.round(totalValue).toLocaleString('id-ID')+', P&L total '+(pnlTotal>=0?'+':'')+pnlTotal.toFixed(1)+'%, Heat '+heat.toFixed(1)+'%, terberat '+maxCode+' '+maxW.toFixed(0)+'%'+(pairs.length?', korelasi tinggi: '+pairs.join(', '):'')+'.');
   for(var pI=0;pI<rows.length;pI++){
    var rw=rows[pI];
    L.push(rw.code+': P&L '+(rw.pnl>=0?'+':'')+rw.pnl.toFixed(1)+'%, berat '+rw.weight.toFixed(0)+'%, tren '+rw.trend+', RSI '+(rw.rsi!=null?rw.rsi.toFixed(0):'-')+', ATR '+rw.atrpct.toFixed(1)+'%, jarak ke SL '+rw.distSL.toFixed(1)+'%'+(rw.distSL<2?' [DEKAT SL]':'')+(rw.weight>40?' [OVERWEIGHT]':'')+(rw.trend==='TURUN'?' [TREND TURUN]':''));
   }
   var prompt='Anda manajer risiko portofolio saham Indonesia yang tegas. Data portfolio klien:'+NL+L.join(NL)+NL+NL+'Tugas: (1) untuk SETIAP kode beri verdict HOLD/ADD/TRIM/EXIT + alasan 1 kalimat berbasis angka; (2) lalu 2-3 keputusan tingkat portofolio (konsentrasi, korelasi, heat, regime). Maks 160 kata, bahasa Indonesia, tanpa basa-basi.';
   var narrative='';
   try{narrative=await window.callLLM(prompt);}catch(e){narrative='(AI gagal: '+e.message+') Data mentah:'+NL+L.join(NL);}
   var h='<div class="metric-grid" style="margin-bottom:8px;">';
   h+='<div class="metric-box"><div class="metric-label">Nilai Pasar</div><div class="metric-value">'+(totalValue/1e6).toFixed(2)+' jt</div></div>';
   h+='<div class="metric-box"><div class="metric-label">P&L Total</div><div class="metric-value '+(pnlTotal>=0?'green':'red')+'">'+(pnlTotal>=0?'+':'')+pnlTotal.toFixed(1)+'%</div></div>';
   h+='<div class="metric-box"><div class="metric-label">Heat</div><div class="metric-value '+(heat<3?'green':heat<=6?'yellow':'red')+'">'+heat.toFixed(1)+'%</div></div>';
   h+='<div class="metric-box"><div class="metric-label">Terberat</div><div class="metric-value '+(maxW>40?'red':'green')+'">'+maxCode+' '+maxW.toFixed(0)+'%</div></div>';
   h+='</div>';
   for(var dI=0;dI<rows.length;dI++){
    var rd=rows[dI];
    var warn='';
    if(rd.distSL<2)warn+='⚠ dekat SL ';
    if(rd.weight>40)warn+='⚠ overweight ';
    if(rd.trend==='TURUN')warn+='⚠ tren turun ';
    h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);">';
    h+='<span><strong>'+rd.code+'</strong> <span style="color:var(--text-muted);font-size:0.66rem;">'+rd.lot+' lot - '+rd.trend+(warn?' - '+warn:'')+'</span></span>';
    h+='<span style="font-family:var(--mono);font-weight:700;" class="'+(rd.pnl>=0?'green':'red')+'">'+(rd.pnl>=0?'+':'')+rd.pnl.toFixed(1)+'%</span></div>';
   }
   h+='<div class="report-card" style="margin-top:10px;white-space:pre-wrap;">'+esc(narrative)+'</div>';
   h+='<div style="font-size:0.64rem;color:#64748b;margin-top:6px;">Review '+new Date().toLocaleString('id-ID')+' - sumber data: '+(lastSrc||'-')+'. Keputusan final tetap di tangan Anda.</div>';
   out.innerHTML=h;
   saveLS('ihsg_portdoc_last',{t:Date.now(),pnl:pnlTotal,heat:heat,flags:flags});
   mountChips();
  }catch(e){out.innerHTML='<div style="color:var(--red);">Review gagal: '+esc(e.message)+'</div>';}
  finally{if(btn){btn.disabled=false;btn.innerText='🩺 Minta Review AI';}}
 };
 setTimeout(mountChips,1200);
})();
/* END portdoc v2 */
