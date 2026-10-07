/* plugins.js — pemuat plugin Build v6.6 (arsitektur modular) */
(function () {
  window.P = {
    fee: 0.005,
    wib: function () { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })); },
    session: function () {
      var w = P.wib(), d = w.getDay(), m = w.getHours() * 60 + w.getMinutes();
      if (d === 0 || d === 6) return { bsjp: false, label: 'AKHIR PEKAN — bursa tutup' };
      if (m >= 870 && m <= 945) return { bsjp: true, label: 'JENDELA BSJP TERBUKA (14:30–15:45 WIB)' };
      if (m >= 540 && m < 720) return { bsjp: false, label: 'SESI I berjalan — jendela BSJP dibuka 14:30' };
      if (m >= 720 && m < 810) return { bsjp: false, label: 'ISTIRAHAT 12:00–13:30 — jendela BSJP dibuka 14:30' };
      if (m >= 810 && m < 870) return { bsjp: false, label: 'SESI II — siapkan kandidat, eksekusi setelah 14:30' };
      return { bsjp: false, label: 'PASAR TUTUP — scan memakai data penutupan terakhir' };
    },
    card: function (tabId, html, afterEl) {
      var tab = document.getElementById(tabId); if (!tab) return null;
      var div = document.createElement('div'); div.className = 'card'; div.innerHTML = html;
      if (afterEl && afterEl.parentElement === tab) tab.insertBefore(div, afterEl.nextSibling);
      else tab.appendChild(div);
      return div;
    }
  };
  function loadAll() {
    ['bsjp.js', 'quant.js', 'compare.js', 'friendly.js', 'swing.js', 'swingtools.js', 'polish.js']
.forEach(function (f) {
      var s = document.createElement('script');
      s.src = f;
      s.onerror = function () { console.warn('Plugin belum terupload (normal saat bertahap): ' + f); };
      document.body.appendChild(s);
    });
  }
  if (document.readyState === 'complete') loadAll();
  else window.addEventListener('load', loadAll);
})();
