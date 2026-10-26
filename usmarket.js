/* usmarket.js v2 - Saklar IHSG/US + universe US + fundamental US + label benchmark */
(function(){
if(!window.P)return;
var KEY='ihsg_market';
var US_UNIV=["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AVGO","AMD","COST","NFLX","CRM","ORCL","ADBE","PEP","KO","DIS","INTC","QCOM","TXN","MU","SBUX","NKE","MCD","JPM","GS","V","MA","UNH","LLY","XOM","CVX","WMT","BA","CAT","IBM","UBER","COIN","PLTR","SOFI","MSTR","SMCI","ARM","ABNB","DKNG","HOOD","MRVL","PANW","CRWD"];
function mode(){return localStorage.getItem(KEY)||'ID';}
function benchLabel(){return mode()==='US'?'S&P 500':'IHSG';}
window.MKT={mode:mode,set:setMode,US_UNIV:US_UNIV,bench:benchLabel};
var origFC=window.fetchChart;
window.fetchChart=function(symbol,range,interval){
var s=symbol;
if(mode()==='US'){
if(s==='^JKSE')s='^GSPC';
else if(s.slice(-3)==='.JK')s=s.slice(0,s.length-3);
}
return origFC(s,range,interval);
};
var origFetch=window.fetch;
window.fetch=function(input,init){
if(mode()==='US'&&typeof input==='string'&&input.indexOf('quoteSummary')>=0){
if(input.indexOf('.JK%3F')>=0)input=input.replace('.JK%3F','%3F');
else if(input.indexOf('.JK?')>=0)input=input.replace('.JK?','?');
}
return origFetch(input,init);
};
function setMode(m){
localStorage.setItem(KEY,m);
paint();
banner();
renameSvg();
if(m==='US')toast('🇺🇸 Mode US: ticker US, benchmark S&P 500, fundamental US aktif, scanner pakai universe US.');
else toast('🇮 Mode IHSG aktif kembali.');
}
function paint(){
var a=document.getElementById('mktID');
var b=document.getElementById('mktUS');
if(!a||!b)return;
var m=mode();
a.style.opacity=m==='ID'?'1':'0.4';
b.style.opacity=m==='US'?'1':'0.4';
a.style.border=m==='ID'?'1px solid var(--green)':'1px solid var(--card-border)';
b.style.border=m==='US'?'1px solid var(--green)':'1px solid var(--card-border)';
}
function banner(){
var tab=document.getElementById('tab-analysis');
if(!tab)return;
var old=document.getElementById('usBanner');
if(old)old.remove();
if(mode()!=='US')return;
var div=document.createElement('div');
div.id='usBanner';
div.style.cssText='font-size:0.7rem;padding:8px 10px;border:1px solid rgba(56,189,248,.4);border-radius:12px;background:rgba(56,189,248,.08);color:var(--accent);margin-bottom:10px;';
div.innerHTML='🇺 <strong>MODE US AKTIF</strong> - benchmark kartu = S&P 500, fundamental Yahoo US aktif, scanner 🏆/📊 memakai universe US.';
tab.insertBefore(div,tab.firstChild);
}
function renameSvg(){
if(mode()!=='US')return;
var ts=document.querySelectorAll('svg text');
for(var i=0;i<ts.length;i++){
var t=ts[i].textContent||'';
if(t.indexOf('IHSG')>=0)ts[i].textContent=t.split('IHSG').join('S&P 500');
}
}
function build(){
var row=document.querySelector('.engine-row');
if(!row){setTimeout(build,800);return;}
if(!document.getElementById('mktUS')){
var wrap=document.createElement('div');
wrap.style.cssText='display:flex;gap:4px;margin-left:6px;';
wrap.innerHTML='<button id="mktID" class="btn-mini" title="Pasar Indonesia">🇮🇩</button><button id="mktUS" class="btn-mini" title="Pasar Amerika">🇺🇸</button>';
row.appendChild(wrap);
document.getElementById('mktID').onclick=function(){setMode('ID');};
document.getElementById('mktUS').onclick=function(){setMode('US');};
}
paint();
banner();
}
setTimeout(build,1000);
var mo=new MutationObserver(function(){
clearTimeout(mo._t);
mo._t=setTimeout(renameSvg,400);
});
if(document.body)mo.observe(document.body,{childList:true,subtree:true});
})();
/* END usmarket v2 */
