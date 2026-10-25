/* toppicks.js v3 - Top Picks: scan 45 saham + track record pick 20 hari + bintang massal ke watchlist */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var UNIV=["BBCA","BBRI","BMRI","BBNI","BRIS","TLKM","ISAT","EXCL","ASII","UNVR","ICBP","INDF","KLBF","SIDO","MYOR","AMRT","MAPI","ACES","ERAA","MDKA","ANTM","INCO","TINS","PTBA","ADRO","ITMG","PGAS","MEDC","ESSA","TPIA","BRPT","CPIN","JPFA","SMGR","INDY","JSMR","TBIG","TOWR","GOTO","EMTK","PGEO","BREN","CUAN","AMMN","NCKL"];
UNIV=UNIV.filter(function(v,i,s){return s.indexOf(v)===i;});
var anchor=document.getElementById('slOut')?document.getElementById('slOut').closest('.card'):(document.getElementById('scrBtn')?document.getElementById('scrBtn').closest('.card'):null);
P.card('tab-market',
'<div class="card-title"><span>🏆 Top Picks 1 Bulan</span><span class="agent-pill master">Auto-Scan 45 Saham</span></div>'+
'<button class="btn-copy" style="margin-top:0;" id="tpBtn" onclick="runTopPicks()">🏆 Scan Top Picks Sekarang</button>'+
'<div id="tpNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Scan 45 saham liquid, tampilkan 15 terbaik skor 1-bulan. Pick tersimpan dan dinilai otomatis setelah 20 hari.</div>'+
'<div id="tpOut" class="hidden" style="margin-top:10px;"></div>',anchor);
function regimeOfIHSG(IA){
var n=IA.c.length;
var ma20=SW.sma(IA.c,20),ma50=SW.sma(IA.c,50),rsi=SW.rsi(IA.c,14);
var p=IA.c[n-1],m20=ma20[n-1],m50=ma50[n-1],r=rsi[n-1];
if(p>m20&&m20>m50&&r>=50&&r<=70)return 15;
if(p>m50&&r>=40&&r<=60)return 10;
if(p<m20&&p>m50)return 5;
return 0;
}
function scoreStock(code,candle,ihsgRet60,regPts){
var A=SW.arrays(candle);var n=A.c.length;
if(n<120)return null;
var ma50=SW.sma(A.c,50),ma100=SW.sma(A.c,100);
var m50=ma50[n-1],m100=ma100[n-1];
var price=(typeof cachePrice==='function'&&cachePrice(code))||A.c[n-1];
if(m50==null||m100==null)return null;
var slope50=(ma50[n-6]!=null&&ma50[n-6]!==0)?(m50-ma50[n-6])/ma50[n-6]*100:0;
var tren=0;
if(price>m50&&m50>m100)tren+=20;else if(price>m50)tren+=10;
if(slope50>1)tren+=10;else if(slope50>0)tren+=5;
var ret60=(price/A.c[n-61]-1)*100;
var rel=ret60-ihsgRet60;
var mom=0;
if(ret60>0)mom+=12;
if(rel>3)mom+=13;else if(rel>0)mom+=8;else if(rel>-3)mom+=4;
var q=candle.indicators.quote[0];var vol=[];
if(q.volume){for(var i=0;i<q.volume.length;i++)if(q.volume[i]!=null)vol.push(q.volume[i]);}
var volPts=0,ratio=0,avg20=0;
if(vol.length>=61){
for(var a=vol.length-20;a<vol.length;a++)avg20+=vol[a];avg20/=20;
var avg60=0;for(var b=vol.length-60;b<vol.length;b++)avg60+=vol[b];avg60/=60;
ratio=avg60>0?avg20/avg60:0;
if(ratio>=1.3)volPts=15;else if(ratio>=1.1)volPts=10;else if(ratio>=0.9)volPts=5;
}
var volLast=vol.length?vol[vol.length-1]:0;
var chg=(A.c[n-1]-A.c[n-2])/A.c[n-2]*100;
var tape=0;
if(avg20>0&&volLast>=1.5*avg20&&chg>0)tape=15;
else if(avg20>0&&volLast>=1.2*avg20&&chg>0)tape=10;
else if(avg20>0&&volLast<0.8*avg20&&Math.abs(chg)<1.5)tape=5;
var score=tren+mom+volPts+regPts+tape;
var verdict,col;
if(score>=75){verdict='LAYAK';col='green';}
else if(score>=60){verdict='HATI-HATI';col='yellow';}
else{verdict='LEWATI';col='red';}
return{score:score,verdict:verdict,col:col,ret60:ret60,rel:rel,ratio:ratio,px:price};
}
async function resolveHist(){
var hist=lsJSON('toppicks_hist',[]);
var changed=false;
for(var i=0;i<hist.length;i++){
var sc=hist[i];
if(sc.res||!sc.picks||!sc.picks.length)continue;
if(Date.now()-sc.t<=20*86400000)continue;
var codes=[];
for(var p=0;p<sc.picks.length&&codes.length<8;p++)codes.push(sc.picks[p].c);
var prices={};
var settled=await Promise.allSettled(codes.map(function(c){return fetchChart(c+'.JK','1y').then(function(j){var q=j.chart.result[0].indicators.quote[0];var cl=q.close;for(var k=cl.length-1;k>=0;k--){if(cl[k]!=null)return cl[k];}return null;});}));
for(var s2=0;s2<settled.length;s2++){if(settled[s2].status==='fulfilled'&&settled[s2].value)prices[codes[s2]]=settled[s2].value;}
var hits=0,tot=0;
for(var p2=0;p2<sc.picks.length;p2++){
var pk=sc.picks[p2];
var now=prices[pk.c];
if(!now||!pk.px)continue;
tot++;
var ret=(now-pk.px)/pk.px*100;
if(ret>=5)hits++;
}
if(tot>0){sc.res={hits:hits,tot:tot};changed=true;}
}
if(changed)saveLS('toppicks_hist',hist);
return hist;
}
function trackLine(hist){
var H=0,T=0;
for(var i=0;i<hist.length;i++){
var sc=hist[i];
if(sc.res){H+=sc.res.hits;T+=sc.res.tot;}
}
if(T===0)return '';
return '📈 Track record scanner: '+H+'/'+T+' pick ('+(H/T*100).toFixed(0)+'%) naik >=5% dalam 20 hari.';
}
function addToWatch(code){
if(Array.isArray(window.watchlist)){
var sample=window.watchlist[0];
var exists=false;
for(var i=0;i<window.watchlist.length;i++){
var w=window.watchlist[i];
var wc=typeof w==='string'?w:(w.t||w.code||'');
if(wc===code)exists=true;
}
if(!exists){
if(sample&&typeof sample==='object')window.watchlist.push({t:code});
else window.watchlist.push(code);
}
return;
}
var arr=lsJSON('ihsg_watchlist',[]);
if(arr.indexOf(code)<0)arr.push(code);
saveLS('ihsg_watchlist',arr);
}
window.starPicks=function(){
var rows=window.__tpRows||[];var n=0;
for(var i=0;i<rows.length;i++){
if(rows[i].score>=75){addToWatch(rows[i].code);n++;}
}
if(n===0){toast('Tidak ada pick >=75 untuk dibintangi.');return;}
toast('⭐ '+n+' saham ditambah ke watchlist.');
};
window.runTopPicks=async function(){
var btn=document.getElementById('tpBtn');btn.disabled=true;btn.innerText='Scanning 45 saham...';
var out=document.getElementById('tpOut');out.classList.remove('hidden');out.innerHTML='<div class="skel-box" style="height:90px"></div>';
try{
var hist=await resolveHist();
var tr=trackLine(hist);
var cache=lsJSON('toppicks_cache',null);
if(cache&&cache.t&&Date.now()-cache.t<600000){render(cache.rows,tr);note('Cache '+new Date(cache.t).toLocaleTimeString('id-ID')+' (10 menit).');return;}
var ij=await fetchChart('^JKSE','1y');
var IA=SW.arrays(ij.chart.result[0]);
var ihsgRet60=(IA.c[IA.c.length-1]/IA.c[IA.c.length-61]-1)*100;
var regPts=regimeOfIHSG(IA);
var settled=await Promise.allSettled(UNIV.map(function(c){return SW.candle(c,'1y');}));
var rows=[];
settled.forEach(function(res,i){
if(res.status!=='fulfilled')return;
var sc=scoreStock(UNIV[i],res.value,ihsgRet60,regPts);
if(sc&&sc.score>=60)rows.push({code:UNIV[i],score:sc.score,verdict:sc.verdict,col:sc.col,ret60:sc.ret60,rel:sc.rel,ratio:sc.ratio,px:sc.px});
});
rows.sort(function(a,b){return b.score-a.score;});
rows=rows.slice(0,15);
saveLS('toppicks_cache',{t:Date.now(),rows:rows});
var hist2=lsJSON('toppicks_hist',[]);
hist2.push({t:Date.now(),picks:rows.map(function(r){return {c:r.code,px:r.px,s:r.score};}),res:null});
if(hist2.length>40)hist2=hist2.slice(hist2.length-40);
saveLS('toppicks_hist',hist2);
render(rows,tr);
note('Diperbarui '+new Date().toLocaleTimeString('id-ID')+' - regime IHSG '+regPts+'/15 poin. '+rows.length+' saham lolos >=60.');
}catch(e){out.innerHTML='<div style="color:var(--red);">Scan gagal: '+esc(e.message)+'</div>';}
finally{btn.disabled=false;btn.innerText='🏆 Scan Top Picks Sekarang';}
};
function note(t){var e=document.getElementById('tpNote');if(e)e.innerText=t;}
function render(rows,tr){
var out=document.getElementById('tpOut');window.__tpRows=rows;
var h='';
if(tr)h+='<div style="font-size:0.72rem;padding:6px 8px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin-bottom:8px;color:var(--text-muted);">'+tr+'</div>';
if(!rows.length){
h+='<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada saham dengan skor >=60 saat ini. Pasar sedang tidak ramah - disiplin menunggu juga posisi.</div>';
out.innerHTML=h;return;
}
h+='<button class="btn-copy" style="margin-top:0;margin-bottom:8px;" onclick="starPicks()">⭐ Simpan semua skor >=75 ke Watchlist</button>';
for(var i=0;i<rows.length;i++){
var r=rows[i];
h+='<div class="mkt-row" style="cursor:pointer;" onclick="tpPick('+i+')">';
h+='<span><strong>'+r.code+'</strong> <span style="color:var(--text-muted);font-size:0.68rem;">'+r.verdict+' - 60h '+(r.ret60>=0?'+':'')+r.ret60.toFixed(1)+'% - vol '+r.ratio.toFixed(1)+'x</span></span>';
h+='<span style="font-family:var(--mono);font-weight:900;font-size:1.05rem;" class="'+r.col+'">'+r.score+'</span></div>';
}
h+='<div class="src-note">Skor = tren menengah + momentum vs IHSG + minat volume + regime + tape. Klik baris untuk Proses & konfirmasi lengkap (Forecast, Grader, Bandar, Money Flow).</div>';
out.innerHTML=h;
}
window.tpPick=function(i){
var r=(window.__tpRows||[])[i];if(!r)return;
switchTab('analysis');
setTimeout(function(){
var inp=document.querySelector('input[placeholder*="KODE SAHAM"]');
if(inp)inp.value=r.code;
var btns=document.querySelectorAll('button');
for(var b=0;b<btns.length;b++){if((btns[b].innerText||'').trim()==='Proses'){btns[b].click();break;}}
},350);
};
})();
/* END toppicks v3 */
