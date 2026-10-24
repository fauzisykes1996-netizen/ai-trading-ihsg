/* weekrev.js v2 - Review Mingguan AI + ekstraksi aturan pribadi yang dipakai Grader sebagai pengingat */
(function(){
if(!window.P)return;
var NL=String.fromCharCode(10);
var tab=document.getElementById('tab-jurnal');
var anchor=tab?tab.querySelector('.card'):null;
P.card('tab-jurnal',
'<div class="card-title"><span>📆 Review Mingguan AI</span><span class="agent-pill master">Jurnal jadi Insight</span></div>'+
'<button class="btn-copy" style="margin-top:0;" id="wrBtn" onclick="runWeekRev()">📆 Review Minggu Ini</button>'+
'<div id="wrOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Statistik 7 hari + narasi AI + ekstraksi aturan pribadi yang otomatis muncul sebagai pengingat di kartu 🎯 Grader.</div>',anchor);
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
for(var j=0;j<J.length;j++){
var en=J[j];
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
var all=getJournal();
var wSum=0,wN=0,lSum=0,lN=0;
for(var a=0;a<all.length;a++){
var o2=all[a].outcome;
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
var L=[];
L.push('Statistik 7 hari: '+st.n+' entri, win rate '+st.wr.toFixed(0)+'%, rata-rata '+(st.avg>=0?'+':'')+st.avg.toFixed(2)+'%.');
L.push('Rata menang '+(st.avgW>=0?'+':'')+st.avgW.toFixed(2)+'% vs rata kalah '+st.avgL.toFixed(2)+'% (payoff '+st.payoff.toFixed(2)+').');
L.push('Terbaik: '+st.best.t+' '+(st.best.o>=0?'+':'')+st.best.o.toFixed(2)+'%. Terburuk: '+st.worst.t+' '+st.worst.o.toFixed(2)+'%.');
var ks=Object.keys(st.bySetup);
for(var i=0;i<ks.length;i++){var b=st.bySetup[ks[i]];L.push('Setup '+ks[i]+': '+b.n+' entri, WR '+(b.w/b.n*100).toFixed(0)+'%, rata '+(b.s/b.n>=0?'+':'')+(b.s/b.n).toFixed(2)+'%.');}
if(rules.length)L.push('ATURAN PRIBADI AKTIF: '+rules.join(' '));
var prompt='Anda coach trading disiplin untuk swing trader IHSG. Statistik jurnal 7 hari:'+NL+L.join(NL)+NL+NL+'Tulis review: (1) satu kalimat apresiasi jujur, (2) dua pola yang perlu diperbaiki berbasis angka, (3) satu aturan disiplin konkret minggu depan. Jika ada ATURAN PRIBADI, nilai apakah statistik minggu ini mematuhinya. Maks 120 kata.';
var narrative='';
try{narrative=await window.callLLM(prompt);}catch(e){narrative='(AI gagal: '+e.message+') Ringkasan:'+NL+L.join(NL);}
var h='<div class="metric-grid" style="margin-bottom:8px;">';
h+='<div class="metric-box"><div class="metric-label">Entri 7 hari</div><div class="metric-value">'+st.n+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Win Rate</div><div class="metric-value '+(st.wr>=50?'green':'red')+'">'+st.wr.toFixed(0)+'%</div></div>';
h+='<div class="metric-box"><div class="metric-label">Rata-rata</div><div class="metric-value '+(st.avg>=0?'green':'red')+'">'+(st.avg>=0?'+':'')+st.avg.toFixed(2)+'%</div></div>';
h+='<div class="metric-box"><div class="metric-label">Payoff</div><div class="metric-value '+(st.payoff>=1.5?'green':'yellow')+'">'+st.payoff.toFixed(2)+'</div></div>';
h+='</div>';
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
/* END weekrev v2 */
