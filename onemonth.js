/* onemonth.js v3 - One-Month Forecast: analog historis + pita skenario optimis/basis/pesimis */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var anchor=null;
var gEl=document.getElementById('graderOut');
if(gEl)anchor=gEl.closest('.card');
if(!anchor){var rEl=document.getElementById('regimeOut');if(rEl)anchor=rEl.closest('.card');}
P.card('tab-analysis','<div class="card-title"><span>📅 One-Month Forecast</span><span class="agent-pill master">Pegang 1 Bulan?</span></div><div id="omOut" style="font-size:0.8rem;color:var(--text-muted);">Proses saham - skor 0-100 + analog historis + pita skenario harga 20 hari.</div>',anchor);
function domUpper(id){var e=document.getElementById(id);return e?(e.innerText||'').toUpperCase():'';}
function pctOf(arr,p){var i=Math.floor((arr.length-1)*p);return arr[i];}
function analog(candle){
var q=candle.indicators.quote[0];
var c=[];var v=[];
for(var i=0;i<q.close.length;i++){if(q.close[i]==null)continue;c.push(q.close[i]);v.push(q.volume?q.volume[i]:0);}
var n=c.length;
if(n<150)return null;
var ma50=SW.sma(c,50);var ma100=SW.sma(c,100);var rsi=SW.rsi(c,14);
function buck(i){
if(i<120)return null;
if(ma50[i]==null||ma100[i]==null||ma50[i-5]==null||ma50[i-5]===0)return null;
var tr=0;
if(c[i]>ma50[i]&&ma50[i]>ma100[i])tr=2;
else if(c[i]>ma50[i])tr=1;
var slope=(ma50[i]-ma50[i-5])/ma50[i-5]*100;
var sl=0;
if(slope>0.3)sl=1;
if(slope<-0.3)sl=-1;
var rs=-1;
if(rsi[i]>=60)rs=2;
else if(rsi[i]>=45)rs=1;
else if(rsi[i]>=35)rs=0;
var avg=0;var cnt=0;
for(var k=i-20;k<i;k++){if(k>=0){avg+=v[k];cnt++;}}
if(cnt===0)return null;
avg/=cnt;
var vr=-1;
if(avg>0){var ratio=v[i]/avg;if(ratio>=1.3)vr=1;if(ratio>=0.8&&ratio<1.3)vr=0;}
return {tr:tr,sl:sl,rs:rs,vr:vr};
}
var cur=buck(n-1);
if(!cur)return null;
var fwd=[];
for(var i2=120;i2<=n-21;i2++){
var b=buck(i2);
if(!b)continue;
if(b.tr===cur.tr&&b.sl===cur.sl&&b.rs===cur.rs&&b.vr===cur.vr)fwd.push((c[i2+20]/c[i2]-1)*100);
}
if(fwd.length<6)return null;
fwd.sort(function(a,b){return a-b;});
var w=0;var sum=0;
for(var f=0;f<fwd.length;f++){if(fwd[f]>0)w++;sum+=fwd[f];}
var med=fwd[Math.floor(fwd.length/2)];
return {n:fwd.length,wr:w/fwd.length*100,med:med,worst:fwd[0],p25:pctOf(fwd,0.25),p75:pctOf(fwd,0.75)};
}
function forecast(code,candle){
var A=SW.arrays(candle);var n=A.c.length;
var reasons=[];var score=0;
var ma50=SW.sma(A.c,50),ma100=SW.sma(A.c,100);
var m50=ma50[n-1],m100=ma100[n-1],price=A.c[n-1];
var slope50=(m50!=null&&ma50[n-6]!=null&&ma50[n-6]!==0)?(m50-ma50[n-6])/ma50[n-6]*100:0;
if(price>m50&&m50>m100){score+=15;reasons.push({ok:true,txt:'Tren menengah sehat: harga > MA50 > MA100'});}
else if(price>m50){score+=8;reasons.push({ok:false,txt:'Harga di atas MA50 tapi MA100 belum tertembus'});}
else{reasons.push({ok:false,txt:'Harga di bawah MA50 - tren menengah lemah'});}
if(slope50>1){score+=10;reasons.push({ok:true,txt:'MA50 menanjak kuat ('+slope50.toFixed(1)+'% / 5 hari)'});}
else if(slope50>0){score+=5;}
else{reasons.push({ok:false,txt:'MA50 datar/menurun - belum ada tenaga naik'});}
var ret60=n>=61?((price/A.c[n-61])-1)*100:0;
score+=10;
if(ret60>10){score+=10;reasons.push({ok:true,txt:'Momentum 60 hari kuat: '+(ret60>=0?'+':'')+ret60.toFixed(1)+'%'});}
else if(ret60>0){score+=5;reasons.push({ok:false,txt:'Momentum 60 hari positif tapi lemah: +'+ret60.toFixed(1)+'%'});}
else{score-=3;reasons.push({ok:false,txt:'Momentum 60 hari negatif: '+ret60.toFixed(1)+'%'});}
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
var rg=domUpper('regimeOut');
if(rg.indexOf('BULLISH')>=0&&rg.indexOf('NETRAL-BULLISH')<0){score+=15;reasons.push({ok:true,txt:'Pasar mendukung (regime bullish)'});}
else if(rg.indexOf('NETRAL-BULLISH')>=0){score+=10;reasons.push({ok:true,txt:'Pasar netral-bullish - masih layak'});}
else if(rg.indexOf('BEARISH')>=0){reasons.push({ok:false,txt:'Pasar bearish - risiko tinggi untuk hold 1 bulan'});}
else if(rg.indexOf('CAMPURAN')>=0){score+=4;reasons.push({ok:false,txt:'Pasar campuran - setup harus sangat bagus'});}
var bt=domUpper('bandarOut');
if(bt.indexOf('AKUMULASI KUAT')>=0){score+=15;reasons.push({ok:true,txt:'Bandar akumulasi kuat (jejak institusi positif)'});}
else if(bt.indexOf('AKUMULASI SEDANG')>=0){score+=10;reasons.push({ok:true,txt:'Ada jejak akumulasi'});}
else if(bt.indexOf('DISTRIBUSI')>=0){score-=5;reasons.push({ok:false,txt:'Bandar distribusi - hati-hati'});}
var mf=domUpper('moneyflowOut');
if(mf.indexOf('SANGAT KUAT')>=0){score+=5;reasons.push({ok:true,txt:'Aliran dana masuk deras'});}
else if(mf.indexOf('KUAT')>=0){score+=5;reasons.push({ok:true,txt:'Aliran dana positif'});}
else if(mf.indexOf('LEMAH')>=0){score-=3;reasons.push({ok:false,txt:'Aliran dana keluar'});}
var an=analog(candle);
if(an){
if(an.wr>=60&&an.med>0){score+=10;reasons.push({ok:true,txt:'📚 Analog historis mendukung: '+an.n+' kasus serupa, win rate '+an.wr.toFixed(0)+'%, median '+(an.med>=0?'+':'')+an.med.toFixed(1)+'%'});}
else if(an.wr>=50){score+=5;reasons.push({ok:false,txt:'📚 Analog historis netral: '+an.n+' kasus, win rate '+an.wr.toFixed(0)+'%'});}
else{reasons.push({ok:false,txt:'📚 Analog historis lemah: '+an.n+' kasus, win rate hanya '+an.wr.toFixed(0)+'%'});}
}
score=Math.max(0,Math.min(100,score));
var verdict,col;
if(score>=75){verdict='LAYAK 1 BULAN';col='green';}
else if(score>=60){verdict='BOLEH DENGAN HATI-HATI';col='yellow';}
else{verdict='HINDARI';col='red';}
return {score:score,verdict:verdict,col:col,reasons:reasons,an:an,m50:m50,price:price};
}
function miniChart(code){
return SW.candle(code,'1y').then(function(candle){
return fetchChart('^JKSE','1y').then(function(ij){
var A=SW.arrays(candle);var IA=SW.arrays(ij.chart.result[0]);
var L=Math.min(A.c.length,IA.c.length,60);
var sRet=[],iRet=[];
var baseS=A.c[A.c.length-L],baseI=IA.c[IA.c.length-L];
for(var i=A.c.length-L;i<A.c.length;i++)sRet.push((A.c[i]/baseS-1)*100);
for(var j=IA.c.length-L;j<IA.c.length;j++)iRet.push((IA.c[j]/baseI-1)*100);
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
exit+='• Wajib keluar bila harga jebol '+sl.toLocaleString('id-ID')+' (breakdown MA50).<br>';
exit+='• Review mingguan: kalau 2 minggu tidak bergerak >=3%, pertimbangkan rotasi.<br>';
exit+='• Target 1 bulan: lihat pita skenario di atas (basis = target wajar).<br>';
exit+='• Jangan tambah posisi kalau turun >7% dari entry tanpa konfirmasi volume.';
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
if(f.an){
h+='<div style="font-size:0.74rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:8px;">📚 <strong>Analog historis:</strong> '+f.an.n+' kondisi serupa → win rate '+f.an.wr.toFixed(0)+'% • terburuk '+f.an.worst.toFixed(1)+'% (20 hari kemudian).</div>';
var L1=Math.round(f.price*(1+f.an.p75/100));
var L0=Math.round(f.price*(1+f.an.med/100));
var Lm=Math.round(f.price*(1+f.an.p25/100));
h+='<div style="font-size:0.74rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:8px;line-height:1.7;">📊 <strong>Pita skenario 20 hari:</strong><br>';
h+='🟢 Optimis (p75): Rp '+L1.toLocaleString('id-ID')+' ('+(f.an.p75>=0?'+':'')+f.an.p75.toFixed(1)+'%)<br>';
h+='⚪ Basis (median): Rp '+L0.toLocaleString('id-ID')+' ('+(f.an.med>=0?'+':'')+f.an.med.toFixed(1)+'%) = target wajar<br>';
h+='🔴 Pesimis (p25): Rp '+Lm.toLocaleString('id-ID')+' ('+(f.an.p25>=0?'+':'')+f.an.p25.toFixed(1)+'%) = acuan zona SL</div>';
}
h+='<div style="font-size:0.72rem;font-weight:800;color:#fff;margin-top:8px;">📈 Performa 60 hari vs IHSG</div>';
h+=chart;
h+=exitPlan(f);
h+='<div style="font-size:0.64rem;color:#64748b;margin-top:10px;">Forecast probabilistik + pita skenario dari bukti historis. Bukan ramalan pasti - selalu pakai SL & risiko 1-2% modal.</div>';
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
/* END onemonth v3 */
