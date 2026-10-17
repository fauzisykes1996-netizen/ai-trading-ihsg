/* weekrev.js - Review Mingguan AI: statistik jurnal 7 hari + narasi perbaikan dari AI */
(function(){
 if(!window.P)return;
 var NL=String.fromCharCode(10);
 var tab=document.getElementById('tab-jurnal');
 var anchor=tab?tab.querySelector('.card'):null;
 P.card('tab-jurnal',
  '<div class="card-title"><span>📆 Review Mingguan AI</span><span class="agent-pill master">Jurnal jadi Insight</span></div>'+
  '<button class="btn-copy" style="margin-top:0;" id="wrBtn" onclick="runWeekRev()">📆 Review Minggu Ini</button>'+
  '<div id="wrOut" style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">Merangkum 7 hari terakhir jurnal Anda: win rate per setup, payoff, dan narasi perbaikan dari AI.</div>',anchor);
 function weekList(){
  var cut=Date.now()-7*86400000;var list=[];
  for(var i=0;i<journal.length;i++){var e=journal[i];if(e.outcome==null)continue;if(e.d>=cut)list.push(e);}
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
 window.runWeekRev=async function(){
  var out=document.getElementById('wrOut');
  var st=compute(weekList());
  if(!st){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Belum ada entri jurnal ber-outcome dalam 7 hari terakhir. Proses saham, tunggu 2 hari agar outcome terhitung, lalu kembali ke sini.</div>';return;}
  out.innerHTML='<div class="skel-box" style="height:70px"></div>';
  var L=[];
  L.push('Statistik 7 hari: '+st.n+' entri, win rate '+st.wr.toFixed(0)+'%, rata-rata '+(st.avg>=0?'+':'')+st.avg.toFixed(2)+'%.');
  L.push('Rata menang '+(st.avgW>=0?'+':'')+st.avgW.toFixed(2)+'% vs rata kalah '+st.avgL.toFixed(2)+'% (payoff '+st.payoff.toFixed(2)+').');
  L.push('Terbaik: '+st.best.t+' '+(st.best.o>=0?'+':'')+st.best.o.toFixed(2)+'%. Terburuk: '+st.worst.t+' '+st.worst.o.toFixed(2)+'%.');
  var ks=Object.keys(st.bySetup);
  for(var i=0;i<ks.length;i++){var b=st.bySetup[ks[i]];L.push('Setup '+ks[i]+': '+b.n+' entri, WR '+(b.w/b.n*100).toFixed(0)+'%, rata '+(b.s/b.n>=0?'+':'')+(b.s/b.n).toFixed(2)+'%.');}
  var prompt='Anda coach trading disiplin untuk swing trader IHSG. Statistik jurnal 7 hari terakhir:'+NL+L.join(NL)+NL+NL+'Tulis review bahasa Indonesia: (1) satu kalimat apresiasi jujur, (2) dua pola yang perlu diperbaiki berbasis angka di atas, (3) satu aturan disiplin konkret untuk minggu depan. Maksimal 120 kata, tanpa basa-basi.';
  var narrative='';
  try{narrative=await window.callLLM(prompt);}catch(e){narrative='(AI gagal: '+e.message+') Ringkasan mentah:'+NL+L.join(NL);}
  var h='<div class="metric-grid" style="margin-bottom:8px;">';
  h+='<div class="metric-box"><div class="metric-label">Entri 7 hari</div><div class="metric-value">'+st.n+'</div></div>';
  h+='<div class="metric-box"><div class="metric-label">Win Rate</div><div class="metric-value '+(st.wr>=50?'green':'red')+'">'+st.wr.toFixed(0)+'%</div></div>';
  h+='<div class="metric-box"><div class="metric-label">Rata-rata</div><div class="metric-value '+(st.avg>=0?'green':'red')+'">'+(st.avg>=0?'+':'')+st.avg.toFixed(2)+'%</div></div>';
  h+='<div class="metric-box"><div class="metric-label">Payoff</div><div class="metric-value '+(st.payoff>=1.5?'green':'yellow')+'">'+st.payoff.toFixed(2)+'</div></div>';
  h+='</div>';
  h+='<div class="report-card" style="margin-top:0;white-space:pre-wrap;">'+esc(narrative)+'</div>';
  h+='<div style="font-size:0.64rem;color:#64748b;margin-top:6px;">Direview '+new Date().toLocaleString('id-ID')+'</div>';
  out.innerHTML=h;
  saveLS('ihsg_weekrev',{t:Date.now(),stats:st,text:narrative});
 };
 setTimeout(function(){
  var last=lsJSON('ihsg_weekrev',null);
  var out=document.getElementById('wrOut');
  if(last&&last.text&&last.stats&&out&&out.innerText.indexOf('Merangkum')>=0){
   out.innerHTML='<div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">Review terakhir '+new Date(last.t).toLocaleString('id-ID')+' - '+last.stats.n+' entri, WR '+last.stats.wr.toFixed(0)+'%</div><div class="report-card" style="margin-top:0;white-space:pre-wrap;">'+esc(last.text)+'</div>';
  }
 },1200);
})();
/* END weekrev v1 */
