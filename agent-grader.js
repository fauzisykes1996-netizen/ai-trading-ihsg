/* agent-grader.js v2 - Setup Grader: menunggu agent lain siap dulu, baru membaca skor confluence 0-100 */
(function(){
 if(!window.P||!window.SW)return;
 var SW=window.SW;
 var anchor=document.getElementById('regimeOut')?document.getElementById('regimeOut').closest('.card'):(document.getElementById('moneyflowOut')?document.getElementById('moneyflowOut').closest('.card'):null);
 P.card('tab-analysis',
  '<div class="card-title"><span>🎯 Setup Grader</span><span class="agent-pill master">Confluence 0-100</span></div>'+
  '<div id="graderOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - semua sinyal digabung jadi satu skor keputusan.</div>',
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
  return {total:total,items:items};
 }
 function render(res){
  var box=document.getElementById('graderOut');if(!box)return;
  var s=res.total;
  var gr=s>=75?'A':s>=60?'B':s>=45?'C':'D';
  var verdict=s>=75?'AMBIL - setup berkualitas':s>=60?'BOLEH - disiplin ketat':s>=45?'LEWATI - kecuali konviksi khusus':'HINDARI - risiko dominan';
  var col=s>=75?'green':s>=60?'yellow':s>=45?'yellow':'red';
  var h='<div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">';
  h+='<div style="font-family:var(--mono);font-size:2.2rem;font-weight:900;color:var(--'+col+');">'+s+'</div>';
  h+='<div><div style="font-weight:800;color:var(--'+col+');font-size:1rem;">PERINGKAT '+gr+' - '+verdict+'</div>';
  h+='<div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">Skor confluence 0-100 dari 7 komponen</div></div></div>';
  for(var i=0;i<res.items.length;i++){
   var it=res.items[i];
   var ic=it.ok?'✅':it.warn?'⚠️':'❌';
   h+='<div style="display:flex;justify-content:space-between;font-size:0.74rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);">';
   h+='<span>'+ic+' '+it.lab+' <span style="color:var(--text-muted);font-size:0.66rem;">('+it.note+')</span></span>';
   h+='<span style="font-family:var(--mono);font-weight:700;">'+it.pts+'/'+it.max+'</span></div>';
  }
  h+='<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">Skor tinggi = banyak sinyal searah. Tetap patuhi SL & risiko 1-2%. Skor bukan jaminan.</div>';
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
/* END agent-grader v2 */
