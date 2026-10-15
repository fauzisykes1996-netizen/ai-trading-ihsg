/* agent-extras.js - 4 agent: Divergence + Relative Strength + Smart Money + Seasonality */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var base=document.getElementById('graderOut')?document.getElementById('graderOut').closest('.card'):null;
 P.card('tab-analysis','<div class="card-title"><span>⚡ Agent Divergence</span><span class="agent-pill tech">RSI + MACD</span></div><div id="divOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - deteksi divergence untuk timing entry/reversal.</div>',base);
 P.card('tab-analysis','<div class="card-title"><span>📈 Agent Relative Strength</span><span class="agent-pill tech">vs IHSG</span></div><div id="rsOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - kekuatan relatif vs IHSG.</div>',document.getElementById('divOut').closest('.card'));
 P.card('tab-analysis','<div class="card-title"><span>🧠 Agent Smart Money</span><span class="agent-pill tech">FVG / OB / Sweep</span></div><div id="smcOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - zona institusional.</div>',document.getElementById('rsOut').closest('.card'));
 P.card('tab-analysis','<div class="card-title"><span>📅 Agent Seasonality</span><span class="agent-pill tech">Pola Bulanan</span></div><div id="seasOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - statistik bulanan historis.</div>',document.getElementById('smcOut').closest('.card'));

 function swingLows(l,look){var p=[];for(var i=2;i<l.length-2;i++){if(i<l.length-look)continue;if(l[i]<=l[i-1]&&l[i]<=l[i-2]&&l[i]<=l[i+1]&&l[i]<=l[i+2])p.push(i);}return p;}
 function swingHighs(h,look){var p=[];for(var i=2;i<h.length-2;i++){if(i<h.length-look)continue;if(h[i]>=h[i-1]&&h[i]>=h[i-2]&&h[i]>=h[i+1]&&h[i]>=h[i+2])p.push(i);}return p;}
 function macdLine(c){var e12=SW.ema(c,12),e26=SW.ema(c,26);var m=[];for(var i=0;i<c.length;i++)m.push(e12[i]-e26[i]);return m;}
 function anDiv(candle){
  var A=SW.arrays(candle);var n=A.c.length;if(n<70)return{sig:'Data tidak cukup',det:'Minimal 70 hari.',cls:'yellow'};
  var rsi=SW.rsi(A.c,14);var macd=macdLine(A.c);var out=[];
  var lows=swingLows(A.l,60),highs=swingHighs(A.h,60);
  if(lows.length>=2){var a=lows[lows.length-2],b=lows[lows.length-1];
   if(A.l[b]<A.l[a]&&rsi[b]>rsi[a]+1)out.push('BULLISH (RSI): harga lower-low, RSI higher-low.');
   if(A.l[b]<A.l[a]&&macd[b]>macd[a])out.push('BULLISH (MACD).');}
  if(highs.length>=2){var a2=highs[highs.length-2],b2=highs[highs.length-1];
   if(A.h[b2]>A.h[a2]&&rsi[b2]<rsi[a2]-1)out.push('BEARISH (RSI): harga higher-high, RSI lower-high.');
   if(A.h[b2]>A.h[a2]&&macd[b2]<macd[a2])out.push('BEARISH (MACD).');}
  if(!out.length)return{sig:'TIDAK ADA DIVERGENCE',det:'Harga & oscillator searah - tren valid.',cls:'yellow'};
  var bull=out.join(' ').indexOf('BULLISH')>=0;
  return{sig:bull?'DIVERGENCE BULLISH':'DIVERGENCE BEARISH',det:out.join(' '),cls:bull?'green':'red'};
 }
 async function anRS(code,candle){
  var ij=await fetchChart('^JKSE','1y');var IA=SW.arrays(ij.chart.result[0]);
  var A=SW.arrays(candle);
  var L=Math.min(A.c.length,IA.c.length,60);
  var s20=(A.c[A.c.length-1]/A.c[A.c.length-1-20]-1)*100;
  var i20=(IA.c[IA.c.length-1]/IA.c[IA.c.length-1-20]-1)*100;
  var s60=(A.c[A.c.length-1]/A.c[A.c.length-1-60]-1)*100;
  var i60=(IA.c[IA.c.length-1]/IA.c[IA.c.length-1-60]-1)*100;
  var diff20=s20-i20,diff60=s60-i60;
  var lab,cls;
  if(diff20>3&&diff60>3){lab='LEADER KUAT';cls='green';}
  else if(diff20>0){lab='LEADER';cls='green';}
  else if(diff20>-3){lab='NETRAL';cls='yellow';}
  else{lab='LAGGARD';cls='red';}
  return{sig:lab,det:'20 hari: saham '+(s20>=0?'+':'')+s20.toFixed(1)+'% vs IHSG '+(i20>=0?'+':'')+i20.toFixed(1)+'% (selisih '+(diff20>=0?'+':'')+diff20.toFixed(1)+'%). 60 hari selisih '+(diff60>=0?'+':'')+diff60.toFixed(1)+'%.',cls:cls};
 }
 function anSMC(candle){
  var A=SW.arrays(candle);var n=A.c.length;if(n<40)return{sig:'Data tidak cukup',det:'',cls:'yellow'};
  var atr=SW.atr(A.h,A.l,A.c,14)[n-1]||0;var out=[];
  for(var i=n-1;i>=n-40;i--){
   if(i-2<0)break;
   if(A.l[i]>A.h[i-2]){out.push('FVG bullish zona '+Math.round(A.h[i-2]).toLocaleString('id-ID')+' - '+Math.round(A.l[i]).toLocaleString('id-ID'));break;}
  }
  for(var j=n-1;j>=n-40;j--){
   if(j-2<0)break;
   if(A.h[j]<A.l[j-2]){out.push('FVG bearish zona '+Math.round(A.h[j]).toLocaleString('id-ID')+' - '+Math.round(A.l[j-2]).toLocaleString('id-ID'));break;}
  }
  for(var k=n-2;k>=n-30;k--){
   if(k-1<0)break;
   var body=Math.abs(A.c[k]-A.o[k]);
   if(A.c[k]>A.o[k]&&body>1.2*atr&&A.c[k-1]<A.o[k-1]){out.push('Order Block bullish ~ '+Math.round(A.l[k-1]).toLocaleString('id-ID')+' - '+Math.round(A.h[k-1]).toLocaleString('id-ID'));break;}
  }
  var minPrev=Infinity;for(var m=n-11;m<n-1;m++)if(A.l[m]<minPrev)minPrev=A.l[m];
  if(A.l[n-1]<minPrev&&A.c[n-1]>A.l[n-2])out.push('Liquidity sweep low (bullish) terdeteksi.');
  var maxPrev=-Infinity;for(var m2=n-11;m2<n-1;m2++)if(A.h[m2]>maxPrev)maxPrev=A.h[m2];
  if(A.h[n-1]>maxPrev&&A.c[n-1]<A.h[n-2])out.push('Liquidity sweep high (bearish) terdeteksi.');
  if(!out.length)return{sig:'TIDAK ADA ZONA SMC',det:'Tidak ada FVG/OB/sweep signifikan 40 hari terakhir.',cls:'yellow'};
  return{sig:'ZONA SMART MONEY TERDETEKSI',det:out.join(' • '),cls:'green'};
 }
 async function anSeas(code){
  var j=await fetchChart(code+'.JK','5y');var r=j.chart.result[0];
  var ts=r.timestamp||[];var q=r.indicators.quote[0];var cl=q.close||[];
  var byM={};
  for(var i=1;i<cl.length&&i<ts.length;i++){
   if(cl[i]==null||cl[i-1]==null)continue;
   var d=new Date(ts[i]*1000);var mo=d.getMonth();
   var ret=(cl[i]-cl[i-1])/cl[i-1]*100;
   if(!byM[mo])byM[mo]={s:0,n:0,w:0};
   byM[mo].s+=ret;byM[mo].n++;if(ret>0)byM[mo].w++;
  }
  var names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  var best=null,worst=null,cur=null;var nowM=new Date().getMonth();
  for(var m=0;m<12;m++){
   var b=byM[m];if(!b||b.n<5)continue;
   var avg=b.s/b.n;var wr=b.w/b.n*100;
   var rec={m:m,avg:avg,wr:wr,n:b.n};
   if(!best||avg>best.avg)best=rec;
   if(!worst||avg<worst.avg)worst=rec;
   if(m===nowM)cur=rec;
  }
  if(!best)return{sig:'Data musiman tidak cukup',det:'',cls:'yellow'};
  var det='Bulan terbaik: '+names[best.m]+' ('+(best.avg>=0?'+':'')+best.avg.toFixed(2)+'%/hari, win '+best.wr.toFixed(0)+'%). Terburuk: '+names[worst.m]+' ('+(worst.avg>=0?'+':'')+worst.avg.toFixed(2)+'%).';
  if(cur)det+=' Bulan sekarang '+names[cur.m]+': historis '+(cur.avg>=0?'+':'')+cur.avg.toFixed(2)+'%/hari (win '+cur.wr.toFixed(0)+'%).';
  var cls=cur?(cur.avg>0?'green':'red'):'yellow';
  return{sig:cur?(cur.avg>0?'MUSIM MENDUKUNG':'MUSIM KURANG MENDUKUNG'):'POLA MUSIMAN',det:det,cls:cls};
 }
 function paint(id,res){
  var box=document.getElementById(id);if(!box)return;
  box.innerHTML='<div style="font-weight:800;color:var(--'+res.cls+');font-size:0.9rem;margin-bottom:6px;">'+res.sig+'</div><div style="font-size:0.76rem;color:var(--text-muted);">'+res.det+'</div>';
 }
 var trendEl=document.getElementById('valTrend');
 var obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(function(){
  var c=window.lastTicker;if(!c)return;
  ['divOut','rsOut','smcOut','seasOut'].forEach(function(id){var b=document.getElementById(id);if(b)b.innerHTML='<div class="skel-box" style="height:50px"></div>';});
  SW.candle(c,'1y').then(function(cd){
   paint('divOut',anDiv(cd));
   paint('smcOut',anSMC(cd));
   anRS(c,cd).then(function(r){paint('rsOut',r);}).catch(function(e){paint('rsOut',{sig:'Gagal',det:e.message,cls:'red'});});
   anSeas(c).then(function(r){paint('seasOut',r);}).catch(function(e){paint('seasOut',{sig:'Gagal',det:e.message,cls:'red'});});
  }).catch(function(e){paint('divOut',{sig:'Gagal',det:e.message,cls:'red'});});
 },900);});
 if(trendEl)obs.observe(trendEl,{childList:true,characterData:true,subtree:true});
})();
/* END agent-extras v1 */
