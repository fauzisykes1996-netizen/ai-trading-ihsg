/* onemonth.js - One-Month Forecast: skor 0-100 untuk pegang 1 bulan ke depan */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var anchor=document.getElementById('graderOut')?document.getElementById('graderOut').closest('.card'):(document.getElementById('regimeOut')?document.getElementById('regimeOut').closest('.card'):null);
 P.card('tab-analysis',
  '<div class="card-title"><span>📅 One-Month Forecast</span><span class="agent-pill master">Pegang 1 Bulan?</span></div>'+
  '<div id="omOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - skor 0-100 apakah layak dipegang 1 bulan (20-25 hari trading) ke depan.</div>',
  anchor);
 function domUpper(id){var e=document.getElementById(id);return e?(e.innerText||'').toUpperCase():'';}
 function forecast(code,candle){
  var A=SW.arrays(candle);var n=A.c.length;
  var reasons=[];var score=0;
  // 1) Tren jangka menengah: MA50 > MA100
  var ma50=SW.sma(A.c,50),ma100=SW.sma(A.c,100);
  var m50=ma50[n-1],m100=ma100[n-1],price=A.c[n-1];
  var slope50=(m50!=null&&ma50[n-6]!=null&&ma50[n-6]!==0)?(m50-ma50[n-6])/ma50[n-6]*100:0;
  var trenPts=0;
  if(price>m50&&m50>m100){trenPts+=15;reasons.push({ok:true,txt:'Tren menengah sehat: harga > MA50 > MA100'});}
  else if(price>m50){trenPts+=8;reasons.push({ok:false,txt:'Harga di atas MA50 tapi MA100 belum tertembus'});}
  else{reasons.push({ok:false,txt:'Harga di bawah MA50 - tren menengah lemah'});}
  if(slope50>1){trenPts+=10;reasons.push({ok:true,txt:'MA50 menanjak kuat ('+slope50.toFixed(1)+'% / 5 hari)'});}
  else if(slope50>0){trenPts+=5;}
  else{reasons.push({ok:false,txt:'MA50 datar/menurun - belum ada tenaga naik'});}
  score+=trenPts;
  // 2) Momentum 60 hari vs IHSG
  var ret60=n>=61?((price/A.c[n-61])-1)*100:0;
  score+=10; // baseline
  if(ret60>10){score+=10;reasons.push({ok:true,txt:'Momentum 60 hari kuat: '+(ret60>=0?'+':'')+ret60.toFixed(1)+'%'});}
  else if(ret60>0){score+=5;reasons.push({ok:false,txt:'Momentum 60 hari positif tapi lemah: +'+ret60.toFixed(1)+'%'});}
  else{score-=3;reasons.push({ok:false,txt:'Momentum 60 hari negatif: '+ret60.toFixed(1)+'%'});}
  // 3) Volume 20d vs 60d (minat institusi)
  var q=candle.indicators.quote[0];var vol=[];
  if(q.volume){for(var i=0;i<q.volume.length;i++)if(q.volume[i]!=null)vol.push(q.volume[i]);}
  if(vol.length>=61){
   var avg20=0;for(var a=vol.length-20;a<vol.length;a++)avg20+=vol[a];avg20/=20;
   var avg60=0;for(var b=vol.length-60;b<vol.length;b++)avg60+=vol[b];avg60/=60;
   var ratio=avg60>0?avg20/avg60:1;
   if(ratio>=1.3){score+=10;reasons.push({ok:true,txt:'Volume meningkat ('+ratio.toFixed(1)+'x) - ada minat baru'});}
   else if(ratio>=1){score+=5;reasons.push({ok:false,txt:'Volume stabil - belum ada lonjakan minat'});}
   else{reasons.push({ok:false,txt:'Volume menurun ('+ratio.toFixed(1)+'x) - minat hilang'});}
  }
  // 4) Market Regime (ambil dari kartu agent-regime bila ada)
  var rg=domUpper('regimeOut');
  if(rg.indexOf('BULLISH')>=0&&rg.indexOf('NETRAL-BULLISH')<0){score+=10;reasons.push({ok:true,txt:'Pasar mendukung (regime bullish)'});}
  else if(rg.indexOf('NETRAL-BULLISH')>=0){score+=7;reasons.push({ok:true,txt:'Pasar netral-bullish - masih layak'});}
  else if(rg.indexOf('BEARISH')>=0){score+=0;reasons.push({ok:false,txt:'Pasar bearish - risiko tinggi untuk hold 1 bulan'});}
  else if(rg.indexOf('CAMPURAN')>=0){score+=3;reasons.push({ok:false,txt:'Pasar campuran - setup harus sangat bagus'});}
  // 5) Tape Reader (bandar)
  var bt=domUpper('bandarOut');
  if(bt.indexOf('AKUMULASI KUAT')>=0){score+=10;reasons.push({ok:true,txt:'Bandar akumulasi kuat (jejak institusi positif)'});}
  else if(bt.indexOf('AKUMULASI SEDANG')>=0){score+=7;reasons.push({ok:true,txt:'Ada jejak akumulasi'});}
  else if(bt.indexOf('DISTRIBUSI')>=0){score-=5;reasons.push({ok:false,txt:'Bandar distribusi - hati-hati'});}
  // 6) Money Flow
  var mf=domUpper('moneyflowOut');
  if(mf.indexOf('SANGAT KUAT')>=0){score+=5;reasons.push({ok:true,txt:'Aliran dana masuk deras'});}
  else if(mf.indexOf('KUAT')>=0){score+=8;reasons.push({ok:true,txt:'Aliran dana positif'});}
  else if(mf.indexOf('LEMAH')>=0){score-=3;reasons.push({ok:false,txt:'Aliran dana keluar'});}
  score=Math.max(0,Math.min(100,score));
  var verdict,col;
  if(score>=75){verdict='LAYAK 1 BULAN';col='green';}
  else if(score>=60){verdict='BOLEH DENGAN HATI-HATI';col='yellow';}
  else{verdict='HINDARI';col='red';}
  return {score:score,verdict:verdict,col:col,reasons:reasons,ret60:ret60,m50:m50,m100:m100,price:price};
 }
 function miniChart(code){
  return SW.candle(code,'1y').then(function(candle){
   return fetchChart('^JKSE','1y').then(function(ij){
    var A=SW.arrays(candle);var IA=SW.arrays(ij.chart.result[0]);
    var L=Math.min(A.c.length,IA.c.length,60);
    var sRet=[],iRet=[];
    var baseS=A.c[A.c.length-L],baseI=IA.c[IA.c.length-L];
    for(var i=A.c.length-L;i<A.c.length;i++){sRet.push((A.c[i]/baseS-1)*100);}
    for(var j=IA.c.length-L;j<IA.c.length;j++){iRet.push((IA.c[j]/baseI-1)*100);}
    var all=sRet.concat(iRet);
    var min=Math.min.apply(null,all),max=Math.max.apply(null,all);
    var span=(max-min)||1;var W=280,H=70,pad=6;
    function X(i){return pad+(i/(L-1))*(W-2*pad);}
    function Y(v){return H-pad-((v-min)/span)*(H-2*pad);}
    function path(arr,col){var d='';for(var k=0;k<arr.length;k++)d+=(k===0?'M':'L')+X(k).toFixed(1)+','+Y(arr[k]).toFixed(1)+' ';return '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round"/>';}
    var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:70px;display:block;margin-top:4px;">';
    svg+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="rgba(255,255,255,.12)" stroke-dasharray="3 3"/>';
    svg+=path(iRet,'#64748b');
    svg+=path(sRet,'#22c55e');
    svg+='<text x="'+(W-pad)+'" y="'+Y(sRet[L-1]).toFixed(1)+'" fill="#22c55e" font-size="7" text-anchor="end">'+(sRet[L-1]>=0?'+':'')+sRet[L-1].toFixed(1)+'%</text>';
    svg+='<text x="'+(W-pad)+'" y="'+(Y(iRet[L-1])+9).toFixed(1)+'" fill="#64748b" font-size="7" text-anchor="end">IHSG '+(iRet[L-1]>=0?'+':'')+iRet[L-1].toFixed(1)+'%</text>';
    svg+='</svg>';
    return svg;
   });
  });
 }
 function exitPlan(f){
  var sl=f.m50!=null?Math.round(f.m50*0.97):Math.round(f.price*0.9);
  var exit='';
  exit+='<div style="font-size:0.72rem;font-weight:800;color:#fff;margin-top:10px;margin-bottom:4px;">🚪 Exit Plan (keluar lebih cepat)</div>';
  exit+='<div style="font-size:0.74rem;color:var(--text-muted);line-height:1.6;">';
  exit+='• <strong>Wajib keluar</strong> bila harga jebol '+sl.toLocaleString('id-ID')+' (breakdown MA50).<br>';
  exit+='• <strong>Review mingguan</strong>: kalau 2 minggu tidak bergerak ≥3%, pertimbangkan rotasi.<br>';
  exit+='• <strong>Target 1 bulan</strong>: +(10-15)% realistis bila tren berlanjut.<br>';
  exit+='• <strong>Jangan tambah posisi</strong> kalau turun >7% dari entry tanpa konfirmasi volume.';
  exit+='</div>';
  return exit;
 }
 function render(code,f,chart){
  var box=document.getElementById('omOut');if(!box)return;
  var h='<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">';
  h+='<div style="font-family:var(--mono);font-size:2.4rem;font-weight:900;color:var(--'+f.col+');">'+f.score+'</div>';
  h+='<div><div style="font-weight:800;color:var(--'+f.col+');font-size:1.05rem;">'+f.verdict+'</div>';
  h+='<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">Untuk dipegang 20-25 hari trading</div></div></div>';
  h+='<div style="margin-bottom:10px;">';
  for(var i=0;i<f.reasons.length;i++){
   var r=f.reasons[i];
   h+='<div style="font-size:0.78rem;padding:4px 0;border-bottom:1px dashed rgba(255,255,255,.05);">';
   h+='<span style="margin-right:6px;">'+(r.ok?'✅':'❌')+'</span>'+r.txt+'</div>';
  }
  h+='</div>';
  h+='<div style="font-size:0.72rem;font-weight:800;color:#fff;margin-top:8px;">📈 Performa 60 hari vs IHSG</div>';
  h+=chart;
  h+=exitPlan(f);
  h+='<div style="font-size:0.64rem;color:#64748b;margin-top:10px;">Forecast probabilistik dari tren, momentum, volume, regime, & jejak bandar. Bukan ramalan pasti - selalu pakai SL & risiko 1-2% modal.</div>';
  box.innerHTML=h;
 }
 var trendEl=document.getElementById('valTrend');
 var obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(function(){
  var code=window.lastTicker;if(!code)return;
  var box=document.getElementById('omOut');if(box)box.innerHTML='<div class="skel-box" style="height:80px"></div>';
  SW.candle(code,'1y').then(function(candle){
   var f=forecast(code,candle);
   miniChart(code).then(function(chart){render(code,f,chart);}).catch(function(){render(code,f,'<div style="font-size:0.7rem;color:var(--text-muted);">Chart gagal dimuat</div>');});
  }).catch(function(e){if(box)box.innerHTML='<span style="color:var(--red);">Forecast gagal: '+esc(e.message)+'</span>';});
 },900);});
 if(trendEl)obs.observe(trendEl,{childList:true,characterData:true,subtree:true});
})();
/* END onemonth v1 */
