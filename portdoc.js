/* portdoc.js - Portfolio Doctor: AI menilai seluruh posisi Anda + keputusan risiko portofolio */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var NL=String.fromCharCode(10);
 function getPorto(){
  if(Array.isArray(window.portfolio)&&window.portfolio.length)return window.portfolio;
  var keys=['ihsg_porto','ihsg_portfolio','portfolio'];
  for(var i=0;i<keys.length;i++){var a=lsJSON(keys[i],null);if(Array.isArray(a)&&a.length)return a;}
  return [];
 }
 function codeOf(e){return e.t||e.code||e.ticker||'';}
 function rets60(c){var r=[];var s=Math.max(1,c.length-60);for(var i=s;i<c.length;i++){if(c[i-1])r.push((c[i]-c[i-1])/c[i-1]);}return r;}
 function corr(a,b){var n=Math.min(a.length,b.length);if(n<10)return 0;var ma=0,mb=0;for(var i=0;i<n;i++){ma+=a[i];mb+=b[i];}ma/=n;mb/=n;var num=0,da=0,db=0;for(var j=0;j<n;j++){var x=a[j]-ma,y=b[j]-mb;num+=x*y;da+=x*x;db+=y*y;}if(da===0||db===0)return 0;return num/Math.sqrt(da*db);}
 function regimeIHSG(IA){
  var n=IA.c.length;var ma20=SW.sma(IA.c,20),ma50=SW.sma(IA.c,50),rsi=SW.rsi(IA.c,14);
  var p=IA.c[n-1],m20=ma20[n-1],m50=ma50[n-1],r=rsi[n-1];
  if(p>m20&&m20>m50&&r>=50&&r<=70)return{lab:'BULLISH',pts:2};
  if(p>m50&&r>=40&&r<=60)return{lab:'NETRAL-BULLISH',pts:1};
  if(p<m20&&p>m50)return{lab:'CAMPURAN',pts:0};
  return{lab:'BEARISH',pts:-2};
 }
 var anchor=document.getElementById('phOut')?document.getElementById('phOut').closest('.card'):null;
 P.card('tab-porto',
  '<div class="card-title"><span>🩺 Portfolio Doctor</span><span class="agent-pill master">AI Risk Manager</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="pdBtn" onclick="runPortDoc()">🩺 Minta Review AI</button>'+
  '<div id="pdOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Membaca semua posisi di Porto, menghitung risiko & korelasi, lalu minta AI memberi verdict HOLD/ADD/TRIM/EXIT per posisi + keputusan tingkat portofolio.</div>',anchor);

 function chipHtml(last){
  var p=getPorto();
  var h='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:0.7rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:10px;">';
  h+='<span style="font-weight:800;color:#fff;">🩺 Portfolio:</span>';
  h+='<span>'+p.length+' posisi</span>';
  if(last){
   h+='<span class="'+(last.pnl>=0?'green':'red')+'" style="font-weight:700;">P&L '+(last.pnl>=0?'+':'')+last.pnl.toFixed(1)+'%</span>';
   h+='<span>Heat '+last.heat.toFixed(1)+'%</span>';
   if(last.flags)h+='<span class="yellow">⚠ '+last.flags+' peringatan</span>';
   h+='<span style="color:var(--text-muted);">review '+new Date(last.t).toLocaleDateString('id-ID')+'</span>';
  }else{
   h+='<span style="color:var(--text-muted);">belum direview</span>';
  }
  h+='<button class="btn-mini" onclick="goPortDoc()">Review</button>';
  h+='</div>';
  return h;
 }
 function mountChips(){
  var last=lsJSON('ihsg_portdoc_last',null);
  var html=chipHtml(last);
  var tabs=['tab-analysis','tab-market'];
  for(var i=0;i<tabs.length;i++){
   var tab=document.getElementById(tabs[i]);if(!tab)continue;
   var old=document.getElementById('portChip_'+i);if(old)old.remove();
   var div=document.createElement('div');div.id='portChip_'+i;div.innerHTML=html;
   tab.insertBefore(div,tab.firstChild);
  }
 }
 window.goPortDoc=function(){switchTab('porto');setTimeout(function(){runPortDoc();},300);};

 window.runPortDoc=async function(){
  var out=document.getElementById('pdOut');
  var porto=getPorto();
  if(!porto.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Portfolio kosong. Isi posisi di kartu Portfolio dulu (kode, lot, harga rata-rata), lalu minta review.</div>';return;}
  out.innerHTML='<div class="skel-box" style="height:80px"></div>';
  var btn=document.getElementById('pdBtn');if(btn){btn.disabled=true;btn.innerText='Menganalisis portfolio...';}
  try{
   var ij=await fetchChart('^JKSE','1y');var IA=SW.arrays(ij.chart.result[0]);var reg=regimeIHSG(IA);
   var rows=[];var totalValue=0,totalCost=0;
   var settled=await Promise.allSettled(porto.map(function(e){return SW.candle(codeOf(e),'1y');}));
   settled.forEach(function(res,i){
    var e=porto[i];var code=codeOf(e);var lot=parseFloat(e.lot)||0;var avg=parseFloat(e.avg||e.entry||e.price)||0;
    if(!code||lot<=0||avg<=0)return;
    var price=null,A=null,n=0;
    if(res.status==='fulfilled'){A=SW.arrays(res.value);n=A.c.length;price=(typeof cachePrice==='function'&&cachePrice(code))||A.c[n-1];}
    else{price=(typeof cachePrice==='function'&&cachePrice(code))||avg;}
    if(!price)return;
    var value=lot*100*price,cost=lot*100*avg;
    totalValue+=value;totalCost+=cost;
    var pnl=(price-avg)/avg*100;
    var ma20=null,ma50=null,rsi=null,atr=null,slope=0,atrpct=0,trend='?';
    if(A&&n>60){
     ma20=SW.sma(A.c,20)[n-1];ma50=SW.sma(A.c,50)[n-1];rsi=SW.rsi(A.c,14)[n-1];atr=SW.atr(A.h,A.l,A.c,14)[n-1];
     slope=(ma20!=null&&SW.sma(A.c,20)[n-6]!=null&&SW.sma(A.c,20)[n-6]!==0)?(ma20-SW.sma(A.c,20)[n-6])/SW.sma(A.c,20)[n-6]*100:0;
     atrpct=atr?atr/price*100:0;
     trend=(price>ma20&&ma20>ma50)?'NAIK':(price>ma50?'DATAR':'TURUN');
    }
    var sl=avg-2*(atr||avg*0.03);
    var distSL=sl>0?(price-sl)/price*100:0;
    rows.push({code:code,lot:lot,avg:avg,price:price,value:value,pnl:pnl,weight:0,trend:trend,rsi:rsi,atrpct:atrpct,distSL:distSL,rets:A?rets60(A.c):[]});
   });
   if(!rows.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data posisi tidak lengkap (lot & harga rata-rata wajib diisi).</div>';return;}
   for(var w=0;w<rows.length;w++)rows[w].weight=totalValue>0?rows[w].value/totalValue*100:0;
   var pnlTotal=totalCost>0?(totalValue-totalCost)/totalCost*100:0;
   var heat=0;for(var hI=0;hI<rows.length;hI++){var rr=rows[hI];heat+=totalCost>0?(rr.lot*100*Math.max(0,rr.avg-(rr.price-rr.atrpct/100*rr.price*0))):0;}
   heat=0;
   for(var h2=0;h2<rows.length;h2++){var r2=rows[h2];var slA=r2.avg-2*(r2.atrpct/100*r2.price||r2.avg*0.06);var riskRp=r2.lot*100*Math.max(0,r2.avg-slA);var cap=r2.lot*100*r2.avg*0.5;if(riskRp>cap)riskRp=cap;heat+=totalCost>0?riskRp/totalCost*100:0;}
   var maxW=0,maxCode='';for(var mI=0;mI<rows.length;mI++){if(rows[mI].weight>maxW){maxW=rows[mI].weight;maxCode=rows[mI].code;}}
   var pairs=[];
   for(var a=0;a<rows.length;a++){for(var b=a+1;b<rows.length;b++){var c=corr(rows[a].rets,rows[b].rets);if(c>0.7)pairs.push(rows[a].code+'x'+rows[b].code);}}
   var flags=0;for(var fI=0;fI<rows.length;fI++){if(rows[fI].distSL<2||rows[fI].weight>40||rows[fI].trend==='TURUN')flags++;}
   var L=[];
   L.push('REGIME PASAR (IHSG): '+reg.lab);
   L.push('PORTFOLIO: nilai '+Math.round(totalValue).toLocaleString('id-ID')+', P&L total '+(pnlTotal>=0?'+':'')+pnlTotal.toFixed(1)+'%, Heat '+heat.toFixed(1)+'%, posisi terberat '+maxCode+' '+maxW.toFixed(0)+'%'+(pairs.length?', korelasi tinggi: '+pairs.join(', '):'')+'.');
   for(var pI=0;pI<rows.length;pI++){
    var rw=rows[pI];
    L.push(rw.code+': P&L '+(rw.pnl>=0?'+':'')+rw.pnl.toFixed(1)+'%, berat '+rw.weight.toFixed(0)+'%, tren '+rw.trend+', RSI '+(rw.rsi!=null?rw.rsi.toFixed(0):'-')+', ATR '+rw.atrpct.toFixed(1)+'%, jarak ke SL asumsi '+rw.distSL.toFixed(1)+'%'+(rw.distSL<2?' [DEKAT SL]':'')+(rw.weight>40?' [OVERWEIGHT]':'')+(rw.trend==='TURUN'?' [TREND TURUN]':''));
   }
   var prompt='Anda manajer risiko portofolio saham Indonesia yang tegas. Data portfolio klien:'+NL+L.join(NL)+NL+NL+'Tugas: (1) untuk SETIAP kode beri verdict HOLD/ADD/TRIM/EXIT + alasan 1 kalimat berbasis angka di atas; (2) lalu 2-3 keputusan tingkat portofolio (konsentrasi, korelasi, heat, regime). Maks 160 kata, bahasa Indonesia, tanpa basa-basi.';
   var narrative='';
   try{narrative=await window.callLLM(prompt);}catch(e){narrative='(AI gagal: '+e.message+') Data mentah:'+NL+L.join(NL);}
   var h='<div class="metric-grid" style="margin-bottom:8px;">';
   h+='<div class="metric-box"><div class="metric-label">Nilai Pasar</div><div class="metric-value">'+Math.round(totalValue/1000)+'rb</div></div>';
   h+='<div class="metric-box"><div class="metric-label">P&L Total</div><div class="metric-value '+(pnlTotal>=0?'green':'red')+'">'+(pnlTotal>=0?'+':'')+pnlTotal.toFixed(1)+'%</div></div>';
   h+='<div class="metric-box"><div class="metric-label">Heat</div><div class="metric-value '+(heat<3?'green':heat<=6?'yellow':'red')+'">'+heat.toFixed(1)+'%</div></div>';
   h+='<div class="metric-box"><div class="metric-label">Terberat</div><div class="metric-value '+(maxW>40?'red':'green')+'">'+maxCode+' '+maxW.toFixed(0)+'%</div></div>';
   h+='</div>';
   for(var dI=0;dI<rows.length;dI++){
    var rd=rows[dI];
    var warn=(rd.distSL<2?'⚠ dekat SL ':'')+(rd.weight>40?'⚠ overweight ':'')+(rd.trend==='TURUN?'?'':'');
    if(rd.trend==='TURUN')warn+='⚠ tren turun ';
    h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);">';
    h+='<span><strong>'+rd.code+'</strong> <span style="color:var(--text-muted);font-size:0.66rem;">'+rd.lot+' lot - '+rd.trend+(warn?' - '+warn:'')+'</span></span>';
    h+='<span style="font-family:var(--mono);font-weight:700;" class="'+(rd.pnl>=0?'green':'red')+'">'+(rd.pnl>=0?'+':'')+rd.pnl.toFixed(1)+'%</span></div>';
   }
   h+='<div class="report-card" style="margin-top:10px;white-space:pre-wrap;">'+esc(narrative)+'</div>';
   h+='<div style="font-size:0.64rem;color:#64748b;margin-top:6px;">Review '+new Date().toLocaleString('id-ID')+' - keputusan final tetap di tangan Anda.</div>';
   out.innerHTML=h;
   saveLS('ihsg_portdoc_last',{t:Date.now(),pnl:pnlTotal,heat:heat,flags:flags});
   mountChips();
  }catch(e){out.innerHTML='<div style="color:var(--red);">Review gagal: '+esc(e.message)+'</div>';}
  finally{if(btn){btn.disabled=false;btn.innerText='🩺 Minta Review AI';}}
 };
 setTimeout(mountChips,1200);
})();
/* END portdoc v1 */
