/* usmarket.js v4 - Saklar IHSG/US di HEADER + penambal URL menyeluruh + universe US + label */
(function(){
if(!window.P)return;
var KEY='ihsg_market';
var US_UNIV=["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","AVGO","AMD","COST","NFLX","CRM","ORCL","ADBE","PEP","KO","DIS","INTC","QCOM","TXN","MU","SBUX","NKE","MCD","JPM","GS","V","MA","UNH","LLY","XOM","CVX","WMT","BA","CAT","IBM","UBER","COIN","PLTR","SOFI","MSTR","SMCI","ARM","ABNB","DKNG","HOOD","MRVL","PANW","CRWD"];
function mode(){return localStorage.getItem(KEY)||'ID';}
function benchLabel(){return mode()==='US'?'S&P 500':'IHSG';}
window.MKT={mode:mode,set:setMode,US_UNIV:US_UNIV,bench:benchLabel};
function patchUrl(s){
if(typeof s!=='string')return s;
if(mode()!=='US')return s;
var out=s;
if(out.indexOf('^JKSE')>=0)out=out.split('^JKSE').join('^GSPC');
if(out.indexOf('.JK')>=0){
out=out.split('.JK%3F').join('%3F');
out=out.split('.JK?').join('?');
out=out.split('.JK%26').join('%26');
out=out.split('.JK&').join('&');
out=out.split('.JK%2C').join('%2C');
out=out.split('.JK,').join(',');
}
return out;
}
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
if(mode()==='US'){
if(typeof input==='string')input=patchUrl(input);
if(init&&typeof init.body==='string'){
var nb=patchUrl(init.body);
if(nb!==init.body){
var ninit={};
for(var k in init)ninit[k]=init[k];
ninit.body=nb;
init=ninit;
}
}
}
return origFetch(input,init);
};
function setMode(m){
localStorage.setItem(KEY,m);
paint();
banner();
renameSvg();
if(m==='US')toast('🇺 Mode US: ticker US, benchmark S&P 500, scanner universe US.');
else toast('🇮🇩 Mode IHSG aktif kembali.');
}
function paint(){
var a=document.getElementById('mktID');
var b=document.getElementById('mktUS');
if(!a||!b)return;
var m=mode();
a.style.opacity=m==='ID'?'1':'0.4';
b.style.opacity=m==='US'?'1':'0.4';
a.style.border=m==='ID'?'2px solid var(--green)':'2px solid var(--card-border)';
b.style.border=m==='US'?'2px solid var(--green)':'2px solid var(--card-border)';
}
function makeWrap(){
var wrap=document.createElement('div');
wrap.style.cssText='display:flex;gap:6px;margin-left:auto;align-self:center;';
wrap.innerHTML='<button id="mktID" style="font-size:1.05rem;padding:6px 12px;border-radius:12px;background:var(--card-bg);cursor:pointer;" title="Pasar Indonesia">🇮🇩</button><button id="mktUS" style="font-size:1.05rem;padding:6px 12px;border-radius:12px;background:var(--card-bg);cursor:pointer;" title="Pasar Amerika">🇺🇸</button>';
return wrap;
}
function findHeader(){
var cand=document.querySelector('header');
if(cand)return cand;
var all=document.querySelectorAll('div');
for(var i=0;i<all.length;i++){
var t=all[i].innerText||'';
if(t.indexOf('Key Aktif')>=0&&t.indexOf('Swing ON')>=0&&t.length<300)return all[i];
}
return null;
}
function build(){
var old=document.getElementById('mktUS');
var target=findHeader()||document.querySelector('.engine-row');
if(!target){setTimeout(build,800);return;}
if(old){
var wrapOld=old.parentElement;
if(wrapOld&&wrapOld.parentElement!==target)target.appendChild(wrapOld);
}else{
target.appendChild(makeWrap());
document.getElementById('mktID').onclick=function(){setMode('ID');};
document.getElementById('mktUS').onclick=function(){setMode('US');};
}
paint();
banner();
}
function banner(){
var tab=document.getElementById('tab-analysis');
if(!tab)return;
var oldB=document.getElementById('usBanner');
if(oldB)oldB.remove();
if(mode()!=='US')return;
var div=document.createElement('div');
div.id='usBanner';
div.style.cssText='font-size:0.7rem;padding:8px 10px;border:1px solid rgba(56,189,248,.4);border-radius:12px;background:rgba(56,189,248,.08);color:var(--accent);margin-bottom:10px;';
div.innerHTML='🇺🇸 <strong>MODE US AKTIF</strong> - benchmark kartu = S&P 500, scanner 🏆/ memakai universe US.';
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
setTimeout(build,1000);
var mo=new MutationObserver(function(){
clearTimeout(mo._t);
mo._t=setTimeout(renameSvg,400);
});
if(document.body)mo.observe(document.body,{childList:true,subtree:true});
})();
/* END usmarket v4 */
