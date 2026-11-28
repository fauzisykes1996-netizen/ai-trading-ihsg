/* portopro v3 - Portfolio Pro: cash auto-save, sync otomatis ke Doctor/Heat/Plan, impor posisi core, ledger+realized+lifecycle+equity */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var NL=String.fromCharCode(10);
var busy=false;
var undoSnap=null;
var undoTimer=0;
var cashTimer=0;
function txs(){var a=lsJSON('portopro_tx',[]);return Array.isArray(a)?a:[];}
function saveTxs(a){saveLS('portopro_tx',a);}
function cash(){var c=parseFloat(localStorage.getItem('portopro_cash'));return isFinite(c)?c:0;}
function setCash(v){localStorage.setItem('portopro_cash',String(v));}
function looksPos(o){if(!o||typeof o!=='object')return false;var c=!!(o.t||o.code||o.ticker||o.symbol||o.kode);var l=!!(o.lot||o.qty||o.shares||o.jumlah);var p=!!(o.avg||o.entry||o.price||o.buy||o.harga||o.avgPrice);return c&&l&&p;}
function normPos(o){return {t:(o.t||o.code||o.ticker||o.symbol||o.kode),lot:parseFloat(o.lot||o.qty||o.shares||o.jumlah)||0,avg:parseFloat(o.avg||o.entry||o.price||o.buy||o.harga||o.avgPrice)||0};}
function extPositions(){
var out=[];
var g=window.portfolio;
if(Array.isArray(g)){for(var i=0;i<g.length;i++){if(looksPos(g[i]))out.push(normPos(g[i]));}if(out.length)return out;}
var k1=lsJSON('ihsg_porto',null);
if(Array.isArray(k1)){for(var a=0;a<k1.length;a++){if(looksPos(k1[a]))out.push(normPos(k1[a]));}if(out.length)return out;}
var k2=lsJSON('ihsg_portfolio',null);
if(Array.isArray(k2)){for(var b=0;b<k2.length;b++){if(looksPos(k2[b]))out.push(normPos(k2[b]));}if(out.length)return out;}
if(k2&&typeof k2==='object'){var ks=Object.keys(k2);for(var c=0;c<ks.length;c++){var v=k2[ks[c]];if(v&&typeof v==='object'){var l=parseFloat(v.lot||v.qty)||0;var p=parseFloat(v.avg||v.entry||v.price)||0;if(l>0&&p>0)out.push({t:ks[c],lot:l,avg:p});}}if(out.length)return out;}
return out;
}
function derive(){
var list=txs().slice().sort(function(a,b){return a.d-b.d;});
var pos={};var realized={};var life={};
for(var i=0;i<list.length;i++){
var t=list[i];var code=t.t;var lot=parseFloat(t.lot)||0;var px=parseFloat(t.px)||0;
if(!code||lot<=0||px<=0)continue;
if(!pos[code])pos[code]={lot:0,avg:0};
if(!life[code])life[code]=[];
if(t.side==='BUY'){
var nl=pos[code].lot+lot;
pos[code].avg=nl>0?(pos[code].lot*pos[code].avg+lot*px)/nl:px;
pos[code].lot=nl;
}else{
var sellLot=Math.min(lot,pos[code].lot);
var r=(px-pos[code].avg)*sellLot*100;
realized[code]=(realized[code]||0)+r;
pos[code].lot=pos[code].lot-sellLot;
t.realized=r;
if(pos[code].lot<=0.0001)pos[code].lot=0;
}
life[code].push({d:t.d,lot:pos[code].lot,side:t.side});
}
return{pos:pos,realized:realized,life:life,log:list};
}
function syncCore(pos){
var map={};var arr=[];
var ks=Object.keys(pos);
for(var i=0;i<ks.length;i++){
var p=pos[ks[i]];
if(p.lot>0){map[ks[i]]={lot:p.lot,avg:p.avg};arr.push({t:ks[i],lot:p.lot,avg:p.avg});}
}
saveLS('ihsg_portfolio',map);
saveLS('ihsg_porto',arr);
window.portfolio=arr;
}
function quickEquity(){
var d=derive();var mv=0;var ks=Object.keys(d.pos);
for(var i=0;i<ks.length;i++){var p=d.pos[ks[i]];if(p.lot>0)mv+=p.lot*100*((typeof cachePrice==='function'&&cachePrice(ks[i]))||p.avg);}
var real=0;var rk=Object.keys(d.realized);
for(var r=0;r<rk.length;r++)real+=d.realized[rk[r]];
return{cash:cash(),mv:mv,eq:cash()+mv,real:real};
}
function lifeSvg(arr){
if(!arr||arr.length<2)return '';
var W=120,H=34,pad=3;var max=0;
for(var i=0;i<arr.length;i++){if(arr[i].lot>max)max=arr[i].lot;}
if(max<=0)return '';
var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:120px;height:34px;display:block;">';
var d='';
for(var k=0;k<arr.length;k++){
var x=pad+(k/(arr.length-1))*(W-2*pad);
var y=H-pad-(arr[k].lot/max)*(H-2*pad);
if(k===0)d='M'+x.toFixed(1)+','+y.toFixed(1);
else d+=' L'+x.toFixed(1)+','+(H-pad-(arr[k-1].lot/max)*(H-2*pad)).toFixed(1)+' L'+x.toFixed(1)+','+y.toFixed(1);
}
var col=arr[arr.length-1].lot>0?'#22c55e':'#64748b';
s+='<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="1.6"/>';
s+='</svg>';
return s;
}
function fmt(n){return Math.round(n).toLocaleString('id-ID');}
function injectStyle(){
if(document.getElementById('poStyle'))return;
var st=document.createElement('style');
st.id='poStyle';
st.textContent='#poLog{max-height:230px;overflow-y:auto;padding-right:6px;scrollbar-width:thin;scrollbar-color:#7c3aed rgba(255,255,255,.06);}#poLog::-webkit-scrollbar{width:8px;}#poLog::-webkit-scrollbar-track{background:rgba(255,255,255,.06);border-radius:8px;}#poLog::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#7c3aed,#38bdf8);border-radius:8px;}#poLog::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#8b5cf6,#7dd3fc);}@keyframes poFlash{0%{box-shadow:0 0 0 0 rgba(56,189,248,.7);}70%{box-shadow:0 0 0 14px rgba(56,189,248,0);}100%{box-shadow:0 0 0 0 rgba(56,189,248,0);}}.po-flash{animation:poFlash 1.1s ease-out 2;}';
document.head.appendChild(st);
}
function chipHtml(){
var q=quickEquity();
var h='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:0.7rem;padding:8px 10px;border:1px solid rgba(124,58,237,.45);border-radius:12px;background:linear-gradient(90deg,rgba(124,58,237,.14),rgba(56,189,248,.10));margin-bottom:10px;">';
h+='<span style="font-weight:800;color:#fff;">💼 Pro</span>';
h+='<span>Equity <strong style="color:#fff;">Rp '+fmt(q.eq)+'</strong></span>';
h+='<span>Cash '+(q.eq>0?(q.cash/q.eq*100).toFixed(0):0)+'%</span>';
h+='<span class="'+(q.real>=0?'green':'red')+'">Realized '+(q.real>=0?'+':'')+'Rp '+fmt(q.real)+'</span>';
h+='<button class="btn-mini" onclick="PORTOPRO.open()">📍 Buka di Porto</button>';
h+='</div>';
return h;
}
function mountChips(){
var tabs=['tab-analysis','tab-market'];
for(var i=0;i<tabs.length;i++){
var t=document.getElementById(tabs[i]);
if(!t)continue;
var old=document.getElementById('proChip_'+i);
if(old)old.remove();
var div=document.createElement('div');
div.id='proChip_'+i;
div.innerHTML=chipHtml();
t.insertBefore(div,t.firstChild);
}
}
function showUndo(label){
var bar=document.getElementById('poUndoBar');
if(!bar)return;
bar.style.display='flex';
bar.innerHTML='<span style="font-size:0.72rem;color:var(--yellow);">⚠ '+label+'</span><button class="btn-mini" onclick="PORTOPRO.undo()">↩ Undo</button>';
clearTimeout(undoTimer);
undoTimer=setTimeout(function(){bar.style.display='none';undoSnap=null;},9000);
}
function mount(){
var tab=document.getElementById('tab-porto');
if(!tab){setTimeout(mount,900);return;}
if(document.getElementById('portoproCard')){mountChips();return;}
injectStyle();
var card=document.createElement('div');
card.className='card';
card.id='portoproCard';
var html='<div class="card-title"><span>💼 Portfolio Pro</span><span class="agent-pill master">Kas + Ledger + Equity</span></div>';
html+='<div id="poUndoBar" style="display:none;gap:8px;align-items:center;margin-bottom:8px;"></div>';
html+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">';
html+='<span style="font-size:0.7rem;color:var(--text-muted);">Cash (Rp):</span><input id="poCash" type="number" class="fv-input" style="width:130px;margin-top:0;" placeholder="uang tunai">';
html+='<button class="btn-mini" onclick="PORTOPRO.saveCash()">💾</button>';
html+='<select id="poRisk" class="fv-input" style="width:74px;margin-top:0;"><option value="0.5">0.5%</option><option value="1">1%</option><option value="2">2%</option></select>';
html+='</div>';
html+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">';
html+='<input id="poCode" class="fv-input" style="width:80px;margin-top:0;" placeholder="KODE">';
html+='<select id="poSide" class="fv-input" style="width:80px;margin-top:0;"><option value="BUY">BUY</option><option value="SELL">SELL</option></select>';
html+='<input id="poLot" type="number" class="fv-input" style="width:70px;margin-top:0;" placeholder="lot">';
html+='<input id="poPx" type="number" class="fv-input" style="width:90px;margin-top:0;" placeholder="harga">';
html+='<button class="btn-mini" onclick="PORTOPRO.addTx()">＋ Catat</button>';
html+='</div>';
html+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">';
html+='<button class="btn-mini" onclick="PORTOPRO.sync()">🔄 Sync core</button>';
html+='<button class="btn-mini" onclick="PORTOPRO.copy()">📋 Ringkasan</button>';
html+='<button class="btn-mini" onclick="PORTOPRO.reset()">🧹 Reset</button>';
html+='</div>';
html+='<div id="poBody" style="font-size:0.78rem;color:var(--text-muted);">Memuat...</div>';
card.innerHTML=html;
tab.insertBefore(card,tab.firstChild);
var c=document.getElementById('poCash');
if(c){
c.value=cash()||'';
c.addEventListener('input',function(){
clearTimeout(cashTimer);
cashTimer=setTimeout(function(){
var v=parseFloat(c.value);
if(isFinite(v)&&v>=0){setCash(v);enhance();}
},600);
});
}
var cd=document.getElementById('poCode');if(cd&&window.lastTicker)cd.value=window.lastTicker;
var px=document.getElementById('poPx');
if(px&&window.lastTicker&&typeof cachePrice==='function'){var cp=cachePrice(window.lastTicker);if(cp)px.value=cp;}
var rs=document.getElementById('poRisk');if(rs)rs.onchange=function(){enhance();};
mountChips();
enhance();
}
async function enhance(){
if(busy)return;
var body=document.getElementById('poBody');
if(!body)return;
busy=true;
try{
var d=derive();
var ext=extPositions();
if(d.log.length===0&&ext.length){
var ib='<div style="font-size:0.74rem;padding:8px 10px;border:1px solid rgba(251,191,36,.4);border-radius:12px;background:rgba(251,191,36,.08);margin-bottom:8px;color:var(--yellow);">📥 Ditemukan '+ext.length+' posisi di Portfolio core yang belum ada di ledger.<br><button class="btn-copy" style="margin-top:6px;" onclick="PORTOPRO.importExt()">📥 Impor ke Ledger (sekali saja)</button></div>';
body.innerHTML=ib;
mountChips();
busy=false;
return;
}
if(d.log.length>0)syncCore(d.pos);
var codes=Object.keys(d.pos);
var cand=window.lastTicker;
var all=codes.slice();
if(cand&&all.indexOf(cand)<0)all.push(cand);
var info={};
var settled=await Promise.allSettled(all.map(function(c){return SW.candle(c,'1y');}));
settled.forEach(function(res,i){
if(res.status!=='fulfilled')return;
var A=SW.arrays(res.value);var n=A.c.length;if(n<30)return;
var atr=SW.atr(A.h,A.l,A.c,14)[n-1]||A.c[n-1]*0.02;
var price=(typeof cachePrice==='function'&&cachePrice(all[i]))||A.c[n-1];
var ma20=SW.sma(A.c,20)[n-1];
var sup=SW.lowest(A.l,n-20,n);
info[all[i]]={price:price,atr:atr,ma20:ma20,sup:sup};
});
var mv=0;var heatRp=0;var unrl=0;var rows=[];
for(var i=0;i<codes.length;i++){
var code=codes[i];var p=d.pos[code];
if(p.lot<=0)continue;
var inf=info[code];
var price=inf?inf.price:p.avg;
var atr=inf?inf.atr:price*0.02;
var val=p.lot*100*price;
var u=val-p.lot*100*p.avg;
mv+=val;unrl+=u;
heatRp+=Math.min(p.lot*100*2*atr,p.lot*100*price*0.5);
rows.push({code:code,lot:p.lot,avg:p.avg,price:price,val:val,u:u,real:d.realized[code]||0,life:d.life[code]});
}
var csh=cash();
var equity=csh+mv;
var heatPct=equity>0?heatRp/equity*100:0;
var realTotal=0;var rk=Object.keys(d.realized);
for(var r=0;r<rk.length;r++)realTotal+=d.realized[rk[r]];
var grand=realTotal+unrl;
var riskSel=document.getElementById('poRisk');
var riskPct=riskSel?parseFloat(riskSel.value):1;
var budget=equity*riskPct/100;
var h='<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:6px;">🔗 Sumber data Doctor / Heat / Plan Pro = ledger ini (sync otomatis tiap refresh).</div>';
h+='<div class="metric-grid" style="margin-bottom:8px;">';
h+='<div class="metric-box"><div class="metric-label">Cash</div><div class="metric-value">Rp '+fmt(csh)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Nilai Pasar</div><div class="metric-value">Rp '+fmt(mv)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Total Equity</div><div class="metric-value" style="color:#fff;">Rp '+fmt(equity)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Cash / Invested</div><div class="metric-value">'+(equity>0?(csh/equity*100).toFixed(0):0)+'% / '+(equity>0?(mv/equity*100).toFixed(0):0)+'%</div></div>';
h+='</div>';
h+='<div style="font-size:0.72rem;padding:6px 8px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin-bottom:8px;">🌡️ Heat vs Equity: <strong class="'+(heatPct<3?'green':heatPct<=6?'yellow':'red')+'">'+heatPct.toFixed(1)+'%</strong> • Risk budget '+riskPct+'% = Rp '+fmt(budget)+' • Buying power Rp '+fmt(csh)+'</div>';
h+='<div class="metric-grid" style="margin-bottom:8px;">';
h+='<div class="metric-box"><div class="metric-label">Realized P&L</div><div class="metric-value '+(realTotal>=0?'green':'red')+'">'+(realTotal>=0?'+':'')+'Rp '+fmt(realTotal)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Unrealized P&L</div><div class="metric-value '+(unrl>=0?'green':'red')+'">'+(unrl>=0?'+':'')+'Rp '+fmt(unrl)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Total P&L</div><div class="metric-value '+(grand>=0?'green':'red')+'">'+(grand>=0?'+':'')+'Rp '+fmt(grand)+'</div></div>';
h+='<div class="metric-box"><div class="metric-label">Posisi terbuka</div><div class="metric-value">'+rows.length+'</div></div>';
h+='</div>';
if(cand&&info[cand]){
var inf2=info[cand];
var entry=inf2.ma20;var sl=inf2.sup-0.3*inf2.atr;
var per=entry-sl;
var lotRisk=per>0?Math.floor(budget/per/100):0;
var lotCash=Math.floor(csh/inf2.price/100);
var lot=Math.min(lotRisk,lotCash);
var constrained=lotCash<lotRisk;
h+='<div style="font-size:0.72rem;padding:6px 8px;border:1px solid var(--card-border);border-radius:10px;background:var(--card-bg);margin-bottom:8px;">🧮 Sizing '+cand+' vs equity: <strong style="color:#fff;">'+lot+' lot</strong> (risiko Rp '+fmt(lot*100*per)+') '+(constrained?'<span class="yellow">⚠ cash membatasi - ukuran penuh butuh Rp '+fmt(lotRisk*100*inf2.price)+'</span>':'<span class="green">🟢 cash cukup</span>')+'</div>';
}
h+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin:6px 0 4px;">📦 Posisi & Lifecycle</div>';
if(!rows.length)h+='<div style="font-size:0.72rem;">Belum ada posisi terbuka. Catat BUY pertama Anda di atas.</div>';
for(var p2=0;p2<rows.length;p2++){
var rw=rows[p2];
var w=equity>0?rw.val/equity*100:0;
var firstLot=rw.life&&rw.life.length?rw.life[0].lot:rw.lot;
h+='<div style="padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.08);">';
h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">';
h+='<span><strong style="color:#fff;">'+rw.code+'</strong> <span style="font-size:0.68rem;">'+rw.lot+' lot @ '+fmt(rw.avg)+' • berat '+w.toFixed(0)+'%</span></span>';
h+='<span style="font-size:0.7rem;" class="'+(rw.u>=0?'green':'red')+'">'+(rw.u>=0?'+':'')+'Rp '+fmt(rw.u)+'</span>';
h+='</div>';
h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">';
h+='<span style="font-size:0.66rem;">realized '+(rw.real>=0?'+':'')+'Rp '+fmt(rw.real)+' • now '+fmt(rw.price)+'</span>';
h+=lifeSvg(rw.life);
h+='</div>';
if(firstLot>rw.lot)h+='<div style="font-size:0.66rem;color:var(--yellow);">🧭 '+firstLot+' lot → '+rw.lot+' lot (sebagian dijual, realized tercatat)</div>';
h+='</div>';
}
h+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin:8px 0 4px;">🧾 Ledger Transaksi (30 terakhir)</div>';
h+='<div id="poLog">';
var log=d.log.slice(-30).reverse();
if(!log.length)h+='<div style="font-size:0.72rem;">Ledger kosong.</div>';
for(var L=0;L<log.length;L++){
var t=log[L];
var sc=t.side==='BUY'?'green':'red';
var rz=t.side==='SELL'&&t.realized!=null?' • realized '+(t.realized>=0?'+':'')+'Rp '+fmt(t.realized):'';
h+='<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.05);">';
h+='<span><span class="'+sc+'" style="font-weight:800;">'+t.side+'</span> '+t.t+' '+t.lot+' lot @ '+fmt(t.px)+' <span style="color:var(--text-muted);font-size:0.62rem;">'+new Date(t.d).toLocaleDateString('id-ID')+'</span>'+rz+'</span>';
h+='<button class="btn-mini" onclick="PORTOPRO.delTx('+t.id+')">✕</button>';
h+='</div>';
}
h+='</div>';
body.innerHTML=h;
mountChips();
}catch(e){body.innerHTML='<span style="color:var(--red);">Gagal: '+esc(e.message)+'</span>';}
busy=false;
}
window.PORTOPRO={
open:function(){
switchTab('porto');
setTimeout(function(){
var card=document.getElementById('portoproCard');
if(card){card.scrollIntoView({behavior:'smooth',block:'start'});card.classList.remove('po-flash');void card.offsetWidth;card.classList.add('po-flash');}
},250);
},
refresh:function(){busy=false;enhance();},
saveCash:function(){
var inp=document.getElementById('poCash');
var v=parseFloat(inp?inp.value:0);
if(!isFinite(v)||v<0){toast('Cash tidak valid.');return;}
setCash(v);toast('💾 Cash disimpan: Rp '+fmt(v));enhance();
},
importExt:function(){
var ext=extPositions();
if(!ext.length){toast('Tidak ada posisi core untuk diimpor.');return;}
var list=txs();
for(var i=0;i<ext.length;i++){
list.push({id:Date.now()+i,t:ext[i].t,side:'BUY',lot:ext[i].lot,px:ext[i].avg,d:Date.now()});
}
saveTxs(list);
var d=derive();
syncCore(d.pos);
toast('📥 '+ext.length+' posisi diimpor ke ledger. Doctor/Heat kini membaca ledger.');
enhance();
},
addTx:function(){
var code=(document.getElementById('poCode').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
var side=document.getElementById('poSide').value;
var lot=parseFloat(document.getElementById('poLot').value);
var px=parseFloat(document.getElementById('poPx').value);
if(!code||!lot||lot<=0||!px||px<=0){toast('Lengkapi kode, lot, harga.');return;}
var d=derive();
if(side==='SELL'){
var have=d.pos[code]?d.pos[code].lot:0;
if(lot>have){toast('SELL '+lot+' lot melebihi kepemilikan '+have+' lot.');return;}
}
var list=txs();
list.push({id:Date.now()+Math.floor(Math.random()*999),t:code,side:side,lot:lot,px:px,d:Date.now()});
saveTxs(list);
var nd=derive();
syncCore(nd.pos);
if(side==='SELL'){
var lt=list[list.length-1];
toast('🧾 SELL tercatat '+(lt.realized!=null?'(realized '+(lt.realized>=0?'+':'')+'Rp '+fmt(lt.realized)+')':''));
}else{
toast('🧾 BUY tercatat '+code+' '+lot+' lot.');
}
document.getElementById('poLot').value='';
enhance();
},
delTx:function(id){
undoSnap={txs:txs(),cash:cash()};
var list=txs().filter(function(t){return t.id!==id;});
saveTxs(list);
var d=derive();syncCore(d.pos);
showUndo('Transaksi dihapus.');
enhance();
},
undo:function(){
if(!undoSnap){toast('Tidak ada yang bisa di-undo.');return;}
saveTxs(undoSnap.txs);setCash(undoSnap.cash);
var c=document.getElementById('poCash');if(c)c.value=undoSnap.cash||'';
var d=derive();syncCore(d.pos);
undoSnap=null;
var bar=document.getElementById('poUndoBar');if(bar)bar.style.display='none';
toast('↩ Undo berhasil.');
enhance();
},
sync:function(){
var d=derive();syncCore(d.pos);
toast('🔄 Ledger di-sync ke Doctor/Heat/Plan/core.');
enhance();
},
reset:function(){
if(!window.confirm('Hapus seluruh ledger & cash?'))return;
undoSnap={txs:txs(),cash:cash()};
saveTxs([]);setCash(0);
var c=document.getElementById('poCash');if(c)c.value='';
syncCore({});
showUndo('Ledger direset.');
enhance();
},
copy:function(){
var d=derive();
var csh=cash();var mv=0;var lines=[];
var ks=Object.keys(d.pos);
for(var i=0;i<ks.length;i++){var p=d.pos[ks[i]];if(p.lot<=0)continue;var inf=(typeof cachePrice==='function'&&cachePrice(ks[i]))||p.avg;mv+=p.lot*100*inf;lines.push(ks[i]+' '+p.lot+' lot @ '+fmt(p.avg));}
var t='PORTFOLIO PRO'+NL+'Cash Rp '+fmt(csh)+NL+'Nilai Pasar Rp '+fmt(mv)+NL+'Equity Rp '+fmt(csh+mv)+NL+lines.join(NL);
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('📋 Ringkasan disalin.');}).catch(function(){window.prompt('Ringkasan:',t);});}
else window.prompt('Ringkasan:',t);
},
equity:function(){return quickEquity().eq;},
cash:cash,
positions:function(){return derive().pos;},
realized:function(){return derive().realized;}
};
setTimeout(mount,1200);
var trendEl=document.getElementById('valTrend');
if(trendEl){
var ob=new MutationObserver(function(){clearTimeout(ob._t);ob._t=setTimeout(function(){
var cd=document.getElementById('poCode');if(cd&&window.lastTicker)cd.value=window.lastTicker;
var px=document.getElementById('poPx');if(px&&window.lastTicker&&typeof cachePrice==='function'){var cp=cachePrice(window.lastTicker);if(cp)px.value=cp;}
enhance();
},1200);});
ob.observe(trendEl,{childList:true,characterData:true,subtree:true});
}
if(!window.__portoproTick){
window.__portoproTick=setInterval(function(){
var tab=document.getElementById('tab-porto');
if(tab&&tab.className.indexOf('active')>=0)enhance();
},60000);
}
})();
/* END portopro v3 */
