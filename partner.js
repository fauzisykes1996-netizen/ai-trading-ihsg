/* partner.js - Trading Partner Mode: bagikan setup lewat link & terima setup partner */
(function(){
 if(!window.P)return;
 var NL=String.fromCharCode(10);
 function enc(obj){return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));}
 function dec(str){try{return JSON.parse(decodeURIComponent(escape(atob(str))));}catch(e){return null;}}
 function cleanCode(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);}
 function firstNum(t){var p=String(t).split(/[^0-9]+/);return p[1]||p[0]||'';}
 function addShareBtn(){
  var plan=document.getElementById('swPlan');
  if(!plan){setTimeout(addShareBtn,1000);return;}
  var card=plan.closest('.card');if(!card)return;
  if(document.getElementById('shareBtn'))return;
  var b=document.createElement('button');
  b.className='btn-copy';b.id='shareBtn';b.innerText='🤝 Bagikan Setup';
  b.onclick=shareSetup;
  card.appendChild(b);
 }
 function shareSetup(){
  var plan=document.getElementById('swPlan');
  var gr=document.getElementById('graderOut');
  var code=cleanCode(window.lastTicker);
  if(!code||!plan){alert('Proses saham dulu sebelum membagikan setup.');return;}
  var score=gr?firstNum(gr.innerText):'';
  var obj={c:code,d:new Date().toLocaleDateString('id-ID'),s:score,p:plan.innerText.slice(0,900)};
  var url=location.origin+location.pathname+'?share='+enc(obj);
  if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(url).then(function(){toast('🤝 Link setup disalin - kirim ke partner Anda!');}).catch(function(){window.prompt('Salin link:',url);});
  }else{window.prompt('Salin link:',url);}
 }
 function readShare(){
  var q=location.search;var i=q.indexOf('share=');
  if(i<0)return null;
  var v=q.slice(i+6);var amp=v.indexOf('&');if(amp>=0)v=v.slice(0,amp);
  return dec(v);
 }
 function showShare(data){
  var code=cleanCode(data.c);if(!code)return;
  var tab=document.getElementById('tab-analysis');if(!tab)return;
  var div=document.createElement('div');div.className='card';
  var body=(data.s?'Skor Grader partner: '+data.s+NL:'')+(data.p||'');
  div.innerHTML='<div class="card-title"><span>🤝 Setup dari Partner</span><span class="agent-pill tech">'+code+' - '+esc(data.d||'')+'</span></div>'+
   '<div class="report-card" style="margin-top:0;white-space:pre-wrap;">'+esc(body)+'</div>'+
   '<button class="btn-copy" onclick="loadShared(\''+code+'\')">⚡ Proses saham ini & bandingkan</button>';
  tab.insertBefore(div,tab.firstChild);
  toast('🤝 Setup partner dimuat: '+code);
 }
 window.loadShared=function(c){
  switchTab('analysis');
  setTimeout(function(){
   var inp=document.querySelector('input[placeholder*="KODE SAHAM"]');
   if(inp)inp.value=c;
   var btns=document.querySelectorAll('button');
   for(var b=0;b<btns.length;b++){if((btns[b].innerText||'').trim()==='Proses'){btns[b].click();break;}}
  },300);
 };
 addShareBtn();
 var sh=readShare();
 if(sh)setTimeout(function(){showShare(sh);},800);
})();
/* END partner v1 */
