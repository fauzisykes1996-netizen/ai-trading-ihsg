/* agent-bandar.js v3 - Tape Reader mandiri + kurva akumulasi/distribusi kumulatif 20 hari */
(function(){
if(!window.P)return;
function arraysL(candle){var q=candle.indicators.quote[0];var c=[],h=[],l=[],o=[];for(var i=0;i<q.close.length;i++){if(q.close[i]==null||q.open[i]==null)continue;c.push(q.close[i]);h.push(q.high[i]);l.push(q.low[i]);o.push(q.open[i]);}return {c:c,h:h,l:l,o:o};}
function volL(candle){var q=candle.indicators.quote[0];var v=[];for(var i=0;i<q.close.length;i++){if(q.close[i]==null||q.open[i]==null)continue;v.push(q.volume?q.volume[i]:0);}return v;}
function smaL(a,p){var o=new Array(a.length).fill(null);var s=0;for(var i=0;i<a.length;i++){s+=a[i];if(i>=p)s-=a[i-p];if(i>=p-1)o[i]=s/p;}return o;}
function candleL(code){var cc=loadCache(code);if(cc&&cc.json)return Promise.resolve(cc.json.chart.result[0]);return fetchChart(code+'.JK','1y').then(function(j){return j.chart.result[0];});}
function cumCurve(A,vol){
var n=A.c.length;var out=[];var cum=0;
var start=n-20;
for(var i=start;i<n;i++){
var dir=0;
if(i>0&&A.c[i]>A.c[i-1])dir=1;
if(i>0&&A.c[i]<A.c[i-1])dir=-1;
cum+=dir*(vol[i]||0);
out.push(cum);
}
var avg=0;for(var k=start;k<n;k++)avg+=vol[k];avg/=20;
var norm=avg>0?cum/avg:0;
return {series:out,norm:norm};
}
function cumLabel(norm){
if(norm>=6)return 'AKUMULASI 20 HARI KUAT';
if(norm>=2)return 'AKUMULASI BERTAHAP';
if(norm<=-6)return 'DISTRIBUSI 20 HARI';
if(norm<=-2)return 'DISTRIBUSI TIPIS';
return 'NETRAL 20 HARI';
}
function spark(series){
var W=240,H=50,pad=4;
var min=Math.min.apply(null,series);var max=Math.max.apply(null,series);
var span=(max-min)||1;
var d='';
for(var i=0;i<series.length;i++){
var x=pad+(i/(series.length-1))*(W-2*pad);
var y=H-pad-((series[i]-min)/span)*(H-2*pad);
d+=(i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1)+' ';
}
var col=series[series.length-1]>=0?'#22c55e':'#ef4444';
return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:50px;display:block;margin-top:6px;"><path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round"/></svg>';
}
function analyze(code,candle){
var A=arraysL(candle);var vol=volL(candle);var n=A.c.length;
if(n<20)return{signal:'Data tidak cukup',detail:'Minimal 20 hari data diperlukan.',strength:0,volRatio:0,priceChange:0,aboveMA:false,recentTrend:'',norm:0,series:null};
if(vol.length<20)return{signal:'Data volume tidak lengkap',detail:'Data volume tidak mencukupi untuk analisis.',strength:0,volRatio:0,priceChange:0,aboveMA:false,recentTrend:'',norm:0,series:null};
var volAvg20=0;for(var i=vol.length-20;i<vol.length;i++)volAvg20+=vol[i];volAvg20/=20;
var volLast=vol[vol.length-1];var volRatio=volAvg20>0?volLast/volAvg20:0;
var priceLast=A.c[n-1],pricePrev=A.c[n-2];var priceChange=(priceLast-pricePrev)/pricePrev*100;
var ma20=smaL(A.c,20)[n-1];var aboveMA=ma20!=null?priceLast>ma20:false;
var signal,detail,strength;
if(volRatio>=1.5&&priceChange>0&&aboveMA){signal='AKUMULASI KUAT';detail='Volume '+volRatio.toFixed(1)+'x rata-rata, harga naik '+priceChange.toFixed(1)+'%, di atas MA20. Indikasi bandar masuk.';strength=3;}
else if(volRatio>=1.3&&priceChange>0){signal='AKUMULASI SEDANG';detail='Volume '+volRatio.toFixed(1)+'x rata-rata, harga naik '+priceChange.toFixed(1)+'%. Kemungkinan akumulasi.';strength=2;}
else if(volRatio>=1.5&&priceChange<0){signal='DISTRIBUSI';detail='Volume '+volRatio.toFixed(1)+'x rata-rata tapi harga turun '+priceChange.toFixed(1)+'%. Indikasi bandar keluar.';strength=-2;}
else if(volRatio<0.7&&Math.abs(priceChange)<1){signal='KONSOLIDASI';detail='Volume rendah ('+volRatio.toFixed(1)+'x), harga stabil. Bandar menunggu momentum.';strength=0;}
else{signal='NETRAL';detail='Pola volume & harga harian tidak menunjukkan sinyal jelas.';strength=0;}
var cc=cumCurve(A,vol);
var cl=cumLabel(cc.norm);
if(signal==='NETRAL'&&cc.norm>=2)detail+=' Namun kurva 20 hari: '+cl+' (konfirmasi akumulasi bertahap).';
if(signal==='NETRAL'&&cc.norm<=-2)detail+=' Namun kurva 20 hari: '+cl+' (waspada distribusi terselubung).';
var upDays=0;for(var j=n-5;j<n;j++){if(A.c[j]>A.c[j-1])upDays++;}
var recentTrend='';
if(upDays>=4)recentTrend='4-5 hari naik berturut-turut (momentum kuat).';
else if(upDays>=3)recentTrend='3 hari naik dari 5 hari terakhir.';
else if(upDays<=1)recentTrend='Mayoritas turun 5 hari terakhir.';
return{signal:signal,detail:detail,strength:strength,volRatio:volRatio,priceChange:priceChange,aboveMA:aboveMA,recentTrend:recentTrend,norm:cc.norm,series:cc.series,cumLabel:cl};
}
function renderResult(result){
var box=document.getElementById('bandarOut');if(!box)return;
var color=result.strength>0?'green':(result.strength<0?'red':'yellow');
var html='<div style="font-weight:800;color:var(--'+color+');font-size:0.9rem;margin-bottom:6px;">'+result.signal+'</div>';
html+='<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">'+result.detail+'</div>';
if(result.series){
var ccol=result.norm>=2?'green':(result.norm<=-2?'red':'yellow');
html+='<div style="font-size:0.72rem;font-weight:800;color:var('+ccol+');margin-bottom:2px;">📈 Kurva 20 hari: '+result.cumLabel+' ('+(result.norm>=0?'+':'')+result.norm.toFixed(1)+'x vol rata-rata)</div>';
html+=spark(result.series);
}
html+='<div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;">Volume: '+result.volRatio.toFixed(1)+'x rata-rata • Perubahan: '+(result.priceChange>=0?'+':'')+result.priceChange.toFixed(1)+'% • '+(result.aboveMA?'Di atas MA20':'Di bawah MA20')+'</div>';
if(result.recentTrend)html+='<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">'+result.recentTrend+'</div>';
box.innerHTML=html;
window.BANDAR_LAST=result;
}
function runFor(code){
var box=document.getElementById('bandarOut');if(!box)return;
box.innerHTML='<div class="skel-box" style="height:60px"></div>';
candleL(code).then(function(candle){renderResult(analyze(code,candle));}).catch(function(e){box.innerHTML='<span style="color:var(--red);">Analisis gagal: '+esc(e.message)+'</span>';});
}
function startObs(){
var trendEl=document.getElementById('valTrend');
if(!trendEl){setTimeout(startObs,800);return;}
var obs=new MutationObserver(function(){clearTimeout(obs._t);obs._t=setTimeout(function(){var c=window.lastTicker;if(c)runFor(c);},700);});
obs.observe(trendEl,{childList:true,characterData:true,subtree:true});
}
function mount(){
var tab=document.getElementById('tab-analysis');
if(!tab){setTimeout(mount,800);return;}
if(document.getElementById('bandarOut')){startObs();return;}
var anchorEl=document.getElementById('trendDash')?document.getElementById('trendDash').closest('.card'):null;
P.card('tab-analysis',
'<div class="card-title"><span>🕵️ Agent Tape Reader (Bandar)</span><span class="agent-pill tech">Akumulasi/Distribusi</span></div>'+
'<div id="bandarOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - jejak bandar harian + kurva akumulasi kumulatif 20 hari.</div>',
anchorEl);
startObs();
}
mount();
})();
/* END agent-bandar v3 */
