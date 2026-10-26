/* multilab.js v3 - Ranking strategi + Uji Robustness, universe otomatis IHSG/US */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var ID_EXTRA=["BBCA","BBRI","BMRI","TLKM","ASII","ANTM","PTBA","ADMR","NCKL","PGEO","AMMN","CUAN","MDKA","TPIA","KLBF","ICBP","UNVR","GOTO","BUKA","BRPT","MEDC","INDY","TINS","SMGR"];
function currentUniv(){
if(window.MKT&&window.MKT.mode&&window.MKT.mode()==='US'&&window.MKT.US_UNIV)return window.MKT.US_UNIV.slice(0,24);
var base=[];
if(typeof SCR_UNIVERSE!=='undefined')base=base.concat(SCR_UNIVERSE);
base=base.concat(ID_EXTRA);
return base.filter(function(v,i,s){return s.indexOf(v)===i;}).slice(0,24);
}
function mkey(){return window.MKT&&window.MKT.mode?window.MKT.mode():'ID';}
var anchor=document.getElementById('swLabOut')?document.getElementById('swLabOut').closest('.card'):null;
P.card('tab-analysis',
'<div class="card-title"><span>📊 Lab Multi-Saham</span><span class="agent-pill tech">Ranking + Robustness</span></div>'+
'<button class="btn-copy" style="margin-top:0;" id="mlBtn" onclick="runMultiLab()">📊 Scan Ranking Strategi (24 saham)</button>'+
'<button class="btn-copy" style="margin-top:6px;" id="rbBtn" onclick="runRobust()">🧪 Uji Robustness (saham yang diproses)</button>'+
'<div id="mlNote" style="font-size:0.7rem;color:var(--text-muted);margin-top:8px;">Universe mengikuti saklar 🇮🇩/🇺🇸. Robustness = uji 3 varian SL; edge sah hanya jika positif di semua varian.</div>'+
'<div id="mlOut" class="hidden" style="margin-top:10px;"></div>',anchor);
function btP(c,h,l,o,mh,tp,slM){var ma20=SW.sma(c,20),ma50=SW.sma(c,50),rsi=SW.rsi(c,14),adx=SW.adx(h,l,c,14),atr=SW.atr(h,l,c,14);var tr=[];var pos=null;for(var i=50;i<c.length-1;i++){if(!pos){if(ma20[i]&&ma50[i]&&adx[i]&&rsi[i]&&atr[i]&&c[i]>ma20[i]&&ma20[i]>ma50[i]&&adx[i]>=20&&rsi[i]>=40&&rsi[i]<=65){var d=(c[i]-ma20[i])/ma20[i]*100;if(d>=-1&&d<=3)pos={entry:o[i+1],ei:i+1,sl:Math.min(SW.lowest(l,i-9,i+1)-atr[i]*0.3,o[i+1]-atr[i]*slM*0.6)};}}else{var held=i-pos.ei;var ex=null;if(l[i]<=pos.sl){ex=pos.sl;}else if(h[i]>=pos.entry+(pos.entry-pos.sl)*tp){ex=pos.entry+(pos.entry-pos.sl)*tp;}else if(held>=mh){ex=o[i+1]<c[i]?o[i+1]:c[i];}if(ex!=null){tr.push((ex-pos.entry)/pos.entry-P.fee);pos=null;}}}return tr;}
function btD(c,h,l,o,mh,tp,slM){var ma50=SW.sma(c,50),atr=SW.atr(h,l,c,14);var tr=[];var pos=null;for(var i=21;i<c.length-1;i++){if(!pos){var hh=SW.highest(h,i-20,i);if(ma50[i]&&atr[i]&&c[i]>ma50[i]&&c[i]>=hh*0.999)pos={entry:o[i+1],ei:i+1,sl:SW.lowest(l,i-19,i+1)-atr[i]*0.15*slM};}else{var held=i-pos.ei;var ex=null;if(l[i]<=pos.sl){ex=pos.sl;}else if(h[i]>=pos.entry+(pos.entry-pos.sl)*tp){ex=pos.entry+(pos.entry-pos.sl)*tp;}else if(held>=mh){ex=o[i+1]<c[i]?o[i+1]:c[i];}if(ex!=null){tr.push((ex-pos.entry)/pos.entry-P.fee);pos=null;}}}return tr;}
function st(tr){if(!tr.length)return null;var n=tr.length;var w=0;var gw=0;var gl=0;var sum=0;for(var i=0;i<n;i++){sum+=tr[i];if(tr[i]>0){w++;gw+=tr[i];}else gl+=-tr[i];}var pf=gl>0?gw/gl:(gw>0?99:0);return{n:n,wr:w/n*100,pf:pf,exp:sum/n*100};}
window.runMultiLab=async function(){
var btn=document.getElementById('mlBtn');btn.disabled=true;btn.innerText='Scanning 24 saham...';
var out=document.getElementById('mlOut');out.classList.remove('hidden');out.innerHTML='<div class="skel-box" style="height:80px"></div>';
try{
var UNIV=currentUniv();
var ck='multilab_cache_'+mkey();
var cache=lsJSON(ck,null);
if(cache&&cache.t&&Date.now()-cache.t<600000){render(cache.rows);note('Cache '+new Date(cache.t).toLocaleTimeString('id-ID')+' - pasar '+mkey()+'.');return;}
var settled=await Promise.allSettled(UNIV.map(function(c){return SW.candle(c,'2y');}));
var rows=[];
settled.forEach(function(res,i){
if(res.status!=='fulfilled')return;
var A=SW.arrays(res.value);if(A.c.length<80)return;
var rP=st(btP(A.c,A.h,A.l,A.o,25,2.5,2));
var rD=st(btD(A.c,A.h,A.l,A.o,30,2.5,2));
var best=null,strat='';
if(rP&&rP.n>=4&&(!best||rP.pf>best.pf)){best=rP;strat='pullback';}
if(rD&&rD.n>=4&&(!best||rD.pf>best.pf)){best=rD;strat='donchian';}
if(best)rows.push({code:UNIV[i],strat:strat,n:best.n,pf:best.pf,exp:best.exp,wr:best.wr});
});
rows.sort(function(a,b){return b.pf-a.pf||b.exp-a.exp;});
saveLS(ck,{t:Date.now(),rows:rows});
render(rows);
note('Diperbarui '+new Date().toLocaleTimeString('id-ID')+' - pasar '+mkey()+' - '+rows.length+' saham punya trade cukup.');
}catch(e){out.innerHTML='<div style="color:var(--red);">Scan gagal: '+esc(e.message)+'</div>';}
finally{btn.disabled=false;btn.innerText='📊 Scan Ranking Strategi (24 saham)';}
};
window.runRobust=async function(){
var code=window.lastTicker;
if(!code){alert('Proses sebuah saham dulu.');return;}
var btn=document.getElementById('rbBtn');btn.disabled=true;btn.innerText='Menguji 3 varian SL...';
var out=document.getElementById('mlOut');out.classList.remove('hidden');out.innerHTML='<div class="skel-box" style="height:80px"></div>';
try{
var candle=await SW.candle(code,'2y');
var A=SW.arrays(candle);
if(A.c.length<80){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Data 2 tahun tidak cukup untuk uji robustness.</div>';return;}
var ms=[1.5,2,2.5];
var h='';
var strats=[{k:'pullback',fn:btP},{k:'donchian',fn:btD}];
for(var s=0;s<strats.length;s++){
var pfs=[];var exps=[];
h+='<div style="font-size:0.78rem;font-weight:800;color:#fff;margin-top:10px;">'+(strats[s].k==='pullback'?'📉 Pullback':'🌊 Donchian')+' - '+code+'</div>';
for(var m=0;m<ms.length;m++){
var r=st(strats[s].fn(A.c,A.h,A.l,A.o,strats[s].k==='pullback'?25:30,2.5,ms[m]));
if(r){pfs.push(r.pf);exps.push(r.exp);}
var pfTxt=r?(r.pf>=99?'99+':r.pf.toFixed(2)):'-';
var expTxt=r?((r.exp>=0?'+':'')+r.exp.toFixed(2)+'%'):'-';
var nTxt=r?r.n+' trade':'0 trade';
var col=r?(r.pf>=1.5?'green':(r.pf>=1?'yellow':'red')):'red';
h+='<div style="display:flex;justify-content:space-between;font-size:0.72rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06);"><span>SL '+ms[m]+'xATR <span style="color:var(--text-muted);font-size:0.66rem;">('+nTxt+')</span></span><span style="font-family:var(--mono);font-weight:700;" class="'+col+'">PF '+pfTxt+' • '+expTxt+'</span></div>';
}
var verdict='RAPUH 🔴';var vcol='red';
if(pfs.length===3){
var allPos=true;var allGood=true;
for(var p=0;p<3;p++){
if(pfs[p]<1.2)allGood=false;
if(exps[p]<=0)allPos=false;
}
if(allGood&&allPos){verdict='ROBUST 🟢 - edge tahan di semua varian, layak dipercaya';vcol='green';}
else if(allPos){verdict='SEDANG 🟠 - untung di semua varian tapi PF tipis, ukuran kecil';vcol='yellow';}
}
h+='<div style="font-size:0.74rem;font-weight:800;color:var('+vcol+');margin-top:6px;">'+verdict+'</div>';
}
h+='<div class="src-note">ROBUST = tidak bergantung satu setting SL. RAPUH = cantik di satu varian saja (overfit).</div>';
out.innerHTML=h;
note('Uji robustness '+code+' selesai '+new Date().toLocaleTimeString('id-ID')+'.');
}catch(e){out.innerHTML='<div style="color:var(--red);">Uji gagal: '+esc(e.message)+'</div>';}
finally{btn.disabled=false;btn.innerText='🧪 Uji Robustness (saham yang diproses)';}
};
function note(t){var e=document.getElementById('mlNote');if(e)e.innerText=t;}
function render(rows){
var out=document.getElementById('mlOut');window.__mlRows=rows;
if(!rows.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.8rem;">Tidak ada saham dengan trade cukup (>=4) dalam 2 tahun di pasar '+mkey()+'.</div>';return;}
var h='';
for(var i=0;i<rows.length;i++){
var r=rows[i];
var pfCol=r.pf>=1.5?'green':(r.pf>=1?'yellow':'red');
h+='<div class="mkt-row" style="cursor:pointer;" onclick="mlPick('+i+')">';
h+='<span><strong>'+r.code+'</strong> <span style="color:var(--text-muted);font-size:0.68rem;">'+(r.strat==='pullback'?'Pullback':'Donchian')+' - '+r.n+' trade'+(r.n<8?' (sampel kecil)':'')+'</span><br>';
h+='<span style="font-size:0.66rem;color:#64748b;font-family:var(--mono);">WR '+r.wr.toFixed(0)+'% - expectancy '+(r.exp>=0?'+':'')+r.exp.toFixed(2)+'%</span></span>';
h+='<span style="text-align:right;font-family:var(--mono);font-weight:800;" class="'+pfCol+'">'+(r.pf>=99?'99+':r.pf.toFixed(2))+'</span></div>';
}
h+='<div class="src-note">PF = Profit Factor. Hijau (>=1,5) = edge historis layak. Ketuk baris = buka Swing Lab saham itu.</div>';
out.innerHTML=h;
}
window.mlPick=function(i){
var r=(window.__mlRows||[])[i];if(!r)return;
switchTab('analysis');
setTimeout(function(){
var sc=document.getElementById('swCode');if(sc)sc.value=r.code;
var st2=document.getElementById('swStrat');if(st2)st2.value=r.strat;
if(window.runSwingLab)window.runSwingLab();
},400);
};
})();
/* END multilab v3 */
