/* screenerpro v2 - Screener Peluang Hari Ini: multi-index, rules live, saved views, drawer, bulk, undo + hapus permanen alat value-scan lama */
(function(){
if(!window.P||!window.SW)return;
var SW=window.SW;
var NL=String.fromCharCode(10);
var IDX={};
IDX.IDX30=['BBCA','BBRI','BMRI','BBNI','TLKM','ASII','UNVR','ICBP','INDF','KLBF','ADRO','PTBA','ITMG','ANTM','MDKA','INCO','TPIA','BRPT','CPIN','JPFA','MAPI','ACES','AMRT','ESSA','MEDC','PGAS','SMGR','INTP','UNTR','AALI'];
IDX.LQ45=IDX.IDX30.concat(['BRIS','BBTN','TOWR','TBIG','EXCL','ISAT','EMTK','SCMA','MNCN','GOTO','AMMN','NCKL','MBMA','HRUM','AKRA']);
IDX.IDX80=IDX.LQ45.concat(['BUKA','RAJA','DSNG','TAPG','LSIP','SIMP','MIKA','HEAL','SIDO','MYOR','ULTJ','ROTI','DMAS','SSIA','CTRA','SMRA','PWON','JSMR','WIKA','PTPP','ADHI','WEGE','NRCA','TOTO','MARK','BKSL','PANR','GJTL','SMSM','AUTO','DRMA','IMAS','INDS','KBLI']);
IDX.KOMPAS100=IDX.IDX80.concat(['BIRD','BLUE','ASSA','SMDR','TMAS','IPCC','PORT','HAIS','TCPI','DEWA','IPCM','JAYA','KARW','SAFE','LAND','MPMX','ERAA','MIDI','CSAP','KAEF']);
IDX['SRI-KEHATI']=['BBCA','BBRI','BMRI','TLKM','UNVR','ICBP','INDF','KLBF','ASII','AALI','LSIP','SMGR','INTP','PGAS','JSMR','WIKA','UNTR','SIDO','MYOR','CPIN','JPFA','MAPI','ACES','AMRT','TPIA'];
IDX.JII=['BRIS','TLKM','ASII','UNVR','ICBP','INDF','KLBF','ADRO','PTBA','ITMG','ANTM','MDKA','TPIA','BRPT','CPIN','JPFA','MAPI','ACES','AMRT','MEDC','PGAS','SMGR','INTP','UNTR','AALI','LSIP','JSMR','TOWR','TBIG','EXCL'];
IDX.ISSI=IDX.JII.concat(['ISAT','SCMA','MNCN','AMMN','NCKL','MBMA','HRUM','AKRA','ESSA','INCO','SIDO','MYOR','ULTJ','ROTI','DSNG','TAPG','SSMS','MIKA','HEAL','RAJA']);
IDX.JII70=IDX.ISSI.concat(['BIRD','ASSA','SMDR','TMAS','HAIS','TCPI','DEWA','IPCM','JAYA','MPMX','ERAA','GJTL','SMSM','AUTO','DRMA','INDS','KBLI','CSAP','KAEF','MARK']);
IDX.IDXSHAGROW=['BRIS','MDKA','NCKL','MBMA','AMMN','TPIA','BRPT','ESSA','MEDC','RAJA','HRUM','AKRA','GOTO','BUKA','EMTK','SCMA','MNCN','ACES','MAPI','AMRT','CPIN','JPFA','SIDO','MYOR','HEAL','MIKA','DRMA','AUTO','SMSM','GJTL'];
IDX.IDXCMNTY20=['ADRO','PTBA','ITMG','HRUM','ANTM','INCO','MDKA','NCKL','MBMA','TPIA','BRPT','MEDC','ESSA','AKRA','RAJA','PGAS','AALI','LSIP','DSNG','TAPG'];
IDX.ECONOMIC30=['BBCA','BBRI','BMRI','BBNI','BRIS','TLKM','ASII','UNVR','ICBP','INDF','KLBF','CPIN','JPFA','MAPI','ACES','AMRT','SMGR','INTP','UNTR','JSMR','TOWR','TBIG','EXCL','ISAT','PGAS','MEDC','ADRO','PTBA','ANTM','MDKA'];
var ALL=[];
var ik=Object.keys(IDX);
for(var ii=0;ii<ik.length;ii++){for(var jj=0;jj<IDX[ik[ii]].length;jj++){if(ALL.indexOf(IDX[ik[ii]][jj])<0)ALL.push(IDX[ik[ii]][jj]);}}
IDX['All IHSG']=ALL;
var ORDER=['All IHSG','IDX30','LQ45','SRI-KEHATI','JII','ISSI','IDXCMNTY20','JII70','IDXSHAGROW','ECONOMIC30','KOMPAS100','IDX80'];
var MET=[
{k:'ret1y',lab:'Return 1 Tahun (%)'},
{k:'pe',lab:'PER (TTM)'},
{k:'pbv',lab:'PBV'},
{k:'roe',lab:'ROE (%)'},
{k:'revG',lab:'Pertumbuhan Revenue (%)'},
{k:'niG',lab:'Pertumbuhan Laba (%)'},
{k:'niB',lab:'Laba Bersih (Miliar Rp)'},
{k:'mos',lab:'Margin of Safety (%)'},
{k:'divY',lab:'Dividend Yield (%)'},
{k:'mcB',lab:'Market Cap (Miliar Rp)'},
{k:'de',lab:'DER (%)'},
{k:'vr',lab:'Rasio Volume 20h'},
{k:'rsi',lab:'RSI 14'},
{k:'slope',lab:'Slope MA50 (%)'}
];
var OPS=['<','<=','>','>='];
var PRESETS={
'Value Dalam':[{m:'ret1y',op:'<=',v:0},{m:'pe',op:'<',v:15},{m:'pbv',op:'<',v:1.5},{m:'roe',op:'>',v:12},{m:'revG',op:'>',v:1},{m:'niG',op:'>',v:5},{m:'mos',op:'>',v:20}],
'Growth Murah':[{m:'revG',op:'>',v:10},{m:'niG',op:'>',v:10},{m:'roe',op:'>',v:15},{m:'pe',op:'<',v:25}],
'Dividen':[{m:'divY',op:'>',v:3},{m:'pe',op:'<',v:15},{m:'de',op:'<',v:100},{m:'roe',op:'>',v:10}],
'Momentum Sehat':[{m:'ret1y',op:'>',v:10},{m:'slope',op:'>',v:0},{m:'rsi',op:'<',v:70},{m:'vr',op:'>',v:1}],
'Quality':[{m:'roe',op:'>',v:15},{m:'de',op:'<',v:80},{m:'niG',op:'>',v:0},{m:'pe',op:'<',v:20}]
};
function rules(){var r=lsJSON('sp_rules',null);if(Array.isArray(r)&&r.length)return r;return PRESETS['Value Dalam'].slice();}
function saveRules(r){saveLS('sp_rules',r);}
function indices(){var r=lsJSON('sp_idx',null);if(Array.isArray(r)&&r.length)return r;return ['LQ45','IDX80'];}
function saveIndices(r){saveLS('sp_idx',r);}
function views(){var r=lsJSON('sp_views',[]);return Array.isArray(r)?r:[];}
function saveViews(r){saveLS('sp_views',r);}
function legacyOff(){var v=lsJSON('sp_legacy_off',null);return v==null?true:!!v;}
function setLegacyOff(v){saveLS('sp_legacy_off',v?1:0);}
function killLegacy(){
if(!legacyOff())return;
var tab=document.getElementById('tab-market');
if(!tab)return;
var titles=tab.querySelectorAll('.card-title');
for(var i=0;i<titles.length;i++){
var card=titles[i].closest('.card');
if(!card||card.id==='screenerproCard')continue;
var t=(titles[i].innerText||'').toUpperCase();
if(t.indexOf('PELUANG HARI INI')>=0||t.indexOf('VALUE SCAN')>=0)card.remove();
}
}
function universe(){
var sel=indices();var set=[];
for(var i=0;i<sel.length;i++){var list=IDX[sel[i]];if(!list)continue;for(var j=0;j<list.length;j++){if(set.indexOf(list[j])<0)set.push(list[j]);}}
var wl=document.getElementById('spWL');
if(wl&&wl.checked){
var w=window.watchlist;
if(!Array.isArray(w))w=lsJSON('ihsg_watchlist',[]);
if(Array.isArray(w)){for(var k=0;k<w.length;k++){var c=typeof w[k]==='string'?w[k]:(w[k].t||w[k].code||'');if(c&&set.indexOf(c)<0)set.push(c);}}
}
return set;
}
function fmt(n){if(n==null||!isFinite(n))return '-';return Math.round(n).toLocaleString('id-ID');}
function f1(n){if(n==null||!isFinite(n))return '-';return n.toFixed(1);}
function injectStyle(){
if(document.getElementById('spStyle'))return;
var st=document.createElement('style');st.id='spStyle';
st.textContent='.sp-scroll{overflow-y:auto;scrollbar-width:thin;scrollbar-color:#a3e635 rgba(163,230,53,.08);}.sp-scroll::-webkit-scrollbar{width:9px;height:9px;}.sp-scroll::-webkit-scrollbar-track{background:rgba(163,230,53,.07);border-radius:9px;}.sp-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#a3e635,#38bdf8);border-radius:9px;border:2px solid rgba(11,18,32,.9);}.sp-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#bef264,#7dd3fc);}.sp-chip{display:inline-flex;align-items:center;gap:5px;font-size:0.68rem;padding:4px 9px;border-radius:999px;border:1px solid rgba(163,230,53,.35);background:rgba(163,230,53,.08);color:#d9f99d;cursor:pointer;user-select:none;}.sp-chip.on{background:linear-gradient(90deg,rgba(163,230,53,.28),rgba(56,189,248,.22));border-color:#a3e635;color:#fff;font-weight:800;}.sp-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 6px;border-bottom:1px dashed rgba(163,230,53,.14);cursor:pointer;transition:background .15s;}.sp-row:hover{background:rgba(56,189,248,.08);}.sp-tier{font-family:var(--mono);font-weight:900;font-size:1rem;padding:2px 8px;border-radius:8px;}.sp-t3{background:linear-gradient(90deg,#a3e635,#22c55e);color:#0b1220;}.sp-t2{background:linear-gradient(90deg,#fbbf24,#f59e0b);color:#0b1220;}.sp-t1{background:linear-gradient(90deg,#38bdf8,#6366f1);color:#fff;}.sp-t0{background:rgba(148,163,184,.25);color:#cbd5e1;}.sp-scrim{position:fixed;inset:0;background:rgba(4,8,16,.66);backdrop-filter:blur(3px);z-index:9998;opacity:0;transition:opacity .2s;}.sp-scrim.on{opacity:1;}.sp-drawer{position:fixed;top:0;right:0;height:100%;width:min(430px,94vw);background:linear-gradient(160deg,#0b1220,#101a2e 60%,#0d1526);border-left:1px solid rgba(163,230,53,.35);z-index:9999;transform:translateX(102%);transition:transform .24s cubic-bezier(.2,.8,.2,1);padding:14px;box-sizing:border-box;}.sp-drawer.on{transform:translateX(0);}.sp-rule{display:flex;gap:5px;align-items:center;padding:4px 0;}.sp-rule select,.sp-rule input{margin-top:0;}.sp-undo{display:flex;gap:8px;align-items:center;padding:6px 8px;border:1px solid rgba(251,191,36,.4);border-radius:10px;background:rgba(251,191,36,.08);margin:6px 0;}';
document.head.appendChild(st);
}
var scanCache=lsJSON('sp_cache',null);
var bulk={};
var undoSnap=null;var undoTimer=0;
var dragIdx=-1;
function metLabel(k){for(var i=0;i<MET.length;i++){if(MET[i].k===k)return MET[i].lab;}return k;}
function passRule(row,r){
var v=row.m?row.m[r.m]:null;
if(v==null||!isFinite(v))return false;
var t=parseFloat(r.v);
if(!isFinite(t))return true;
if(r.op==='<')return v<t;
if(r.op==='<=')return v<=t;
if(r.op==='>')return v>t;
return v>=t;
}
function failReason(row,rs){
for(var i=0;i<rs.length;i++){if(!passRule(row,rs[i]))return metLabel(rs[i].m)+' '+rs[i].op+' '+rs[i].v;}
return 'data tidak lengkap';
}
function scoreOf(m){
if(!m)return 0;
var s=0;
var mos=m.mos!=null?m.mos:0;
s+=Math.max(0,Math.min(1,mos/60))*3;
s+=m.pe!=null?(m.pe<10?1:m.pe<15?0.6:0.2):0;
s+=m.pbv!=null?(m.pbv<1?1:m.pbv<1.5?0.6:0.2):0;
s+=m.roe!=null?(m.roe>=20?2:m.roe>=15?1.5:m.roe>=10?1:0.3):0;
s+=m.de!=null?(m.de<60?0.5:m.de<100?0.3:0):0;
s+=m.revG!=null?(m.revG>10?1:m.revG>0?0.5:0):0;
s+=m.niG!=null?(m.niG>10?1:m.niG>0?0.5:0):0;
s+=m.ret1y!=null&&m.ret1y>0?0.5:0;
s+=m.slope!=null&&m.slope>0?0.5:0;
return Math.round(s*10)/10;
}
async function fundOf(code){
try{
if(!GAS_PROXY)return null;
var u='https://query1.finance.yahoo.com/v10/finance/quoteSummary/'+code+'.JK?modules=summaryDetail,defaultKeyStatistics,financialData';
var r=await fetch(GAS_PROXY+'?url='+encodeURIComponent(u));
if(!r.ok)return null;
var wrap=JSON.parse(await r.text());
var j=JSON.parse(wrap.body||'null');
var res=j&&j.quoteSummary&&j.quoteSummary.result&&j.quoteSummary.result[0];
if(!res)return null;
var sd=res.summaryDetail||{},ks=res.defaultKeyStatistics||{},fd=res.financialData||{};
function num(o){return o&&o.raw!=null?o.raw:null;}
return{pe:num(sd.trailingPE),pbv:num(ks.priceToBook)||num(sd.priceToBook),eps:num(ks.trailingEps),bv:num(ks.bookValue),roe:num(fd.returnOnEquity)!=null?num(fd.returnOnEquity)*100:null,revG:num(fd.revenueGrowth)!=null?num(fd.revenueGrowth)*100:null,niG:num(fd.earningsGrowth)!=null?num(fd.earningsGrowth)*100:null,niB:num(ks.netIncomeToCommon)!=null?num(ks.netIncomeToCommon)/1e9:null,mcB:num(sd.marketCap)!=null?num(sd.marketCap)/1e9:null,divY:num(sd.dividendYield)!=null?num(sd.dividendYield)*100:null,de:num(ks.debtToEquity)||num(fd.debtToEquity)};
}catch(e){return null;}
}
async function scan(force){
var btn=document.getElementById('spScan');
var out=document.getElementById('spResults');
var uni=universe();
if(!uni.length){out.innerHTML='<div style="color:var(--yellow);font-size:0.78rem;">Pilih minimal satu indeks atau Watchlist.</div>';return;}
var fresh=scanCache&&scanCache.t&&Date.now()-scanCache.t<6*3600000;
var rows=(fresh&&!force)?scanCache.rows.slice():[];
var have={};
for(var i=0;i<rows.length;i++)have[rows[i].code]=true;
var need=[];
for(var u=0;u<uni.length;u++){if(!have[uni[u]])need.push(uni[u]);}
if(force){need=uni.slice();rows=[];}
if(btn){btn.disabled=true;btn.innerText='Scanning '+need.length+' saham...';}
out.innerHTML='<div class="skel-box" style="height:90px"></div>';
for(var c=0;c<need.length;c+=6){
var chunk=need.slice(c,c+6);
var settled=await Promise.allSettled(chunk.map(function(code){
return Promise.all([fundOf(code),SW.candle(code,'1y').catch(function(){return null;})]);
}));
settled.forEach(function(res,i){
if(res.status!=='fulfilled')return;
var code=chunk[i];var F=res.value[0];var candle=res.value[1];
var m=F?{pe:F.pe,pbv:F.pbv,roe:F.roe,revG:F.revG,niG:F.niG,niB:F.niB,mcB:F.mcB,divY:F.divY,de:F.de}:{};
var price=null;
if(candle){
var A=SW.arrays(candle);var n=A.c.length;
price=(typeof cachePrice==='function'&&cachePrice(code))||A.c[n-1];
if(n>60){
var ma50=SW.sma(A.c,50);
m.slope=(ma50[n-1]!=null&&ma50[n-6]!=null&&ma50[n-6]!==0)?(ma50[n-1]-ma50[n-6])/ma50[n-6]*100:null;
m.rsi=SW.rsi(A.c,14)[n-1];
var q=candle.indicators.quote[0];var vol=[];
if(q.volume){for(var v=0;v<q.volume.length;v++){if(q.volume[v]!=null)vol.push(q.volume[v]);}}
if(vol.length>21){var av=0;for(var a=vol.length-21;a<vol.length-1;a++)av+=vol[a];av/=20;m.vr=av>0?vol[vol.length-1]/av:null;}
m.ret1y=n>200?(price/A.c[n-201]-1)*100:(price/A.c[0]-1)*100;
}
}
if(price!=null&&F&&F.eps!=null&&F.bv!=null&&F.roe!=null){
var fairA=F.eps*12;var fairB=F.bv*(F.roe/12);
var fair=(fairA+fairB)/2;
m.mos=fair>0?(fair-price)/fair*100:null;
m.fair=fair;
}
m.price=price;
rows.push({code:code,m:m,score:scoreOf(m)});
});
if(btn)btn.innerText='Scanning '+Math.min(c+6,need.length)+'/'+need.length+'...';
}
scanCache={t:Date.now(),rows:rows};
saveLS('sp_cache',scanCache);
if(btn){btn.disabled=false;btn.innerText='🎯 Scan Universe';}
renderResults();
}
function currentRows(){
var uni=universe();
var rows=(scanCache&&scanCache.rows)?scanCache.rows:[];
var out=[];
for(var i=0;i<rows.length;i++){if(uni.indexOf(rows[i].code)>=0)out.push(rows[i]);}
return out;
}
function renderResults(){
var out=document.getElementById('spResults');
if(!out)return;
var rs=rules();
var rows=currentRows();
var q=(document.getElementById('spSearch')||{}).value||'';
q=q.toUpperCase();
var pass=[];var fail=[];
for(var i=0;i<rows.length;i++){
var ok=true;
for(var r=0;r<rs.length;r++){if(!passRule(rows[i],rs[r])){ok=false;break;}}
if(ok)pass.push(rows[i]);else fail.push(rows[i]);
}
if(q){pass=pass.filter(function(x){return x.code.indexOf(q)>=0;});fail=fail.filter(function(x){return x.code.indexOf(q)>=0;});}
var sortSel=document.getElementById('spSort');
var sk=sortSel?sortSel.value:'score';
var dirBtn=document.getElementById('spDir');
var desc=!dirBtn||dirBtn.getAttribute('data-d')!=='asc';
pass.sort(function(a,b){
var av=sk==='score'?a.score:(a.m&&a.m[sk]!=null?a.m[sk]:-1e9);
var bv=sk==='score'?b.score:(b.m&&b.m[sk]!=null?b.m[sk]:-1e9);
return desc?bv-av:av-bv;
});
var note=document.getElementById('spNote');
if(note)note.innerText='Universe '+universe().length+' saham • lolos '+pass.length+' • gagal '+fail.length+' • cache '+(scanCache?new Date(scanCache.t).toLocaleTimeString('id-ID'):'-');
var h='';
var bulkN=Object.keys(bulk).length;
if(bulkN>0){
h+='<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 8px;border:1px solid rgba(56,189,248,.4);border-radius:10px;background:rgba(56,189,248,.08);margin-bottom:6px;"><span style="font-size:0.72rem;font-weight:800;color:#7dd3fc;">'+bulkN+' dipilih</span><button class="btn-mini" onclick="SCREENERPRO.bulkWatch()">⭐ Watchlist</button><button class="btn-mini" onclick="SCREENERPRO.bulkCopy()">📋 Salin</button><button class="btn-mini" onclick="SCREENERPRO.bulkClear()">✕</button></div>';
}
if(!pass.length){
h+='<div style="color:var(--yellow);font-size:0.78rem;padding:8px 0;">Tidak ada yang lolos rules saat ini. Longgarkan aturan atau pilih indeks lain — disiplin menunggu juga posisi.</div>';
}
for(var p=0;p<pass.length;p++){
var row=pass[p];var m=row.m||{};
var tier=row.score>=7?'sp-t3':row.score>=5?'sp-t2':row.score>=3?'sp-t1':'sp-t0';
var fire=row.score>=7?' 🔥':'';
h+='<div class="sp-row" onclick="SCREENERPRO.drawer(\''+row.code+'\')">';
h+='<span style="display:flex;align-items:center;gap:6px;"><input type="checkbox" '+(bulk[row.code]?'checked':'')+' onclick="event.stopPropagation();SCREENERPRO.bulkToggle(\''+row.code+'\')" style="margin-top:0;"><span><strong style="color:#fff;">'+row.code+'</strong>'+fire+' <span style="font-size:0.66rem;color:var(--text-muted);">skor '+f1(row.score)+' • MOS '+(m.mos!=null?(m.mos>=0?'+':'')+f1(m.mos)+'%':'-')+'</span><br><span style="font-size:0.64rem;color:#94a3b8;font-family:var(--mono);">PER '+f1(m.pe)+' • PBV '+f1(m.pbv)+' • ROE '+f1(m.roe)+'%</span></span></span>';
h+='<span style="text-align:right;"><span class="sp-tier '+tier+'">'+f1(row.score)+'</span><br><span style="font-size:0.68rem;font-family:var(--mono);color:#e2e8f0;">'+fmt(m.price)+'</span></span>';
h+='</div>';
}
var showF=document.getElementById('spFailed');
if(showF&&showF.checked&&fail.length){
h+='<div style="font-size:0.72rem;font-weight:800;color:#94a3b8;margin:8px 0 4px;">✕ Tidak lolos ('+fail.length+')</div>';
for(var f=0;f<fail.length;f++){
var fr=fail[f];
h+='<div class="sp-row" style="opacity:.65;" onclick="SCREENERPRO.drawer(\''+fr.code+'\')"><span><strong>'+fr.code+'</strong> <span style="font-size:0.64rem;color:#f87171;">gagal: '+failReason(fr,rs)+'</span></span><span style="font-size:0.68rem;font-family:var(--mono);">'+f1(fr.score)+'</span></div>';
}
}
h+='<div style="font-size:0.62rem;color:#64748b;margin-top:6px;">Fair value model = rata-rata (EPS×12, BV×ROE/12). MOS = (fair−harga)/fair. Snapshot konstituen indeks per Nov 2026; BUKAN rekomendasi beli.</div>';
out.innerHTML=h;
}
function renderRules(){
var box=document.getElementById('spRules');
if(!box)return;
var rs=rules();
var h='';
for(var i=0;i<rs.length;i++){
var r=rs[i];
h+='<div class="sp-rule" draggable="true" data-i="'+i+'">';
h+='<span style="cursor:grab;color:#64748b;font-size:0.8rem;">⠿</span>';
h+='<select class="fv-input" style="width:46%;" onchange="SCREENERPRO.ruleSet('+i+',\'m\',this.value)">';
for(var m=0;m<MET.length;m++){h+='<option value="'+MET[m].k+'"'+(MET[m].k===r.m?' selected':'')+'>'+MET[m].lab+'</option>';}
h+='</select>';
h+='<select class="fv-input" style="width:64px;" onchange="SCREENERPRO.ruleSet('+i+',\'op\',this.value)">';
for(var o=0;o<OPS.length;o++){h+='<option value="'+OPS[o]+'"'+(OPS[o]===r.op?' selected':'')+'>'+OPS[o]+'</option>';}
h+='</select>';
h+='<input type="number" step="any" class="fv-input" style="width:70px;" value="'+r.v+'" onchange="SCREENERPRO.ruleSet('+i+',\'v\',this.value)">';
h+='<button class="btn-mini" onclick="SCREENERPRO.ruleMove('+i+',-1)">▲</button>';
h+='<button class="btn-mini" onclick="SCREENERPRO.ruleMove('+i+',1)">▼</button>';
h+='<button class="btn-mini" onclick="SCREENERPRO.ruleDel('+i+')">🗑</button>';
h+='</div>';
}
box.innerHTML=h;
var rows=box.querySelectorAll('.sp-rule');
for(var d=0;d<rows.length;d++){
rows[d].addEventListener('dragstart',function(e){dragIdx=parseInt(this.getAttribute('data-i'),10);});
rows[d].addEventListener('dragover',function(e){e.preventDefault();});
rows[d].addEventListener('drop',function(e){
e.preventDefault();
var to=parseInt(this.getAttribute('data-i'),10);
if(dragIdx<0||dragIdx===to)return;
var rs2=rules();var item=rs2.splice(dragIdx,1)[0];rs2.splice(to,0,item);
saveRules(rs2);dragIdx=-1;renderRules();renderResults();
});
}
}
function renderIndices(){
var box=document.getElementById('spIdx');
if(!box)return;
var sel=indices();
var h='';
for(var i=0;i<ORDER.length;i++){
var name=ORDER[i];var on=sel.indexOf(name)>=0;
h+='<span class="sp-chip'+(on?' on':'')+'" onclick="SCREENERPRO.idxToggle(\''+name+'\')">'+(on?'✅ ':'')+name+' <span style="opacity:.7;">'+IDX[name].length+'</span></span> ';
}
box.innerHTML=h;
}
function showUndo(label,kind){
var bar=document.getElementById('spUndo');
if(!bar)return;
bar.style.display='flex';
bar.innerHTML='<span style="font-size:0.72rem;color:var(--yellow);">⚠ '+label+'</span><button class="btn-mini" onclick="SCREENERPRO.undo()">↩ Undo</button>';
clearTimeout(undoTimer);
undoTimer=setTimeout(function(){bar.style.display='none';undoSnap=null;},9000);
}
function mount(){
var tab=document.getElementById('tab-market');
if(!tab){setTimeout(mount,900);return;}
if(document.getElementById('screenerproCard')){killLegacy();return;}
injectStyle();
killLegacy();
var card=document.createElement('div');
card.className='card';card.id='screenerproCard';
var h='<div class="card-title"><span>🎯 Screener Pro</span><span class="agent-pill master" style="background:linear-gradient(90deg,rgba(163,230,53,.25),rgba(56,189,248,.25));">Peluang Hari Ini • Multi-Index</span></div>';
h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px;">';
h+='<button class="btn-copy" style="margin-top:0;" id="spScan" onclick="SCREENERPRO.scan(false)">🎯 Scan Universe</button>';
h+='<button class="btn-mini" onclick="SCREENERPRO.scan(true)">⚡ Paksa</button>';
h+='<select id="spSort" class="fv-input" style="width:110px;margin-top:0;"><option value="score">Sort: Skor</option><option value="mos">Sort: MOS</option><option value="pe">Sort: PER</option><option value="pbv">Sort: PBV</option><option value="roe">Sort: ROE</option><option value="divY">Sort: Dividen</option><option value="ret1y">Sort: Return 1y</option></select>';
h+='<button class="btn-mini" id="spDir" data-d="desc" onclick="SCREENERPRO.dir()">⬇</button>';
h+='<input id="spSearch" class="fv-input" style="width:90px;margin-top:0;" placeholder="Cari kode">';
h+='<label style="display:flex;gap:5px;align-items:center;font-size:0.68rem;color:var(--text-muted);"><input type="checkbox" id="spLegacy" style="margin-top:0;" onchange="SCREENERPRO.legacy(this.checked)"> 🗑 Hapus alat lama</label>';
h+='</div>';
h+='<div style="font-size:0.66rem;color:var(--text-muted);margin-bottom:4px;">Universe (pilih beberapa indeks):</div>';
h+='<div id="spIdx" class="sp-scroll" style="max-height:86px;margin-bottom:6px;line-height:2;"></div>';
h+='<label style="display:flex;gap:6px;align-items:center;font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;"><input type="checkbox" id="spWL" style="margin-top:0;" onchange="SCREENERPRO.live()"> + Watchlist saya</label>';
h+='<div style="font-size:0.66rem;color:var(--text-muted);margin-bottom:4px;">Rules (live, geser ⠿ untuk urutan):</div>';
h+='<div id="spRules" class="sp-scroll" style="max-height:150px;margin-bottom:6px;"></div>';
h+='<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px;">';
h+='<button class="btn-mini" onclick="SCREENERPRO.ruleAdd()">＋ Add Rule</button>';
h+='<select id="spPreset" class="fv-input" style="width:120px;margin-top:0;"><option value="">Preset...</option></select>';
h+='<button class="btn-mini" onclick="SCREENERPRO.preset()">⚡ Terapkan</button>';
h+='<button class="btn-mini" onclick="SCREENERPRO.viewSave()">💾 Save view</button>';
h+='<select id="spViews" class="fv-input" style="width:110px;margin-top:0;"><option value="">Views...</option></select>';
h+='<button class="btn-mini" onclick="SCREENERPRO.viewLoad()">📂</button>';
h+='<button class="btn-mini" onclick="SCREENERPRO.viewDel()">🗑</button>';
h+='</div>';
h+='<div id="spUndo" class="sp-undo" style="display:none;"></div>';
h+='<label style="display:flex;gap:6px;align-items:center;font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;"><input type="checkbox" id="spFailed" style="margin-top:0;" onchange="SCREENERPRO.live()"> tampilkan yang tidak lolos</label>';
h+='<div id="spNote" style="font-size:0.68rem;color:var(--text-muted);margin-bottom:6px;"></div>';
h+='<div id="spResults" class="sp-scroll" style="max-height:430px;"></div>';
card.innerHTML=h;
tab.insertBefore(card,tab.firstChild);
var lg=document.getElementById('spLegacy');if(lg)lg.checked=legacyOff();
var ps=document.getElementById('spPreset');
var pk=Object.keys(PRESETS);
for(var p=0;p<pk.length;p++){ps.innerHTML+='<option value="'+pk[p]+'">'+pk[p]+'</option>';}
var vs=document.getElementById('spViews');
var vv=views();
for(var v=0;v<vv.length;v++){vs.innerHTML+='<option value="'+v+'">'+vv[v].name+'</option>';}
var ss=document.getElementById('spSort');if(ss)ss.onchange=function(){renderResults();};
var se=document.getElementById('spSearch');if(se)se.oninput=function(){renderResults();};
renderIndices();renderRules();renderResults();
killLegacy();
var mo=new MutationObserver(function(){clearTimeout(mo._t);mo._t=setTimeout(killLegacy,150);});
mo.observe(tab,{childList:true,subtree:true});
}
function openDrawer(code){
var rows=(scanCache&&scanCache.rows)||[];
var row=null;
for(var i=0;i<rows.length;i++){if(rows[i].code===code)row=rows[i];}
if(!row)return;
var m=row.m||{};
var scrim=document.getElementById('spScrim');
var dr=document.getElementById('spDrawer');
if(!scrim){scrim=document.createElement('div');scrim.id='spScrim';scrim.className='sp-scrim';scrim.onclick=function(){closeDrawer();};document.body.appendChild(scrim);}
if(!dr){dr=document.createElement('div');dr.id='spDrawer';dr.className='sp-drawer sp-scroll';document.body.appendChild(dr);}
var rs=rules();
var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:1.1rem;font-weight:900;color:#fff;">'+code+'</span><button class="btn-mini" onclick="SCREENERPRO.close()">✕</button></div>';
h+='<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">Harga '+fmt(m.price)+' • skor '+f1(row.score)+' • MOS '+(m.mos!=null?(m.mos>=0?'+':'')+f1(m.mos)+'%':'-')+' • fair model '+fmt(m.fair)+'</div>';
h+='<div class="metric-grid" style="margin-bottom:8px;">';
var cells=[['PER',f1(m.pe)],['PBV',f1(m.pbv)],['ROE',f1(m.roe)+'%'],['DER',f1(m.de)+'%'],['Rev G',f1(m.revG)+'%'],['Laba G',f1(m.niG)+'%'],['Div Yield',f1(m.divY)+'%'],['Mkt Cap',fmt(m.mcB)+'M'],['Laba',fmt(m.niB)+'M'],['Ret 1y',f1(m.ret1y)+'%'],['RSI',f1(m.rsi)],['Vol R',f1(m.vr)]];
for(var c=0;c<cells.length;c++){h+='<div class="metric-box"><div class="metric-label">'+cells[c][0]+'</div><div class="metric-value" style="font-size:0.9rem;">'+cells[c][1]+'</div></div>';}
h+='</div>';
h+='<div style="font-size:0.74rem;font-weight:800;color:#fff;margin:6px 0 4px;">🚦 Rules checklist</div>';
for(var r=0;r<rs.length;r++){
var ok=passRule(row,rs[r]);
h+='<div style="display:flex;justify-content:space-between;font-size:0.7rem;padding:2px 0;border-bottom:1px dashed rgba(163,230,53,.12);"><span>'+(ok?'✅':'❌')+' '+metLabel(rs[r].m)+' '+rs[r].op+' '+rs[r].v+'</span><span style="font-family:var(--mono);color:#e2e8f0;">'+f1(m[rs[r].m])+'</span></div>';
}
h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;"><button class="btn-copy" style="margin-top:0;" onclick="SCREENERPRO.proses(\''+code+'\')">⚡ Proses</button><button class="btn-copy" style="margin-top:0;" onclick="SCREENERPRO.watch(\''+code+'\')">⭐ Watchlist</button><button class="btn-copy" style="margin-top:0;" onclick="SCREENERPRO.journal(\''+code+'\')">📓 Jurnal</button></div>';
dr.innerHTML=h;
scrim.style.display='block';dr.style.display='block';
requestAnimationFrame(function(){scrim.classList.add('on');dr.classList.add('on');});
}
function closeDrawer(){
var scrim=document.getElementById('spScrim');var dr=document.getElementById('spDrawer');
if(scrim)scrim.classList.remove('on');
if(dr)dr.classList.remove('on');
setTimeout(function(){if(scrim)scrim.style.display='none';if(dr)dr.style.display='none';},240);
}
function addToWatch(code){
if(Array.isArray(window.watchlist)){
var ex=false;
for(var i=0;i<window.watchlist.length;i++){var w=window.watchlist[i];var wc=typeof w==='string'?w:(w.t||w.code||'');if(wc===code)ex=true;}
if(!ex){var s=window.watchlist[0];if(s&&typeof s==='object')window.watchlist.push({t:code});else window.watchlist.push(code);}
return;
}
var arr=lsJSON('ihsg_watchlist',[]);
if(arr.indexOf(code)<0)arr.push(code);
saveLS('ihsg_watchlist',arr);
}
window.SCREENERPRO={
scan:scan,
live:function(){renderResults();},
legacy:function(on){
setLegacyOff(on);
if(on){killLegacy();toast('🗑 Alat value-scan lama dihapus permanen.');}
else{toast('↩ Alat lama diizinkan muncul lagi setelah reload halaman.');}
},
dir:function(){var b=document.getElementById('spDir');var d=b.getAttribute('data-d')==='desc'?'asc':'desc';b.setAttribute('data-d',d);b.innerText=d==='desc'?'⬇':'';renderResults();},
idxToggle:function(name){
var sel=indices();var i=sel.indexOf(name);
if(i>=0)sel.splice(i,1);else sel.push(name);
saveIndices(sel);renderIndices();renderResults();
},
ruleSet:function(i,key,val){
var rs=rules();
if(!rs[i])return;
if(key==='v')rs[i].v=parseFloat(val);else rs[i][key]=val;
saveRules(rs);renderResults();
},
ruleAdd:function(){
var rs=rules();rs.push({m:'pe',op:'<',v:15});saveRules(rs);renderRules();renderResults();
},
ruleDel:function(i){
undoSnap={kind:'rules',rules:rules(),views:views()};
var rs=rules();rs.splice(i,1);saveRules(rs);renderRules();renderResults();showUndo('Rule dihapus.');
},
ruleMove:function(i,d){
var rs=rules();var j=i+d;
if(j<0||j>=rs.length)return;
var t=rs[i];rs[i]=rs[j];rs[j]=t;
saveRules(rs);renderRules();renderResults();
},
preset:function(){
var sel=document.getElementById('spPreset');
var p=PRESETS[sel.value];
if(!p){toast('Pilih preset dulu.');return;}
saveRules(p.slice());renderRules();renderResults();toast('⚡ Preset '+sel.value+' diterapkan.');
},
viewSave:function(){
var name=window.prompt('Nama view:', 'View '+(views().length+1));
if(!name)return;
var vv=views();vv.push({name:name,rules:rules(),indices:indices()});saveViews(vv);
var vs=document.getElementById('spViews');vs.innerHTML='<option value="">Views...</option>';
for(var i=0;i<vv.length;i++){vs.innerHTML+='<option value="'+i+'">'+vv[i].name+'</option>';}
vs.value=String(vv.length-1);
toast('💾 View '+name+' tersimpan.');
},
viewLoad:function(){
var vs=document.getElementById('spViews');var vv=views();var v=vv[parseInt(vs.value,10)];
if(!v){toast('Pilih view dulu.');return;}
saveRules(v.rules.slice());saveIndices(v.indices.slice());
renderIndices();renderRules();renderResults();toast('📂 View '+v.name+' dimuat.');
},
viewDel:function(){
var vs=document.getElementById('spViews');var vv=views();var i=parseInt(vs.value,10);
if(!vv[i]){toast('Pilih view dulu.');return;}
undoSnap={kind:'rules',rules:rules(),views:vv.slice()};
var name=vv[i].name;vv.splice(i,1);saveViews(vv);
vs.innerHTML='<option value="">Views...</option>';
for(var k=0;k<vv.length;k++){vs.innerHTML+='<option value="'+k+'">'+vv[k].name+'</option>';}
showUndo('View '+name+' dihapus.');
},
undo:function(){
if(!undoSnap){toast('Tidak ada yang bisa di-undo.');return;}
saveRules(undoSnap.rules);saveViews(undoSnap.views);
var vs=document.getElementById('spViews');vs.innerHTML='<option value="">Views...</option>';
var vv=views();for(var k=0;k<vv.length;k++){vs.innerHTML+='<option value="'+k+'">'+vv[k].name+'</option>';}
undoSnap=null;
var bar=document.getElementById('spUndo');if(bar)bar.style.display='none';
renderRules();renderResults();toast('↩ Undo berhasil.');
},
bulkToggle:function(code){if(bulk[code])delete bulk[code];else bulk[code]=true;renderResults();},
bulkClear:function(){bulk={};renderResults();},
bulkWatch:function(){var n=0;for(var c in bulk){addToWatch(c);n++;}bulk={};renderResults();toast('⭐ '+n+' saham ke watchlist.');},
bulkCopy:function(){var ks=Object.keys(bulk);var t=ks.join(', ');if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast('📋 '+ks.length+' kode disalin.');});}else window.prompt('Kode:',t);},
drawer:openDrawer,
close:closeDrawer,
proses:function(code){
closeDrawer();
switchTab('analysis');
setTimeout(function(){
var inp=document.querySelector('input[placeholder*="KODE SAHAM"]');
if(inp)inp.value=code;
var btns=document.querySelectorAll('button');
for(var b=0;b<btns.length;b++){if((btns[b].innerText||'').trim()==='Proses'){btns[b].click();break;}}
},300);
},
watch:function(code){addToWatch(code);toast('⭐ '+code+' ke watchlist.');},
journal:function(code){
var J=window.journal;var arr=Array.isArray(J)?J:lsJSON('ihsg_journal',[]);
var px=null;
if(scanCache&&scanCache.rows){for(var i=0;i<scanCache.rows.length;i++){if(scanCache.rows[i].code===code){px=scanCache.rows[i].m.price;break;}}}
arr.push({t:code,d:Date.now(),p:px,setup:'screenerpro',outcome:null});
if(Array.isArray(J))window.journal=arr;
saveLS('ihsg_journal',arr);
toast('📓 '+code+' tercatat ke jurnal.');
}
};
setTimeout(mount,1200);
})();
/* END screenerpro v2 */
