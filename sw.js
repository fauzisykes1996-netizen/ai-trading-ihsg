/* sw.js - Service Worker: cache offline untuk app AI Trading */
var CACHE='ihsg-v6.9-r1';
var ASSETS=['index.html','plugins.js','bsjp.js','quant.js','compare.js','friendly.js','swcore.js','swscan.js','swlab.js','swx.js','freeai.js','aichat.js','agent-bandar.js','agent-moneyflow.js','agent-regime.js','agent-grader.js','agent-extras.js','multilab.js','poheat.js','shortlist.js','pwa.js','manifest.json','icon-192.svg','icon-512.svg'];

self.addEventListener('install',function(e){
 e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}));
 self.skipWaiting();
});

self.addEventListener('activate',function(e){
 e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}));
 self.clients.claim();
});

self.addEventListener('fetch',function(e){
 if(e.request.method!=='GET')return;
 var url=new URL(e.request.url);
 // Selalu network-first untuk API & data
 if(url.hostname!=='fauzisykes1996-netizen.github.io'||url.pathname.indexOf('/api/')>=0||url.search.indexOf('url=')>=0){
  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));
  return;
 }
 // Stale-while-revalidate untuk asset
 e.respondWith(caches.match(e.request).then(function(r){
  var fetchPromise=fetch(e.request).then(function(res){
   if(res&&res.status===200){var clone=res.clone();caches.open(CACHE).then(function(c){c.put(e.request,clone);});}
   return res;
  }).catch(function(){return null;});
  return r||fetchPromise;
 }));
});
/* END sw v1 */
