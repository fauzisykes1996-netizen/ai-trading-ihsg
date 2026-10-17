/* pwa.js - PWA install + Alert 24/7 via ntfy.sh + Daily Brief */
(function(){
 if(!window.P)return;

 (function(){
  var st=document.createElement('style');
  st.textContent='#pwaFab{position:fixed;left:14px;bottom:92px;z-index:300;width:52px;height:52px;border-radius:50%;border:1px solid var(--accent);background:linear-gradient(135deg,rgba(236,72,153,.92),rgba(251,146,60,.92));color:#fff;font-size:1.4rem;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);}#pwaPanel{position:fixed;inset:0;z-index:400;background:var(--bg,#06090f);display:flex;flex-direction:column;padding:14px;overflow-y:auto;}.pwa-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:14px;margin-bottom:12px;}.pwa-card h3{margin:0 0 8px 0;color:#fff;font-size:0.92rem;}.pwa-card p{margin:4px 0;font-size:0.76rem;color:var(--text-muted);line-height:1.5;}';
  document.head.appendChild(st);
 })();

 function ntfyTopic(){return localStorage.getItem('ihsg_ntfy')||'';}
 function saveNtfy(t){localStorage.setItem('ihsg_ntfy',t||'');}

 var fab=document.createElement('button');
 fab.id='pwaFab';fab.innerText='📱';
 fab.onclick=function(){window.openPWA();};
 document.body.appendChild(fab);

 var panel=document.createElement('div');
 panel.id='pwaPanel';panel.style.display='none';
 panel.innerHTML='<div style="display:flex;align-items:center;padding-bottom:10px;"><strong style="flex:1;color:#fff;font-size:1rem;">📱 PWA & Alert 24/7</strong><button class="btn-mini" onclick="closePWA()">✕</button></div>'+
  '<div class="pwa-card"><h3>📲 Install Aplikasi</h3>'+
  '<p>Install di home screen supaya akses cepat + dapat notifikasi push.</p>'+
  '<p><strong>iPhone:</strong> buka di Safari → tombol Share (⬆) → "Tambah ke Layar Utama".</p>'+
  '<p><strong>Android/Chrome:</strong> klik tombol di bawah.</p>'+
  '<button class="btn-action" id="pwaInstall" style="margin-top:8px;display:none;">Install Aplikasi</button>'+
  '<div id="pwaInstalled" style="color:var(--green);font-size:0.76rem;margin-top:6px;display:none;">✅ Aplikasi ter-install</div></div>'+
  '<div class="pwa-card"><h3>🔔 Alert 24/7 (via ntfy.sh)</h3>'+
  '<p>Biar alert swing, BSJP, & price target jalan <strong>walau aplikasi ditutup</strong>, pakai ntfy.sh (gratis, tanpa akun).</p>'+
  '<div style="margin-top:8px;">'+
  '<label style="font-size:0.7rem;color:var(--text-muted);">Topik ntfy Anda (contoh: "ihsg-saya-123")</label>'+
  '<input type="text" id="ntfyTopic" class="fv-input" placeholder="topik-ntfy-unik-anda" style="margin-top:4px;">'+
  '<button class="btn-copy" style="margin-top:8px;" onclick="saveNtfyTopic()">💾 Simpan Topik</button>'+
  '<button class="btn-copy" style="margin-top:4px;" onclick="testNtfy()">🧪 Kirim Tes Notifikasi</button></div>'+
  '<p style="margin-top:8px;">1. Install app <a href="https://ntfy.sh/" target="_blank" style="color:var(--accent);">ntfy.sh</a> di HP (gratis).</p>'+
  '<p>2. Subscribe topik yang sama di app ntfy Anda.</p>'+
  '<p>3. Klik "Kirim Tes" - notifikasi muncul di HP dalam 2 detik.</p>'+
  '<p style="font-size:0.68rem;">Aplikasi ini otomatis kirim alert saat kondisi terpenuhi (cek setiap 5 menit saat app buka; saat app ditutup, pakai Daily Brief di bawah).</p></div>'+
  '<div class="pwa-card"><h3>📋 Daily Brief (email)</h3>'+
  '<p>Rangkuman harian dikirim ke email jam 7 pagi (sebelum market buka): top-3 shortlist, alert pending, regime pasar.</p>'+
  '<label style="font-size:0.7rem;color:var(--text-muted);">Email untuk daily brief</label>'+
  '<input type="email" id="briefEmail" class="fv-input" placeholder="anda@email.com" style="margin-top:4px;">'+
  '<button class="btn-copy" style="margin-top:8px;" onclick="saveBriefEmail()">💾 Simpan & Aktifkan</button>'+
  '<div id="briefStatus" style="font-size:0.72rem;margin-top:6px;"></div></div>'+
  '<div class="pwa-card" style="background:rgba(124,58,237,.15);border-color:rgba(124,58,237,.3);"><h3>🧠 Tips Disiplin</h3>'+
  '<p>• Notifikasi bukan sinyal beli - tetap konfirmasi lewat Grader & Swing Plan.</p>'+
  '<p>• Matikan notifikasi di weekend (bursa tutup).</p>'+
  '<p>• Revisi topik ntfy kalau sudah bocor (ganti angka acak).</p></div>';
 document.body.appendChild(panel);

 var topicInp=document.getElementById('ntfyTopic');
 topicInp.value=ntfyTopic();
 var briefInp=document.getElementById('briefEmail');
 briefInp.value=localStorage.getItem('ihsg_brief_email')||'';
 updateBriefStatus();

 window.openPWA=function(){panel.style.display='flex';};
 window.closePWA=function(){panel.style.display='none';};

 window.saveNtfyTopic=function(){
  var t=(topicInp.value||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-');
  if(!t){alert('Topik tidak valid. Gunakan huruf kecil, angka, atau tanda hubung.');return;}
  if(t.length<6){alert('Topik minimal 6 karakter agar tidak ditebak orang lain.');return;}
  saveNtfy(t);
  toast('🔔 Topik ntfy disimpan: '+t+' - subscribe topik yang sama di app ntfy Anda.');
 };

 window.testNtfy=async function(){
  var t=ntfyTopic();
  if(!t){alert('Simpan topik dulu.');return;}
  try{
   var r=await fetch('https://ntfy.sh/'+encodeURIComponent(t),{method:'POST',headers:{'Title':'Tes dari AI Trading','Priority':'3'},body:'Notifikasi test berhasil! App AI Trading Anda terhubung ke HP Anda 🎉'});
   if(!r.ok)throw new Error('HTTP '+r.status);
   toast('✅ Notifikasi test dikirim - cek HP Anda dalam 2 detik.');
  }catch(e){toast('⚠ Gagal kirim: '+e.message);}
 };

 window.saveBriefEmail=function(){
  var e=(briefInp.value||'').trim();
  if(e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){alert('Format email tidak valid.');return;}
  localStorage.setItem('ihsg_brief_email',e);
  updateBriefStatus();
  toast(e?'📋 Daily brief diaktifkan ke '+e:'📋 Daily brief dinonaktifkan.');
 };

 function updateBriefStatus(){
  var s=document.getElementById('briefStatus');if(!s)return;
  var e=localStorage.getItem('ihsg_brief_email');
  if(e)s.innerHTML='<span style="color:var(--green);">✅ Aktif - brief dikirim jam 7 pagi ke '+e+'</span>';
  else s.innerHTML='<span style="color:var(--text-muted);">Belum aktif - isi email untuk menerima daily brief.</span>';
 }

 // Daily brief: kirim email setiap pagi jam 7 WIB (cek tiap 15 menit)
 var lastBriefDate=localStorage.getItem('ihsg_brief_last')||'';
 async function sendBrief(){
  var email=localStorage.getItem('ihsg_brief_email');if(!email)return;
  var now=new Date();var wib=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));
  var today=wib.toISOString().slice(0,10);
  if(lastBriefDate===today)return;
  if(wib.getHours()!==7)return;
  if(wib.getDay()===0||wib.getDay()===6)return;
  var topic=ntfyTopic();
  if(!topic){localStorage.setItem('ihsg_brief_last',today);return;}
  try{
   var msg='📋 DAILY BRIEF '+today+'\n\n';
   msg+='Selamat pagi! Berikut rangkuman sebelum market buka:\n\n';
   msg+='1. Buka aplikasi di home screen 📱\n';
   msg+='2. Susun Morning Shortlist 🎯\n';
   msg+='3. Cek Market Regime (IHSG) 🌊\n';
   msg+='4. Proses top kandidat → lihat Grader 🎯\n';
   msg+='5. Setup A (≥75) = eksekusi, setup C/D (<60) = lewat\n\n';
   msg+='Disiplin > prediksi. Selamat trading!';
   var r=await fetch('https://ntfy.sh/'+encodeURIComponent(topic),{method:'POST',headers:{'Title':'📋 Daily Brief - '+today,'Priority':'4','Tags':'briefing'},body:msg});
   if(r.ok){localStorage.setItem('ihsg_brief_last',today);console.log('Daily brief sent');}
  }catch(e){console.log('Brief failed:',e.message);}
 }
 setInterval(sendBrief,15*60*1000);
 setTimeout(sendBrief,10000);

 // Override toast alert untuk kirim ke ntfy juga
 var origToast=window.toast;
 window.toast=function(msg){
  if(origToast)origToast(msg);
  var t=ntfyTopic();if(!t)return;
  if(msg.indexOf('ALERT')>=0||msg.indexOf('BSJP')>=0||msg.indexOf('terpenuhi')>=0){
   fetch('https://ntfy.sh/'+encodeURIComponent(t),{method:'POST',headers:{'Title':'⚠️ Alert Trading','Priority':'4','Tags':'warning'},body:msg}).catch(function(){});
  }
 };

 // PWA install button (Android/Chrome)
 var deferred=null;
 window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;var b=document.getElementById('pwaInstall');if(b){b.style.display='inline-block';}});
 var instBtn=document.getElementById('pwaInstall');
 if(instBtn)instBtn.onclick=async function(){if(deferred){deferred.prompt();var r=await deferred.userChoice;if(r.outcome==='accepted'){instBtn.style.display='none';var done=document.getElementById('pwaInstalled');if(done)done.style.display='block';}}};

 // Register service worker untuk cache offline
 if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
   navigator.serviceWorker.register('sw.js').catch(function(e){console.log('SW register failed:',e.message);});
  });
 }
})();
/* END pwa v1 */
