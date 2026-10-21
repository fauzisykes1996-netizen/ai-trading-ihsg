/* fixwidth.js - kunci overflow horizontal + laporkan elemen pelebar layar */
(function(){
 if(!window.P)return;
 function widest(){
  var vw=document.documentElement.clientWidth;
  var bad=[];
  var all=document.querySelectorAll('body *');
  for(var i=0;i<all.length;i++){
   var el=all[i];
   var r=el.getBoundingClientRect();
   if(r.width>vw+6&&el.tagName!=='HTML'&&el.tagName!=='BODY')bad.push(el);
  }
  return {vw:vw,bad:bad};
 }
 function nameOf(el){
  if(el.id)return '#'+el.id;
  if(el.className&&typeof el.className==='string'&&el.className.trim())return '.'+el.className.trim().split(/\s+/)[0];
  return el.tagName.toLowerCase();
 }
 function run(){
  var st=document.createElement('style');
  st.textContent='html,body{overflow-x:hidden!important;max-width:100vw!important;} .ticker-wrap{overflow:hidden!important;max-width:100vw!important;} svg{max-width:100%!important;} select{max-width:46%!important;}';
  document.head.appendChild(st);
  setTimeout(function(){
   var res=widest();
   if(res.bad.length){
    var names=[];
    for(var i=0;i<res.bad.length&&i<3;i++)names.push(nameOf(res.bad[i]));
    toast('Pelebar layar terdeteksi: '+names.join(', ')+' (sudah dikunci). Kabari Qwen ya!');
   }else{
    toast('Layout aman: tidak ada elemen melebihi lebar layar.');
   }
  },3000);
 }
 if(document.readyState==='complete')run();else window.addEventListener('load',run);
})();
/* END fixwidth v1 */
