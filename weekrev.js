/* weekrev.js v3 - Review Mingguan: statistik + aturan pribadi + kurva ekuitas jurnal vs IHSG (ujian alpha) */
(function(){
if(!window.P)return;
var NL=String.fromCharCode(10);
var tab=document.getElementById('tab-jurnal');
var anchor=tab?tab.querySelector('.card'):null;
P.card('tab-jurnal',
'<div class="card-title"><span>📆 Review Mingguan AI</span><span class="agent-pill master">Jurnal jadi Insight</span></div>'+
'<button class="btn-copy" style="margin-top:0;" id="wrBtn" onclick="runWeekRev()">📆 Review Minggu Ini</button>'+
'<div id="wrOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Statistik 7 hari + kurva ekuitas jurnal vs IHSG + narasi AI + aturan pribadi yang aktif di Grader.</div>',anchor);
function getJournal(){
var J=window.journal;
if(Array.isArray(J))return J;
return lsJSON('ihsg_journal',[]);
}
function weekList(){
var cut=Date.now()-7*86400000;var list=[];
var J=getJournal();
for(var i=0;i<J.length;i++){var e=J[i];if(e.outcome==null)continue;if(e.d>=cut)list.push(e);}
return list;
}
function compute(list){
var n=list.length;if(!n)return null;
var w=0,sum=0,best=null,worst=null,bySetup={};
var wins=[],losses=[];
for(var i=0;i<n;i++){
var e=list[i];var o=e.outcome;sum+=o;
if(o>0){w++;wins.push(o);}else losses.push(o);
if(!best||o>best.o)best={t:e.t,o:o};
if(!worst||o<worst.o)worst={t:e.t,o:o};
var k=e.setup||'tanpa-tag';
if(!bySetup[k])bySetup[k]={n:0,w:0,s:0};
bySetup[k].n++;if(o>0)bySetup[k].w++;bySetup[k].s+=o;
}
var avgW=wins.length?wins.reduce(function(a,b){return a+b;},0)/wins.length:0;
var avgL=losses.length?losses.reduce(function(a,b){return a+b;},0)/losses.length:0;
var payoff=avgL!==0?Math.abs(avgW/avgL):0;
return{n:n,wr:w/n*100,avg:sum/n,best:best,worst:worst,bySetup:bySetup,avgW:avgW,avgL:avgL,payoff:payoff};
}
async function equityCurve(){
var J=[];
var all=getJournal();
for(var i=0;i<all.length;i++){if(all[i].outcome!=null&&all[i].d)J.push(all[i]);}
J.sort(function(a,b){return a.d-b.d;});
if(J.length<5)return null;
var ij=await fetchChart('^JKSE','1y');
var r=ij.chart.result[0];
var ts=r.timestamp;var cl=r.indicators.quote[0].close;
function ihsgAt(d){
var best=0;
for(var k=0;k<ts.length;k++){if(ts[k]*1000<=d)best=k;else break;}
return cl[best];
}
var base=ihsgAt(J[0].d);
if(!base)return null;
var you=[];var mkt=[];var cum=0;
for(var j=0;j<J.length;j++){
cum+=J[j].outcome;
you.push(cum);
var m=(ihsgAt(J[j].d)-base)/base*100;
mkt.push(m);
}
var alpha=cum-mkt[mkt.length-1];
return {you:you,mkt:mkt,n:J.length,alpha:alpha};
}
function eqSvg(you,mkt){
var W=280,H=80,pad=6;
var all=you.concat(mkt);
var min=Math.min.apply(null,all);var max=Math.max.apply(null,all);
var span=(max-min)||1;
function X(i,n){return pad+(i/(n-1))*(W-2*pad);}
function Y(v){return H-pad-((v-min)/span)*(H-2*pad);}
function path(arr,col){var d='';for(var k=0;k<arr.length;k++)d+=(k===0?'M':'L')+X(k,arr.length).toFixed(1)+','+Y(arr[k]).toFixed(1)+' ';return '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round"/>';}
var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:80px;display:block;margin-top:4px;">';
s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="rgba(255,255,255,.12)" stroke-dasharray="3 3"/>';
s+=path(mkt,'#64748b');
s+=path(you,'#22c55e');
s+='<text x="'+(W-pad)+'" y="'+(Y(you[you.length-1])-3).toFixed(1)+'" fill="#22c55e" font-size="7" text-anchor="end">Anda '+(you[you.length-1]>=0?'+':'')+you[you.length-1].toFixed(1)+'%</text>';
s+='<text x="'+(W-pad)+'" y="'+(Y(mkt[mkt.length-1])+9).toFixed(1)+'" fill="#64748b" font-size="7" text-anchor="end">IHSG '+(mkt[mkt.length-1]>=0?'+':'')+mkt[mkt.length-1].toFixed(1)+'%</text>';
s+='</svg>';
return s;
}
function extractRules(){
var J=getJournal();
var log=lsJSON('ihsg_grader_log',[]);
var rules=[];
if(log.length&&J.length){
var pairs=[];
for(var i=0;i<J.length;i++){
var e=J[i];
if(e.outcome==null||!e.t||!e.d)continue;
var best=null;
for(var k=0;k<log.length;k++){
var L=log[k];
if(L.c!==e.t)continue;
if(L.t>e.d)continue;
if(e.d-L.t>10*86400000)continue;
if(!best||L.t>best.t)best=L;
}
if(best)pairs.push({s:best.s,o:e.outcome});
}
var low=[];
for(var p=0;p<pairs.length;p++){if(pairs[p].s<60)low.push(pairs[p].o);}
if(low.length>=4){
var sum=0;for(var q=0;q<low.length;q++)sum+=low[q];
var avg=sum/low.length;
if(avg<0)rules.push('Jangan entry saat skor Grader <60 (rata '+avg.toFixed(1)+'% dari '+low.length+' trade).');
}
}
var bySetup={};
var J2=getJournal();
for(var j=0;j<J2.length;j++){
var en=J2[j];
if(en.outcome==null)continue;
var key=en.setup||'tanpa-tag';
if(!bySetup[key])bySetup[key]={n:0,w:0};
bySetup[key].n++;
if(en.outcome>0)bySetup[key].w++;
}
var ks=Object.keys(bySetup);
for(var s=0;s<ks.length;s++){
var b=bySetup[ks[s]];
if(b.n>=4&&b.w/b.n<0.4&&ks[s]!=='tanpa-tag')rules.push('Setup '+ks[s]+' historis lemah (WR '+(b.w/b.n*100).toFixed(0)+'%) - butuh konfirmasi ekstra atau lewati.');
}
var wSum=0,wN=0,lSum=0,lN=0;
for(var a=0;a<J2.length;a++){
var o2=J2[a].outcome;
if(o2==null)continue;
if(o2>0){wSum+=o2;wN++;}else{lSum+=o2;lN++;}
}
if(wN&&lN){
var aw=wSum/wN;var al=lSum/lN;
if(Math.abs(al)>Math.abs(aw)*1.2)rules.push('Potong rugi lebih cepat: rata kalah '+al.toFixed(1)+'% vs rata menang +'+aw.toFixed(1)+'%.');
}
return rules.slice(0,4);
}
window.runWeekRev=async function(){
var out=document.getElementById('wrOut');
var st=compute(weekList());
if(!st){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Belum ada entri jurnal ber-outcome dalam 7 hari terakhir. Proses saham, tunggu outcome terhitung, lalu kembali.</div>';return;}
out.innerHTML='<div class="skel-box" style="height:70px"></div>';
var rules=extractRules();
saveLS('ihsg_rules',rules);
var curve=null;
try{curve=await equityCurve();}catch(e){curve=null;}
var L=[];
L.push('Statistik 7 hari: '+st.n+' entri, win rate '+st.wr.toFixed(0)+'%, rata-rata '+(st.avg>=0?'+':'')+st.avg.toFixed(2)+'%.');
L.push('Rata menang '+(st.avgW>=0?'+':'')+st.avgW.toFixed(2)+'% vs rata kalah '+st.avgL.toFixed(2)+'% (payoff '+st.payoff.toFixed(2)+').');
L.push('Terbaik: '+st.best.t+' '+(st.best.o>=0?'+':'')+st.best.o.toFixed(2)+'%. Terburuk: '+st.worst.t+' '+st.worst.o.toFixed(2)+'%.');
var ks=Object.keys(st.bySetup);
for(var i=0;i<ks.length;i++){var b=st.bySetup[ks[i]];L.push('Setup '+ks[i]+': '+b.n+' entri, WR '+(b.w/b.n*100).toFixed(0)+'%, rata '+(b.s/b.n>=0?'+':'')+(b.s/b.n).toFixed(2)+'%.');}
if(curve)L.push('KURVA EKUITAS: total jurnal '+(curve.you[curve.you.length-1]>=0?'+':'')+curve.you[curve.you.length-1].toFixed(1)+'% vs IHSG '+(curve.mkt[curve.mkt.length-1]>=0?'+':'')+curve.mkt[curve.mkt.length-1].toFixed(1)+'% pada periode sama → alpha '+(curve.alpha>=0?'+':'')+curve.alpha.toFixed(1)+'%.');
if(rules.length)L.push('ATURAN PRIBADI AKTIF: '+rules.join(' '));
var prompt='Anda coach trading disiplin untuk swing trader IHSG. Statistik jurnal 7 hari:'+NL+L.join(NL)+NL+NL+'Tulis review: (1) satu kalimat apresiasi jujur, (2) dua pola yang perlu diperbaiki berbasis angka, (3) satu aturan disiplin konkret minggu depan. Jika ada KURVA EKUITAS, nilai apakah alpha positif/negatif dan apa penyebab utamanya. Jika ada ATURAN PRIBADI, nilai kepatuhan minggu ini. Maks 130 kata.';
var narrative='';
try{narrative=await window.callLLM(prompt);}catch(e){narrative='(AI gagal: '+e.message+') Ringkasan:'+NL+L.join(NL);}
var h='<div class="metric-grid" style="margin-bottom:8px;">';
h+='<div class="metric-box"><div class="metric-label">Entri 7 hari</div><div class="metric-value">'+st.n+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Win Rate</div><div class="metric-value '+(st.wr>=50?'green':'red')+'">'+st.wr.toFixed(0)+'%</div></div>';
h+='<div class="metric-box"><div class="metric-label">Rata-rata</div><div class="metric-value '+(st.avg>=0?'green':'red')+'">'+(st.avg>=0?'+':'')+st.avg.toFixed(2)+'%</div></div>';
h+='<div class="metric-box"><div class="metric-label">Payoff</div><div class="metric-value '+(st.payoff>=1.5?'green':'yellow')+'">'+st.payoff.toFixed(2)+'</div></div>';
h+='</div>';
if(curve){
var acol=curve.alpha>=0?'green':'red';
h+='<div style="font-size:0.74rem;padding:8px 10px;border:1px solid var(--card-border);border-radius:12px;background:var(--card-bg);margin-bottom:8px;">';
h+='<div style="font-weight:800;color:#fff;margin-bottom:2px;">📈 Kurva ekuitas jurnal vs IHSG ('+curve.n+' trade)</div>';
h+=eqSvg(curve.you,curve.mkt);
h+='<div style="font-size:0.72rem;margin-top:4px;color:var(--'+acol+');">Alpha Anda: '+(curve.alpha>=0?'+':'')+curve.alpha.toFixed(1)+'% '+(curve.alpha>=0?'- keputusan Anda menambah nilai di atas pasar.':'- keputusan Anda masih kalah dari beli-tahan IHSG; perbaiki seleksi & timing.')+'</div>';
h+='</div>';
}
if(rules.length){
h+='<div style="font-size:0.74rem;padding:8px 10px;border:1px solid rgba(251,191,36,.35);border-radius:10px;background:rgba(251,191,36,.08);margin-bottom:8px;color:var(--yellow);">📌 <strong>Aturan pribadi Anda (aktif di Grader):</strong><br>';
for(var r=0;r<rules.length;r++)h+='• '+rules[r]+'<br>';
h+='</div>';
}
h+='<div class="report-card" style="margin-top:0;white-space:pre-wrap;">'+esc(narrative)+'</div>';
h+='<div style="font-size:0.64rem;color:#64748b;margin-top:6px;">Direview '+new Date().toLocaleString('id-ID')+'</div>';
out.innerHTML=h;
saveLS('ihsg_weekrev',{t:Date.now(),stats:st,text:narrative,rules:rules});
};
setTimeout(function(){
var last=lsJSON('ihsg_weekrev',null);
var out=document.getElementById('wrOut');
if(last&&last.text&&last.stats&&out&&out.innerText.indexOf('Statistik 7 hari')>=0){
var h2='<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">Review terakhir '+new Date(last.t).toLocaleString('id-ID')+' - '+last.stats.n+' entri, WR '+last.stats.wr.toFixed(0)+'%</div>';
if(last.rules&&last.rules.length)h2+='<div style="font-size:0.72rem;color:var(--yellow);margin-bottom:6px;">📌 '+last.rules.join(' • ')+'</div>';
h2+='<div class="report-card" style="margin-top:0;white-space:pre-wrap;">'+esc(last.text)+'</div>';
out.innerHTML=h2;
}
},1200);
})();
/* END weekrev v3 */
