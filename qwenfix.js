/* qwenfix.js - Penyembuh otomatis: pastikan tombol mesin Qwen selalu ada di baris mesin */
(function(){
if(!window.P)return;
function fix(){
var seg=document.querySelector('.engine-row .seg');
if(!seg){setTimeout(fix,800);return;}
var btns=seg.querySelectorAll('button');
for(var i=0;i<btns.length;i++){
var t=(btns[i].innerText||'').toLowerCase();
if(t.indexOf('qwen')>=0)return;
}
var b=document.createElement('button');
b.id='engQwen';
b.innerText='🤖 Qwen';
b.onclick=function(){if(typeof setEngine==='function')setEngine('qwen');};
var first=seg.querySelector('button');
if(first&&first.nextSibling)seg.insertBefore(b,first.nextSibling);
else seg.appendChild(b);
if(typeof updateEngineUI==='function')updateEngineUI();
}
setTimeout(fix,1200);
setTimeout(fix,4000);
})();
/* END qwenfix v1 */
