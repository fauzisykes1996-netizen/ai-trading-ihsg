/* usmarket.js - US Market Pack: saham AS via prefix US:, tanpa menyentuh core */
(function(){
 if(!window.P)return;
 function isUS(c){return String(c||'').indexOf('US:')===0;}
 window.isUSCode=isUS;

 var origFetch=window.fetchChart;
 window.fetchChart=function(sym,range,interval){
  var s=String(sym);
  if(s.indexOf('US:')===0){s=s.slice(3);if(s.slice(-3)==='.JK')s=s.slice(0,-3);}
  else if(s.slice(-3)==='.JK'&&isUS(s.slice(0,-3))){s=s.slice(0,-3);}
  if(s==='^JKSE'&&window.lastTicker&&isUS(window.lastTicker))s='^GSPC';
  return origFetch(s,range,interval);
 };

 var origTV=window.tvSnapshot;
 if(origTV){
  window.tvSnapshot=async function(code){
   if(!isUS(code))return origTV(code);
   try{
    var j=await origFetch(code.slice(3),'5d');
    var r=j&&j.chart&&j.chart.result&&j.chart.result[0];
    var m=r&&r.meta;
    if(m&&m.regularMarketPrice){
     var prev=m.chartPreviousClose||m.regularMarketPrice;
     return{price:m.regularMarketPrice,chg:((m.regularMarketPrice-prev)/prev)*100,name:m.shortName||m.longName||code};
    }
   }catch(e){}
   return{price:null};
  };
 }

 var origRp=window.rp;
 if(origRp){
  window.rp=function(v){
   if(window.lastTicker&&isUS(window.lastTicker))return '$'+Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
   return origRp(v);
  };
 }

 var mTab=document.getElementById('tab-market');
 var mAnchor=mTab?mTab.querySelector('.card'):null;
 P.card('tab-market',
  '<div class="card-title"><span>🗽 Pasar Amerika</span><span class="agent-pill tech">Prefix US:</span></div>'+
  '<div id="usClock" style="font-size:0.8rem;color:var(--text-muted);">Memuat jam bursa NYSE...</div>'+
  '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">'+
  ['US:AAPL','US:MSFT','US:NVDA','US:TSLA','US:AMZN','US:GOOGL','US:META','US:AMD','US:NFLX','US:COIN'].map(function(c){return '<button class="btn-mini" onclick="usGo(\''+c+'\')">'+c.slice(3)+'</button>';}).join('')+
  '</div>'+
  '<div class="src-note">Ketik kode dengan prefix US: (contoh US:AAPL) di kolom Proses. Harga tampil dalam $, acuan regime & RS otomatis S&P 500.</div>',mAnchor);

 function nyNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/New_York'}));}
 function tickClock(){
  var box=document.getElementById('usClock');if(!box)return;
  var d=nyNow();var mins=d.getHours()*60+d.getMinutes();var day=d.getDay();
  var st,col;
  if(day===0||day===6){st='AKHIR PEKAN - bursa AS tutup';col='yellow';}
  else if(mins>=570&&mins<960){st='SESI BERJALAN (NYSE 09:30-16:00 waktu NY)';col='green';}
  else if(mins>=240&&mins<570){st='PRE-MARKET AS - tunggu pembukaan';col='yellow';}
  else if(mins>=960&&mins<1200){st='AFTER HOURS AS';col='yellow';}
  else{st='BURSA AS TUTUP - buka 20:30 / 21:30 WIB';col='red';}
  box.innerHTML='<span style="color:var(--'+col+');font-weight:700;">'+st+'</span><br><span style="font-size:0.7rem;">Waktu NY sekarang: '+d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+'</span>';
 }
 tickClock();setInterval(tickClock,60000);

 window.usGo=function(c){
  switchTab('analysis');
  setTimeout(function(){
   var inp=document.querySelector('input[placeholder*="KODE SAHAM"]');
   if(inp)inp.value=c;
   var bs=document.querySelectorAll('button');
   for(var i=0;i<bs.length;i++){if((bs[i].innerText||'').trim()==='Proses'){bs[i].click();break;}}
  },300);
 };

 var aTab=document.getElementById('tab-analysis');
 var aAnchor=document.getElementById('graderOut')?document.getElementById('graderOut').closest('.card'):null;
 P.card('tab-analysis',
  '<div class="card-title"><span>🗽 Kalkulator Posisi US</span><span class="agent-pill tech">Saham, bukan lot</span></div>'+
  '<div class="metric-grid" style="margin-bottom:8px;">'+
  '<div class="metric-box"><div class="metric-label">Modal ($)</div><input type="text" inputmode="decimal" class="fv-input" id="usCap" placeholder="10000"></div>'+
  '<div class="metric-box"><div class="metric-label">Risiko (%)</div><input type="text" inputmode="decimal" class="fv-input" id="usRisk" value="1"></div>'+
  '<div class="metric-box"><div class="metric-label">Entry ($)</div><input type="text" inputmode="decimal" class="fv-input" id="usEntry" placeholder="150.00"></div>'+
  '<div class="metric-box"><div class="metric-label">Stop Loss ($)</div><input type="text" inputmode="decimal" class="fv-input" id="usSl" placeholder="145.00"></div>'+
  '</div>'+
  '<button class="btn-copy" style="margin-top:0;" onclick="calcUS()">🗽 Hitung Jumlah Saham</button>'+
  '<div id="usOut" class="report-card hidden" style="margin-top:8px;"></div>',aAnchor);

 window.calcUS=function(){
  var cap=parseFloat((document.getElementById('usCap').value||'').replace(',','.'))||0;
  var risk=parseFloat((document.getElementById('usRisk').value||'').replace(',','.'))||0;
  var entry=parseFloat((document.getElementById('usEntry').value||'').replace(',','.'))||0;
  var sl=parseFloat((document.getElementById('usSl').value||'').replace(',','.'))||0;
  var out=document.getElementById('usOut');out.classList.remove('hidden');
  if(!cap||!risk||!entry||!sl||entry<=sl){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Isi modal, risiko, entry & SL dengan benar (entry harus di atas SL).</div>';return;}
  var budget=cap*risk/100;
  var per=entry-sl;
  var shares=Math.floor(budget/per);
  var cost=shares*entry;
  if(cost>cap)shares=Math.floor(cap/entry);
  cost=shares*entry;
  var h='<div class="metric-grid">';
  h+='<div class="metric-box"><div class="metric-label">Jumlah saham</div><div class="metric-value green">'+shares.toLocaleString('id-ID')+' lbr</div></div>';
  h+='<div class="metric-box"><div class="metric-label">Nilai posisi</div><div class="metric-value">$'+cost.toLocaleString('en-US',{maximumFractionDigits:0})+'</div></div>';
  h+='<div class="metric-box"><div class="metric-label">Risiko bila SL kena</div><div class="metric-value red">$'+(shares*per).toLocaleString('en-US',{maximumFractionDigits:0})+' ('+risk+'%)</div></div>';
  h+='<div class="metric-box"><div class="metric-label">Sisa kas</div><div class="metric-value">$'+(cap-cost).toLocaleString('en-US',{maximumFractionDigits:0})+'</div></div>';
  h+='</div>';
  h+='<div style="font-size:0.66rem;color:#64748b;margin-top:8px;">US tanpa lot: 1 saham = 1 lembar. Broker US umumnya tanpa komisi, jadi biaya round-trip hampir nol.</div>';
  out.innerHTML=h;
 };
})();
/* END usmarket v1 */
