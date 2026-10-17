/* shortlist.js - Morning Shortlist: skor cepat watchlist -> top kandidat harian */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var tab=document.getElementById('tab-market');
 var anchor=tab?tab.querySelector('.card'):null;
 P.card('tab-market',
  '<div class="card-title"><span>🎯 Morning Shortlist</span><span class="agent-pill tech">Top Kandidat Harian</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="slBtn" onclick="runShortlist()">🎯 Susun Shortlist Pagi</button>'+
  '<div id="slNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Skor cepat 0-100 (tren + RSI + volume + relative strength vs IHSG) untuk watchlist Anda. Ketuk baris = kode terisi & Proses otomatis.</div>'+
  '<div id="slOut" class="hidden" style="margin-top:10px;"></div>',anchor);
 function getWatch(){
  var src=Array.isArray(window.watchlist)&&window.watchlist.length?window.watchlist:lsJSON('ihsg_watchlist',[]);
  var out=[];
  for(var i=0;i<src.length;i++){var w=src[i];var c=typeof w==='string'?w:(w.t||w.code||'');if(c)out.push(c.toUpperCase());}
  if(!out.length)out=["BBCA","BBRI","TLKM","ASII","ANTM","PGEO","AMMN","MDKA","KLBF","ICBP"];
  return out.filter(function(v,i,s){return s.indexOf(v)===i;}).slice(0,20);
 }
 function score(A,ihsgRet20){
  var n=A.c.length;if(n<60)return null;
  var ma20=SW.sma(A.c,20),ma50=SW.sma(A.c,50),rsi=SW.rsi(A.c,14);
  var m20=ma20[n-1],m50=ma50[n-1],price=A.c[n-1];
  var slope=(m20!=null&&ma20[n-6]!=null&&ma20[n-6]!==0)?(m20-ma20[n-6])/ma20[n-6]*100:0;
  var t=0;if(price>m20)t+=10;if(m20>m50)t+=10;if(slope>0.3)t+=10;
  var r=rsi[n-1];var rs=0;
  if(r>=45&&r<=65)rs=20;else if(r>65&&r<=72)rs=12;else if(r>=38&&r<45)rs=10;else rs=4;
  var q=null;var vol=[];
  var vsum=0;for(var k=n-21;k<n-1;k++)vsum+=A.o[k];
  var vs=0;
  var ret20=(A.c[n-1]/A.c[n-21]-1)*100;
  var vsc=8;
  var chg=(A.c[n-1]-A.c[n-2])/A.c[n-2]*100;
  if(chg>0&&chg<6)vsc=20;else if(chg<0&&chg>-2)vsc=15;
  var rel=ret20-ihsgRet20;var rsc=0;
  if(rel>3)rsc=30;else if(rel>0)rsc=20;else if(rel>-3)rsc=10;else rsc=0;
  return {score:t+rs+vsc+rsc,ret20:ret20,rel:rel,rsi:r};
 }
 window.runShortlist=async function(){
  var btn=document.getElementById('slBtn');btn.disabled=true;btn.innerText='Menyusun shortlist...';
  var out=document.getElementById('slOut');out.classList.remove('hidden');out.innerHTML='<div class="skel-box" style="height:70px"></div>';
  try{
   var ij=await fetchChart('^JKSE','1y');var IA=SW.arrays(ij.chart.result[0]);
   var ihsgRet20=(IA.c[IA.c.length-1]/IA.c[IA.c.length-21]-1)*100;
   var watch=getWatch();
   var settled=await Promise.allSettled(watch.map(function(c){return SW.candle(c,'1y');}));
   var rows=[];
   settled.forEach(function(res,i){
    if(res.status!=='fulfilled')return;
    var A=SW.arrays(res.value);var s=score(A,ihsgRet20);
    if(s)rows.push({code:watch[i],score:s.score,rel:s.rel,rsi:s.rsi});
   });
   rows.sort(function(a,b){return b.score-a.score;});
   rows=rows.slice(0,8);
   window.__slRows=rows;
   var h='';
   for(var i=0;i<rows.length;i++){
    var r=rows[i];
    var col=r.score>=70?'green':(r.score>=50?'yellow':'red');
    h+='<div class="mkt-row" style="cursor:pointer;" onclick="slPick('+i+')">';
    h+='<span><strong>'+r.code+'</strong> <span style="color:var(--text-muted);font-size:0.68rem;">RSI '+r.rsi.toFixed(0)+' - RS vs IHSG '+(r.rel>=0?'+':'')+r.rel.toFixed(1)+'%</span></span>';
    h+='<span style="font-family:var(--mono);font-weight:900;font-size:1rem;" class="'+col+'">'+r.score+'</span></div>';
   }
   if(!rows.length)h='<div style="color:var(--yellow);font-size:0.8rem;">Watchlist kosong atau data belum siap.</div>';
   h+='<div class="src-note">Skor >=70 = kandidat utama hari ini. Shortlist adalah penyaring perhatian, bukan sinyal beli - konfirmasi lewat Grader & Swing Plan.</div>';
   out.innerHTML=h;
   note('Diperbarui '+new Date().toLocaleTimeString('id-ID')+' - IHSG 20h '+(ihsgRet20>=0?'+':'')+ihsgRet20.toFixed(1)+'%');
  }catch(e){out.innerHTML='<div style="color:var(--red);">Shortlist gagal: '+esc(e.message)+'</div>';}
  finally{btn.disabled=false;btn.innerText='🎯 Susun Shortlist Pagi';}
 };
 function note(t){var e=document.getElementById('slNote');if(e)e.innerText=t;}
 window.slPick=function(i){
  var r=(window.__slRows||[])[i];if(!r)return;
  switchTab('analysis');
  setTimeout(function(){
   var inp=document.querySelector('input[placeholder*="KODE SAHAM"]');
   if(inp)inp.value=r.code;
   var btns=document.querySelectorAll('button');
   for(var b=0;b<btns.length;b++){if((btns[b].innerText||'').trim()==='Proses'){btns[b].click();break;}}
  },350);
 };
})();
/* END shortlist v1 */
