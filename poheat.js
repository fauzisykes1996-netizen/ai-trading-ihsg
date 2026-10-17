/* poheat.js - Portfolio Heat: total risiko bila semua SL tersentuh + deteksi posisi berkorelasi */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var tab=document.getElementById('tab-porto');
 var anchor=tab?tab.querySelector('.card'):null;
 P.card('tab-porto',
  '<div class="card-title"><span>🌡️ Portfolio Heat</span><span class="agent-pill tech">Risiko Agregat</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="phBtn" onclick="runHeat()">🌡️ Hitung Portfolio Heat</button>'+
  '<div id="phOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Total risiko bila semua Stop Loss (asumsi 2xATR) tersentuh bersamaan + deteksi pasangan posisi berkorelasi tinggi.</div>',anchor);
 function getPorto(){
  if(Array.isArray(window.portfolio)&&window.portfolio.length)return window.portfolio;
  var keys=['ihsg_porto','ihsg_portfolio','portfolio'];
  for(var i=0;i<keys.length;i++){var a=lsJSON(keys[i],null);if(Array.isArray(a)&&a.length)return a;}
  return [];
 }
 function codeOf(e){return e.t||e.code||e.ticker||'';}
 function rets60(c){var r=[];var s=Math.max(1,c.length-60);for(var i=s;i<c.length;i++){if(c[i-1])r.push((c[i]-c[i-1])/c[i-1]);}return r;}
 function corr(a,b){var n=Math.min(a.length,b.length);if(n<10)return 0;var ma=0,mb=0;for(var i=0;i<n;i++){ma+=a[i];mb+=b[i];}ma/=n;mb/=n;var num=0,da=0,db=0;for(var j=0;j<n;j++){var x=a[j]-ma,y=b[j]-mb;num+=x*y;da+=x*x;db+=y*y;}if(da===0||db===0)return 0;return num/Math.sqrt(da*db);}
 window.runHeat=async function(){
  var out=document.getElementById('phOut');
  var porto=getPorto();
  if(!porto.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Portfolio kosong - tambah posisi di kartu Portfolio dulu, lalu hitung ulang.</div>';return;}
  out.innerHTML='<div class="skel-box" style="height:60px"></div>';
  var modal=0;var list=[];
  for(var i=0;i<porto.length;i++){var e=porto[i];var lot=parseFloat(e.lot)||0;var entry=parseFloat(e.avg||e.entry||e.price)||0;if(lot>0&&entry>0){list.push({t:codeOf(e),lot:lot,entry:entry});modal+=lot*100*entry;}}
  if(!list.length||modal<=0){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data posisi tidak lengkap (lot & harga rata-rata wajib diisi).</div>';return;}
  var settled=await Promise.allSettled(list.map(function(p){return SW.candle(p.t,'1y');}));
  var rows=[];
  settled.forEach(function(res,i){
   if(res.status!=='fulfilled')return;
   var p=list[i];var A=SW.arrays(res.value);var n=A.c.length;if(n<30)return;
   var atr=SW.atr(A.h,A.l,A.c,14)[n-1]||A.c[n-1]*0.03;
   var price=(typeof cachePrice==='function'&&cachePrice(p.t))||A.c[n-1];
   var sl=p.entry-2*atr;if(sl<0)sl=0;
   var riskRp=p.lot*100*Math.max(0,p.entry-sl);
   var cap=p.lot*100*p.entry*0.5;if(riskRp>cap)riskRp=cap;
   rows.push({t:p.t,lot:p.lot,entry:p.entry,price:price,sl:sl,riskPct:riskRp/modal*100,rets:rets60(A.c)});
  });
  var heat=0;for(var k=0;k<rows.length;k++)heat+=rows[k].riskPct;
  var pairs=[];
  for(var a=0;a<rows.length;a++){for(var b=a+1;b<rows.length;b++){var c=corr(rows[a].rets,rows[b].rets);if(c>0.7)pairs.push(rows[a].t+' x '+rows[b].t+' ('+c.toFixed(2)+')');}}
  var col=heat<3?'green':(heat<=6?'yellow':'red');
  var verdict=heat<3?'AMAN - ruang tambah posisi terbuka':(heat<=6?'SEDANG - hati-hati menambah posisi':'PANAS - kurangi ukuran atau tambah hedge');
  var h='<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">';
  h+='<div style="font-family:var(--mono);font-size:2rem;font-weight:900;color:var(--'+col+');">'+heat.toFixed(1)+'%</div>';
  h+='<div><div style="font-weight:800;color:var(--'+col+');">'+verdict+'</div><div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">Risiko total bila semua SL (2xATR) tersentuh bersamaan</div></div></div>';
  for(var r2=0;r2<rows.length;r2++){
   var rw=rows[r2];
   h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span>'+rw.t+' <span style="color:var(--text-muted);font-size:0.66rem;">'+rw.lot+' lot - SL asum '+Math.round(rw.sl).toLocaleString('id-ID')+'</span></span><span style="font-family:var(--mono);font-weight:700;">'+rw.riskPct.toFixed(1)+'%</span></div>';
  }
  if(pairs.length)h+='<div style="font-size:0.72rem;color:var(--yellow);margin-top:8px;">⚠️ Korelasi tinggi (&gt;0,7): '+pairs.join(', ')+' - posisi ini cenderung jatuh bersama.</div>';
  h+='<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Aturan umum swing: heat &lt; 3% agresif aman, 3-6% moderat, &gt; 6% = satu berita buruk bisa melukai semua posisi sekaligus.</div>';
  out.innerHTML=h;
 };
 setTimeout(function(){if(document.getElementById('phOut'))window.runHeat();},2000);
})();
/* END poheat v1 */
