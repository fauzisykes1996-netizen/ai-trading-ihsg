/* usmarket.js v1 - Saklar pasar IHSG/US: membelokkan simbol & benchmark di pintu data */
(function(){
if(!window.P)return;
var KEY='ihsg_market';
function mode(){return localStorage.getItem(KEY)||'ID';}
function setMode(m){
localStorage.setItem(KEY,m);
paint();
if(m==='US')toast('🇺 Mode US aktif: ketik ticker US (AAPL, NVDA, TSLA...). Benchmark = S&P 500.');
else toast('🇮🇩 Mode IHSG aktif: ketik kode BEI seperti biasa.');
}
window.MKT={mode:mode,set:setMode};
var orig=window.fetchChart;
window.fetchChart=function(symbol,range,interval){
var s=symbol;
if(mode()==='US'){
if(s==='^JKSE')s='^GSPC';
else if(s.slice(-3)==='.JK')s=s.slice(0,s.length-3);
}
return orig(s,range,interval);
};
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
window.MKT.paint=paint;
function build(){
var row=document.querySelector('.engine-row');
if(!row){setTimeout(build,800);return;}
if(document.getElementById('mktUS')){paint();return;}
var wrap=document.createElement('div');
wrap.style.cssText='display:flex;gap:4px;margin-left:6px;';
wrap.innerHTML='<button id="mktID" class="btn-mini" title="Pasar Indonesia">🇮</button><button id="mktUS" class="btn-mini" title="Pasar Amerika">🇺🇸</button>';
row.appendChild(wrap);
document.getElementById('mktID').onclick=function(){setMode('ID');};
document.getElementById('mktUS').onclick=function(){setMode('US');};
paint();
}
setTimeout(build,1000);
})();
/* END usmarket v1 */
