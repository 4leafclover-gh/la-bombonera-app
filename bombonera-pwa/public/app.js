/* ── FIREBASE CONFIG — reemplazar con config real del proyecto ── */
var firebaseConfig = {
  apiKey: "AIzaSyBgwiIG6jfaQk3cxNKIqnwpHyqoGqw5_ew",
  authDomain: "la-bombonera-guanare.firebaseapp.com",
  projectId: "la-bombonera-guanare",
  storageBucket: "la-bombonera-guanare.firebasestorage.app",
  messagingSenderId: "262582974920",
  appId: "1:262582974920:web:5984313c5e720844a8e8fd"
};
try { firebase.initializeApp(firebaseConfig); } catch(e) { console.warn('Firebase config missing:', e); }


const PINS={Rafael:'1908',Angel:'1234',Ayudante:'0000',Gabriel:'1313'};
const OWNERS=['Rafael','Gabriel'];
const ARQUEO_ACCESS=['Rafael','Gabriel','Angel'];  /* Angel ve arqueo cuando trabaja solo */
const ALL_M_BS=['pagomovil','efectivobs'];
const ALL_M_USD=['binance','zelle','zinli','efectivousd'];
const ALL_M=[...ALL_M_BS,...ALL_M_USD];
const MNAMES={pagomovil:'Pago movil',efectivobs:'Efectivo Bs.',binance:'Binance',zelle:'Zelle',zinli:'Zinli',efectivousd:'Efectivo $'};

/* precios en USD fijados por Rafael — se convierten a Bs. con ceil50 al momento de la venta */
let S={
  user:null,bcv:0,bin:0,tasaUpdated:'',sales:[],
  clients:['Maria Perez','Jose Ramos','Luisa Garcia','Carlos Perez','Ana Rodriguez','Pedro Gomez'],
  menu:[
    {cat:'Perros calientes',name:'Normal (papitas o tostones)',usd:1.00},
    {cat:'Perros calientes',name:'Con queso amarillo',usd:1.50},
    {cat:'Perros calientes',name:'Con huevo',usd:1.50},
    {cat:'Perros calientes',name:'Con maiz',usd:1.50},
    {cat:'Perros calientes',name:'Con maiz y tocineta',usd:2.50},
    {cat:'Perros calientes',name:'Con carne (lomito, queso cheddar y tocineta)',usd:3.50},
    {cat:'Hamburguesas',name:'Hamburguesa carne',usd:3.00},
    {cat:'Hamburguesas',name:'Hamburguesa de chuleta',usd:3.50},
    {cat:'Hamburguesas',name:'Hamburguesa de lomito',usd:3.50},
    {cat:'Hamburguesas',name:'Doble carne y doble queso cheddar',usd:4.50},
    {cat:'Hamburguesas',name:'Carne y chuleta (doble queso cheddar)',usd:4.50},
    {cat:'Hamburguesas',name:'Doble carne, doble queso y chuleta ahumada',usd:6.00},
    {cat:'Papas y salchipapas',name:'Papas fritas 300g',usd:3.00},
    {cat:'Papas y salchipapas',name:'Papas fritas 500g',usd:5.00},
    {cat:'Papas y salchipapas',name:'Salchipapas pequena',usd:3.50},
    {cat:'Papas y salchipapas',name:'Salchipapas grande',usd:5.00},
    {cat:'Refrescos',name:'Pina / 7up / Manzanita (1L)',usd:1.00},
    {cat:'Refrescos',name:'Coca-Cola (1L)',usd:1.25},
    {cat:'Refrescos',name:'Manzanita / 7up (1.5L)',usd:1.50},
    {cat:'Refrescos',name:'Coca-Cola (1.5L)',usd:1.75},
  ],
  cart:{},payStatus:'pagado',pagoTotal:0,
  currentDebtId:null,editingSaleId:null,editCart:{},editingItemIdx:null,
  diffSaleId:null,diffAmount:0
};

function loadS(){try{var d=localStorage.getItem('lb5');if(d){var p=JSON.parse(d);['bcv','bin','tasaUpdated','sales','clients','menu'].forEach(function(k){if(p[k]!==undefined)S[k]=p[k];});}}catch(e){}}
function saveS(){try{localStorage.setItem('lb5',JSON.stringify({bcv:S.bcv,bin:S.bin,tasaUpdated:S.tasaUpdated,sales:S.sales,clients:S.clients,menu:S.menu}));}catch(e){}}
function isOwner(){return OWNERS.indexOf(S.user)>=0;}
function canArqueo(){return ARQUEO_ACCESS.indexOf(S.user)>=0;}

/* ── PRECIO: USD -> Bs. redondeado al multiplo de 50 hacia arriba ── */
function ceil50(n){return Math.ceil(n/50)*50;}
function itemPriceBs(item){
  if(!S.bin||!item.usd)return item.price||0;  /* fallback si viene de version anterior */
  return ceil50(item.usd*S.bin);
}

/* ── PIN ── */
var pinBuf='',selUser='Rafael';
function selectUser(u,el){selUser=u;document.querySelectorAll('.uchip').forEach(function(c){c.classList.remove('on');});el.classList.add('on');pinBuf='';updDots();document.getElementById('pinError').style.display='none';}
function pinKey(k){if(k==='DEL'){pinBuf=pinBuf.slice(0,-1);updDots();return;}if(k===''||pinBuf.length>=4)return;pinBuf+=k;updDots();if(pinBuf.length===4)setTimeout(checkPin,120);}
function updDots(){for(var i=0;i<4;i++)document.getElementById('d'+i).classList.toggle('filled',i<pinBuf.length);}
function checkPin(){if(PINS[selUser]===pinBuf){S.user=selUser;document.getElementById('pinScreen').style.display='none';document.getElementById('mainApp').style.display='block';initApp();}else{document.getElementById('pinError').style.display='block';pinBuf='';updDots();}}
function logout(){S.user=null;pinBuf='';updDots();document.getElementById('pinScreen').style.display='flex';document.getElementById('mainApp').style.display='none';}

/* ── INIT ── */
function initApp(){
  var own=isOwner();
  ['home-user','venta-user','pago-user','deudas-user','historial-user','mas-user'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=S.user.toUpperCase();});
  document.getElementById('owner-band').style.display=own?'block':'none';
  document.getElementById('owner-section').style.display=own?'block':'none';
  document.getElementById('btn-arqueo').style.display=canArqueo()?'flex':'none';
  var ohist=document.getElementById('owner-hist-export');if(ohist)ohist.style.display=own?'block':'none';
  document.getElementById('home-date').textContent=new Date().toLocaleDateString('es-VE',{weekday:'long',day:'numeric',month:'long'});
  document.getElementById('bcv-input').value=S.bcv||'';
  document.getElementById('bin-input').value=S.bin||'';
  document.getElementById('modal-bcv').value=S.bcv||'';
  document.getElementById('modal-bin').value=S.bin||'';
  var hf=document.getElementById('hist-from');if(hf)hf.value=daysAgo(30);
  var ht=document.getElementById('hist-to');if(ht)ht.value=todayStr();
  updTasaLbl();updRatesBar();renderHome();renderMenu();renderDebts();initFirebase();updateOnlineStatus();setTimeout(checkRatesFreshness,2000);
  if(own){renderMenuEditor();renderMonthlySummary();}
  goTo('inicio');
}
function goTo(name){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById('screen-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('on');});
  document.querySelectorAll('.nav-item[data-screen="'+name+'"]').forEach(function(n){n.classList.add('on');});
  if(name==='inicio')renderHome();
  if(name==='deudas')renderDebts();
  if(name==='historial')renderHistorial();
  if(name==='mas'){if(isOwner()){renderMenuEditor();renderMonthlySummary();}updTasaLbl();}
  if(name==='venta'){document.getElementById('venta-screen-title').textContent='Nueva venta';renderMenu();}
}

/* ── RATES (solo admins) ── */
function updRatesBar(){document.getElementById('rb-bcv').textContent=S.bcv?'Bs.'+fmtN(S.bcv):'-';document.getElementById('rb-bin').textContent=S.bin?'Bs.'+fmtN(S.bin):'-';}
function openRatesModal(){if(!isOwner()){alert('Solo los administradores pueden actualizar las tasas.');return;}openModal('ratesModal');}
function saveRatesModal(){var b=parseFloat(document.getElementById('modal-bcv').value),n=parseFloat(document.getElementById('modal-bin').value);if(b>0)S.bcv=b;if(n>0)S.bin=n;S.tasaUpdated=tsNow();saveS();updRatesBar();updTasaLbl();closeModal('ratesModal');renderHome();renderMenu();}
function saveTasas(){if(!isOwner())return;var b=parseFloat(document.getElementById('bcv-input').value),n=parseFloat(document.getElementById('bin-input').value);if(b>0)S.bcv=b;if(n>0)S.bin=n;S.tasaUpdated=tsNow();localStorage.setItem('lb5_rates_ts',Date.now());saveS();updRatesBar();updTasaLbl();renderHome();renderMenu();checkRatesFreshness();alert('Tasas guardadas.');}
function updTasaLbl(){var l=document.getElementById('tasa-updated-lbl');if(l)l.textContent=S.tasaUpdated?'Actualizado: '+S.tasaUpdated+' por '+S.user:'Sin actualizar hoy';}
function previewTasas(){
  var b=parseFloat(document.getElementById('bcv-input').value)||0;
  var n=parseFloat(document.getElementById('bin-input').value)||0;
  var prev=document.getElementById('tasa-preview'),items=document.getElementById('tasa-preview-items');
  if(!prev)return;
  if(n>0){
    prev.style.display='block';
    items.innerHTML=S.menu.slice(0,4).map(function(m){
      var bs=ceil50(m.usd*n);
      return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border);"><span style="color:var(--text2);">'+m.name.slice(0,20)+'</span><span><b style="color:var(--blue);">$'+m.usd.toFixed(2)+'</b> = <b style="color:var(--text);">Bs.'+fmtN(bs)+'</b></span></div>';
    }).join('');
  }else prev.style.display='none';
}

/* ── HELPERS ── */
function fmtN(n){return Math.round(n).toLocaleString('es-VE');}
function fmtUSD(n){return '$'+n.toFixed(2);}
function todayStr(){return new Date().toISOString().slice(0,10);}
function daysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);}
function timeNow(){return new Date().toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit'});}
function tsNow(){return new Date().toLocaleString('es-VE',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'});}
function daysDiff(d){return Math.max(0,Math.floor((Date.now()-new Date(d+'T12:00:00').getTime())/86400000));}
function formatDate(d){return new Date(d+'T12:00:00').toLocaleDateString('es-VE',{weekday:'long',day:'numeric',month:'long'});}
function bsToUSD(bs){return S.bin>0?bs/S.bin:0;}
function round100(n){return Math.floor(Math.abs(n)/100)*100;}

/* ── MIXED PAYMENT UTILS ── */
function getTotal(pfx){
  var t=0;
  ALL_M_BS.forEach(function(m){t+=parseFloat(document.getElementById(pfx+m).value)||0;});
  ALL_M_USD.forEach(function(m){var v=parseFloat(document.getElementById(pfx+m).value)||0;if(v>0&&S.bin)t+=v*S.bin;});
  return t;
}
function buildBD(pfx){
  var bd=[];
  ALL_M_BS.forEach(function(m){var v=parseFloat(document.getElementById(pfx+m).value)||0;if(v>0)bd.push({method:m,amountBs:v,amountRaw:v,currency:'bs'});});
  ALL_M_USD.forEach(function(m){var v=parseFloat(document.getElementById(pfx+m).value)||0;if(v>0&&S.bin)bd.push({method:m,amountBs:v*S.bin,amountRaw:v,currency:'usd',rate:S.bin});});
  return bd;
}
function clearPay(pfx){ALL_M.forEach(function(m){var el=document.getElementById(pfx+m);if(el)el.value='';});}
function showRoundNote(noteId,diff){
  var el=document.getElementById(noteId);if(!el)return;
  if(diff<0){var r=round100(diff);if(r>0){el.textContent='Redondeo a favor del cliente: Bs.'+fmtN(r)+' (multiplo de 100)';el.style.display='block';return;}}
  el.style.display='none';
}
function updRemaining(pfx,total,barId,noteId){
  var paid=getTotal(pfx);var diff=total-paid;
  var el=document.getElementById(barId);if(!el)return;
  if(diff<=0){el.textContent='Cubierto';el.className='pr-val zero';}
  else{el.textContent='Bs.'+fmtN(diff)+(S.bin?' = $'+(diff/S.bin).toFixed(2):'');el.className='pr-val';}
  showRoundNote(noteId,diff);
}
function updateRemaining(){updRemaining('pm-',S.pagoTotal,'pay-remaining-val','rounding-note');}
function updateDiffRemaining(){updRemaining('dp-',S.diffAmount,'diff-remaining','diff-rounding-note');}
function updateAbonoTotal(){
  var t=getTotal('ab-');
  document.getElementById('abono-total-display').textContent='Bs.'+fmtN(t);
  var sale=S.sales.find(function(s){return s.id===S.currentDebtId;});if(!sale)return;
  var rem=(sale.debtRemaining!==undefined?sale.debtRemaining:sale.total)-t;
  showRoundNote('abono-rounding-note',rem);
}

/* ── HOME ── */
function renderHome(){
  var today=todayStr();
  var ts=S.sales.filter(function(s){return s.date===today;});
  /* ventas al contado hoy */
  var contado=ts.filter(function(s){return s.status==='pagado';});
  var contadoUSD=contado.reduce(function(a,s){return a+(s.totalUSD||0);},0);
  var contadoBs=contado.reduce(function(a,s){return a+s.total;},0);
  /* ventas a credito hoy */
  var creditoHoy=ts.filter(function(s){return s.status==='debe';});
  var creditoHoyUSD=creditoHoy.reduce(function(a,s){return a+(s.totalUSD||0);},0);
  var creditoHoyBs=creditoHoy.reduce(function(a,s){return a+s.total;},0);
  /* total deudas pendientes todos los dias */
  var debts=S.sales.filter(function(s){return s.status==='debe'&&(s.debtRemaining!==undefined?s.debtRemaining:s.total)>0;});
  var debtUSD=debts.reduce(function(a,s){var rem=s.debtRemaining!==undefined?s.debtRemaining:s.total;return a+(s.debtRemainingUSD!==undefined?s.debtRemainingUSD:bsToUSD(rem));},0);
  var debtBs=debts.reduce(function(a,s){return a+(s.debtRemaining!==undefined?s.debtRemaining:s.total);},0);
  /* unique debtors */
  var debtors={};debts.forEach(function(s){debtors[s.client]=true;});
  var debtorCount=Object.keys(debtors).length;
  /* update UI */
  document.getElementById('today-usd').textContent=fmtUSD(contadoUSD);
  document.getElementById('today-bs-sub').textContent='Bs.'+fmtN(contadoBs);
  document.getElementById('today-bcv').textContent=S.bcv&&contadoBs>0?'$'+Math.round(contadoBs/S.bcv)+' BCV':'- BCV';
  document.getElementById('today-bin').textContent=S.bin&&contadoBs>0?'$'+Math.round(contadoBs/S.bin)+' BIN':'- BIN';
  document.getElementById('credit-today-usd').textContent=fmtUSD(creditoHoyUSD);
  document.getElementById('credit-today-bs').textContent='Bs.'+fmtN(creditoHoyBs);
  document.getElementById('credit-today-count').textContent=creditoHoy.length+' venta'+(creditoHoy.length!==1?'s':'');
  document.getElementById('debt-total').textContent=fmtUSD(debtUSD);
  document.getElementById('debt-bs-tag').textContent='Bs.'+fmtN(debtBs);
  document.getElementById('debt-client-count').textContent=debtorCount;
  if(isOwner()){var mo=new Date().toISOString().slice(0,7);var mTot=S.sales.filter(function(s){return s.status==='pagado'&&s.date&&s.date.startsWith(mo);}).reduce(function(a,s){return a+(s.totalUSD||0);},0);document.getElementById('month-total').textContent='$'+mTot.toFixed(2);}
  document.getElementById('debt-alerts').innerHTML=debts.filter(function(s){return daysDiff(s.date)>=2;}).slice(0,3).map(function(s){var rem=s.debtRemainingUSD!==undefined?fmtUSD(s.debtRemainingUSD):'Bs.'+fmtN(s.debtRemaining!==undefined?s.debtRemaining:s.total);return '<div class="alert"><span style="color:var(--red);font-size:14px;">!</span><span class="alert-text">'+s.client+' debe '+rem+' hace '+daysDiff(s.date)+' dias</span></div>';}).join('');
  var list=document.getElementById('today-sales-list');
  if(ts.length===0){list.innerHTML='<div class="empty-state"><div class="empty-icon">&#127789;</div>Aun no hay ventas hoy</div>';return;}
  list.innerHTML='<div style="background:var(--card);">'+ts.slice().reverse().map(saleRowHTML).join('')+'</div>';
}
/* modal credito hoy */
function showTodayCreditModal(){
  var today=todayStr();
  var creditoHoy=S.sales.filter(function(s){return s.date===today&&s.status==='debe';});
  document.getElementById('today-sales-modal-list').innerHTML=creditoHoy.length===0?'<div class="empty-state">Sin ventas a credito hoy</div>':'<div style="border-radius:var(--rs);overflow:hidden;border:1px solid var(--border);">'+creditoHoy.slice().reverse().map(saleRowHTML).join('')+'</div>';
  openModal('todaySalesModal');
}
function saleRowHTML(s){
  var ini=s.client&&s.client!=='Anonimo'?s.client.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase():'?';
  var avCls=s.client&&s.client!=='Anonimo'?'av':'av av-anon';
  var bdgCls=s.status==='pagado'?'bdg bdg-ok':s.status==='debe'?'bdg bdg-no':'bdg bdg-mid';
  var usdLine=s.totalUSD?'<div class="s-usd">$'+s.totalUSD.toFixed(2)+' ('+fmtN(s.binRate||S.bin)+' BIN)</div>':'';
  var anchor=s.status==='debe'&&s.debtRemainingUSD!==undefined?'<div class="usd-anchor">'+fmtUSD(s.debtRemainingUSD)+'</div>':'';
  var prods=s.items&&s.items.length?s.items.map(function(i){return i.name.slice(0,12)+' x'+i.qty;}).join(', '):'Deuda';
  return '<div class="sale-row" onclick="openEditSaleModal('+s.id+')"><div class="'+avCls+'">'+ini+'</div><div style="flex:1;min-width:0;"><div class="s-name">'+s.client+'</div><div class="s-det">'+prods+' - '+s.time+'</div></div><div class="s-amt"><div class="s-bs">Bs.'+fmtN(s.total)+'</div>'+usdLine+anchor+'<span class="'+bdgCls+'">'+s.status+'</span></div></div>';
}
function showTodaySalesModal(){
  var today=todayStr();var ts=S.sales.filter(function(s){return s.date===today;});
  document.getElementById('today-sales-modal-list').innerHTML=ts.length===0?'<div class="empty-state">Sin ventas hoy</div>':'<div style="border-radius:var(--rs);overflow:hidden;border:1px solid var(--border);">'+ts.slice().reverse().map(saleRowHTML).join('')+'</div>';
  openModal('todaySalesModal');
}

/* ── MENU ── */
function renderMenu(){
  var cats=[];S.menu.forEach(function(m){if(cats.indexOf(m.cat)<0)cats.push(m.cat);});
  document.getElementById('menu-list').innerHTML=cats.map(function(cat){
    var rows=[];
    S.menu.forEach(function(item,idx){
      if(item.cat!==cat)return;
      var qty=S.cart[idx]||0;
      var priceBs=itemPriceBs(item);
      var usdLine=item.usd?'<div class="mi-usd-main">$'+item.usd.toFixed(2)+'</div>':'';
      var bsLine=S.bin?'<div class="mi-bs-calc">Bs.'+fmtN(priceBs)+'</div>':'<div class="mi-bs-calc">ingresa tasa</div>';
      var ctrl=qty>0?'<div class="qty-ctrl"><button class="qty-btn" onclick="chgQ('+idx+',-1)">-</button><span class="qty-num">'+qty+'</span><button class="qty-btn" onclick="chgQ('+idx+',1)">+</button></div>':'<button class="add-btn" onclick="chgQ('+idx+',1)">+</button>';
      rows.push('<div class="menu-item'+(qty>0?' selected':'')+'"><div style="flex:1;"><div class="mi-name">'+item.name+'</div><div style="display:flex;align-items:center;gap:8px;margin-top:2px;">'+usdLine+bsLine+'</div></div><div style="display:flex;align-items:center;">'+ctrl+'</div></div>');
    });
    return '<div style="background:var(--card);margin-top:8px;"><div style="padding:8px 14px 3px;"><span class="menu-cat-title">'+cat+'</span></div>'+rows.join('')+'</div>';
  }).join('');
  updVentaTotal();
}
function chgQ(idx,delta){S.cart[idx]=Math.max(0,(S.cart[idx]||0)+delta);renderMenu();}
function cartTotal(){
  return Object.keys(S.cart).reduce(function(a,i){
    if(S.cart[i]<=0)return a;
    return a+itemPriceBs(S.menu[i])*S.cart[i];
  },0);
}
function cartTotalUSD(){
  return Object.keys(S.cart).reduce(function(a,i){
    if(S.cart[i]<=0)return a;
    return a+(S.menu[i].usd||0)*S.cart[i];
  },0);
}
function updVentaTotal(){
  var t=cartTotal();var tusd=cartTotalUSD();
  document.getElementById('venta-total').textContent='Bs.'+fmtN(t);
  document.getElementById('venta-usd').textContent=tusd>0?'$'+tusd.toFixed(2)+' USD':'';
}
function clearVenta(){S.cart={};S.payStatus='pagado';document.getElementById('client-input').value='';selStatus('pagado');renderMenu();}
function filterClients(){
  var val=document.getElementById('client-input').value.toLowerCase();
  var list=document.getElementById('client-list');
  if(!val){list.style.display='none';return;}
  var m=S.clients.filter(function(c){return c.toLowerCase().indexOf(val)>=0;});
  if(!m.length){list.style.display='none';return;}
  var html='';m.forEach(function(c){html+='<div class="client-opt" onmousedown="pickClient(this)">'+c+'</div>';});
  list.innerHTML=html;list.style.display='block';
}
function pickClient(el){document.getElementById('client-input').value=el.textContent;document.getElementById('client-list').style.display='none';}
function hideClientList(){setTimeout(function(){document.getElementById('client-list').style.display='none';},200);}
function selStatus(s){
  S.payStatus=s;
  document.getElementById('ps-pagado').style.border=s==='pagado'?'2px solid var(--blue)':'1px solid var(--border)';
  document.getElementById('ps-pagado').style.background=s==='pagado'?'#eff6ff':'var(--card)';
  document.getElementById('ps-debe').style.border=s==='debe'?'2px solid var(--red)':'1px solid var(--border)';
  document.getElementById('ps-debe').style.background=s==='debe'?'var(--red-bg)':'var(--card)';
}

/* ── PAGO ── */
function goToPago(){
  if(!S.bin){alert('Debes ingresar la tasa Binance antes de cobrar.');return;}
  var total=cartTotal();if(total===0){alert('Agrega al menos un producto');return;}
  S.pagoTotal=total;clearPay('pm-');
  document.getElementById('pago-title').textContent='Registrar pago';
  document.getElementById('pago-context-lbl').textContent='Pedido: '+(document.getElementById('client-input').value.trim()||'Anonimo');
  document.getElementById('pago-bs').textContent='Bs.'+fmtN(total);
  document.getElementById('pago-usd-lbl').textContent='= $'+cartTotalUSD().toFixed(2)+' USD (tasa Binance: Bs.'+fmtN(S.bin)+')';
  document.getElementById('pago-back-btn').onclick=function(){goTo('venta');};
  selStatus('pagado');updateRemaining();goTo('pago');
}
function confirmPago(){
  var bd=buildBD('pm-');var totalPaid=bd.reduce(function(a,b){return a+b.amountBs;},0);
  if(S.payStatus==='pagado'&&totalPaid===0){alert('Ingresa al menos un monto');return;}
  var client=document.getElementById('client-input').value.trim()||'Anonimo';
  var tusd=cartTotalUSD();
  var items=[];Object.keys(S.cart).forEach(function(i){if(S.cart[i]>0)items.push({name:S.menu[i].name,qty:S.cart[i],usd:S.menu[i].usd||0,priceBs:itemPriceBs(S.menu[i])});});
  var debtAmt=Math.max(0,S.pagoTotal-totalPaid);
  var anchorUSD=S.bin?S.pagoTotal/S.bin:null;
  var sale={id:Date.now(),date:todayStr(),time:timeNow(),client:client,items:items,total:S.pagoTotal,totalUSD:tusd,status:S.payStatus,debtRemaining:S.payStatus==='debe'?debtAmt:0,debtRemainingUSD:S.payStatus==='debe'&&S.bin?debtAmt/S.bin:0,debtAnchorUSD:anchorUSD,totalPaid:totalPaid,breakdown:bd,payMethod:bd.length>0?bd[0].method:'pagomovil',user:S.user,bcvRate:S.bcv,binRate:S.bin,abonos:[]};
  sale.ts=Date.now();saveSale(sale);if(client!=='Anonimo'&&S.clients.indexOf(client)<0)S.clients.push(client);saveS();
  document.getElementById('confirm-detail').textContent=client+' - $'+tusd.toFixed(2)+' (Bs.'+fmtN(S.pagoTotal)+') - '+(S.payStatus==='debe'?'quedo debiendo':'pagado');
  clearVenta();openModal('confirmModal');
}

/* ── EDIT SALE ── */
function openEditSaleModal(id){
  closeModal('todaySalesModal');
  var sale=S.sales.find(function(s){return s.id===id;});if(!sale)return;
  S.editingSaleId=id;S.editCart={};
  document.getElementById('edit-client').value=sale.client||'';
  if(sale.items)sale.items.forEach(function(item){var idx=S.menu.findIndex(function(m){return m.name===item.name;});if(idx>=0)S.editCart[idx]=(S.editCart[idx]||0)+item.qty;});
  renderEditMenu();openModal('editSaleModal');
}
function renderEditMenu(){
  var cats=[];S.menu.forEach(function(m){if(cats.indexOf(m.cat)<0)cats.push(m.cat);});
  document.getElementById('edit-menu-list').innerHTML=cats.map(function(cat){
    var rows=[];
    S.menu.forEach(function(item,idx){
      if(item.cat!==cat)return;
      var qty=S.editCart[idx]||0;
      var priceBs=itemPriceBs(item);
      var ctrl=qty>0?'<div class="qty-ctrl"><button class="qty-btn" onclick="editQ('+idx+',-1)">-</button><span class="qty-num">'+qty+'</span><button class="qty-btn" onclick="editQ('+idx+',1)">+</button></div>':'<button class="add-btn" onclick="editQ('+idx+',1)">+</button>';
      rows.push('<div class="menu-item'+(qty>0?' selected':'')+'" style="padding:7px 12px;"><div style="flex:1;"><div class="mi-name" style="font-size:12px;">'+item.name+'</div><div style="display:flex;gap:8px;margin-top:2px;"><span class="mi-usd-main" style="font-size:11px;">$'+(item.usd||0).toFixed(2)+'</span><span class="mi-bs-calc" style="font-size:11px;">Bs.'+fmtN(priceBs)+'</span></div></div><div style="display:flex;align-items:center;">'+ctrl+'</div></div>');
    });
    return '<div style="background:var(--bg);border-radius:var(--rs);margin-bottom:6px;overflow:hidden;"><div style="padding:6px 12px 2px;"><span class="menu-cat-title">'+cat+'</span></div>'+rows.join('')+'</div>';
  }).join('');
  document.getElementById('edit-total').textContent='Bs.'+fmtN(editCartTotal())+' / $'+editCartTotalUSD().toFixed(2);
}
function editQ(idx,delta){S.editCart[idx]=Math.max(0,(S.editCart[idx]||0)+delta);renderEditMenu();}
function editCartTotal(){return Object.keys(S.editCart||{}).reduce(function(a,i){return a+(S.editCart[i]>0?itemPriceBs(S.menu[i])*S.editCart[i]:0);},0);}
function editCartTotalUSD(){return Object.keys(S.editCart||{}).reduce(function(a,i){return a+(S.editCart[i]>0?(S.menu[i].usd||0)*S.editCart[i]:0);},0);}
function saveEditSale(){
  var sale=S.sales.find(function(s){return s.id===S.editingSaleId;});if(!sale)return;
  var newTotal=editCartTotal();var newClient=document.getElementById('edit-client').value.trim()||'Anonimo';
  sale.client=newClient;
  if(newTotal>0)sale.items=Object.keys(S.editCart||{}).filter(function(i){return S.editCart[i]>0;}).map(function(i){return {name:S.menu[i].name,qty:S.editCart[i],usd:S.menu[i].usd||0,priceBs:itemPriceBs(S.menu[i])};});
  if(newClient!=='Anonimo'&&S.clients.indexOf(newClient)<0)S.clients.push(newClient);
  if(newTotal>0&&newTotal>sale.total&&sale.status==='pagado'){var diff=newTotal-sale.total;sale.total=newTotal;saveS();closeModal('editSaleModal');openDiffPayModal(sale.id,diff,newClient);}
  else if(newTotal>0&&newTotal!==sale.total){sale.total=newTotal;if(sale.status==='debe'){sale.debtRemaining=Math.max(0,newTotal-(sale.totalPaid||0));sale.debtRemainingUSD=S.bin?sale.debtRemaining/S.bin:null;}saveS();closeModal('editSaleModal');renderHome();renderDebts();}
  else{if(sale.id&&db)saveSale(sale);else saveS();closeModal('editSaleModal');renderHome();renderDebts();}
}
function openDiffPayModal(saleId,diff,client){
  S.diffSaleId=saleId;S.diffAmount=diff;clearPay('dp-');
  document.getElementById('diff-context').textContent='Se agregaron productos a la venta de '+client+'.';
  document.getElementById('diff-amount-lbl').textContent='Bs.'+fmtN(diff)+(S.bin?' = $'+(diff/S.bin).toFixed(2):'');
  document.getElementById('diff-remaining').textContent='Bs.'+fmtN(diff);
  document.getElementById('diff-rounding-note').style.display='none';
  openModal('diffPayModal');
}
function confirmDiffPay(){
  var sale=S.sales.find(function(s){return s.id===S.diffSaleId;});if(!sale)return;
  var bd=buildBD('dp-');
  if(bd.length>0){if(!sale.abonos)sale.abonos=[];var tb=bd.reduce(function(a,b){return a+b.amountBs;},0);sale.abonos.push({date:todayStr(),time:timeNow(),method:'mixto',breakdown:bd,amountBs:tb,bcvRate:S.bcv,binRate:S.bin,note:'Diferencia por edicion'});sale.totalPaid=(sale.totalPaid||0)+tb;}
  saveS();closeModal('diffPayModal');renderHome();renderDebts();
}
function deleteSale(){if(!confirm('Eliminar esta venta?'))return;deleteSaleFromDB(S.editingSaleId);closeModal('editSaleModal');renderHome();renderDebts();}

/* ── DEBTS ── */
function renderDebts(){
  var debts=S.sales.filter(function(s){return s.status==='debe'&&(s.debtRemaining!==undefined?s.debtRemaining:s.total)>0;});
  var totUSD=debts.reduce(function(a,s){var rem=s.debtRemaining!==undefined?s.debtRemaining:s.total;return a+(s.debtRemainingUSD!==undefined?s.debtRemainingUSD:bsToUSD(rem));},0);
  document.getElementById('debt-header-total').textContent=debts.length>0?'Total: '+fmtUSD(totUSD):'Sin deudas pendientes';
  var list=document.getElementById('debt-list');
  if(debts.length===0){list.innerHTML='<div class="empty-state"><div class="empty-icon">&#9989;</div>No hay deudas pendientes</div>';return;}
  list.innerHTML='<div style="background:var(--card);">'+debts.slice().reverse().map(function(s){var ini=s.client&&s.client!=='Anonimo'?s.client.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase():'?';var rem=s.debtRemaining!==undefined?s.debtRemaining:s.total;var remUSD=s.debtRemainingUSD!==undefined?s.debtRemainingUSD:bsToUSD(rem);var days=daysDiff(s.date);var abcnt=s.abonos&&s.abonos.length?' - '+s.abonos.length+' abono(s)':'';return '<div class="debt-row" onclick="openDebtModal('+s.id+')"><div class="av">'+ini+'</div><div style="flex:1;"><div class="s-name">'+s.client+'</div><div style="font-size:10px;color:var(--text3);">Hace '+days+' dia'+(days!==1?'s':'')+abcnt+'</div></div><div class="s-amt"><div class="debt-amount">'+fmtUSD(remUSD)+'</div><div class="s-usd">Bs.'+fmtN(rem)+' hoy</div></div></div>';}).join('')+'</div>';
}
function openDebtModal(id){
  var sale=S.sales.find(function(s){return s.id===id;});if(!sale)return;
  S.currentDebtId=id;
  var rem=sale.debtRemaining!==undefined?sale.debtRemaining:sale.total;
  var remUSD=sale.debtRemainingUSD!==undefined?sale.debtRemainingUSD:bsToUSD(rem);
  document.getElementById('debt-modal-name').textContent=sale.client;
  document.getElementById('debt-modal-info').innerHTML='<div class="summ-row"><span class="summ-lbl">Deuda original</span><span class="summ-val">'+(sale.debtAnchorUSD?fmtUSD(sale.debtAnchorUSD):'Bs.'+fmtN(sale.total))+'</span></div><div class="summ-row"><span class="summ-lbl">Saldo pendiente</span><div><div class="summ-val" style="color:var(--red);">'+fmtUSD(remUSD)+'</div><div style="font-size:11px;color:var(--text3);">Bs.'+fmtN(rem)+' a tasa de hoy</div></div></div><div class="summ-row" style="border:none;"><span class="summ-lbl">Desde</span><span class="summ-val">'+sale.date+'</span></div>';
  var abonos=sale.abonos||[];
  document.getElementById('abono-history').innerHTML=abonos.length===0?'<div style="padding:10px 14px;font-size:12px;color:var(--text3);">Sin abonos aun</div>':abonos.map(function(a){var methods=a.breakdown?a.breakdown.map(function(b){return (MNAMES[b.method]||b.method)+': '+(b.currency==='usd'?'$'+b.amountRaw.toFixed(2):'Bs.'+fmtN(b.amountBs));}).join(' + '):(MNAMES[a.method]||a.method);return '<div class="abono-row"><div><div style="font-size:12px;color:var(--text2);">'+a.date+' '+a.time+'</div><div style="font-size:11px;color:var(--text3);">'+methods+'</div></div><div class="abono-val">+ Bs.'+fmtN(a.amountBs)+'</div></div>';}).join('');
  clearPay('ab-');
  document.getElementById('abono-total-display').textContent='Bs. 0';
  document.getElementById('abono-rounding-note').style.display='none';
  openModal('debtModal');
}
function saveAbono(){
  var bd=buildBD('ab-');var totalBs=bd.reduce(function(a,b){return a+b.amountBs;},0);
  if(totalBs<=0){alert('Ingresa al menos un monto');return;}
  var sale=S.sales.find(function(s){return s.id===S.currentDebtId;});if(!sale)return;
  if(!sale.abonos)sale.abonos=[];
  sale.abonos.push({date:todayStr(),time:timeNow(),method:'mixto',breakdown:bd,amountBs:totalBs,bcvRate:S.bcv,binRate:S.bin});
  var remBs=Math.max(0,(sale.debtRemaining!==undefined?sale.debtRemaining:sale.total)-totalBs);
  if(remBs<=0){sale.status='pagado';sale.debtRemaining=0;sale.debtRemainingUSD=0;}
  else{sale.debtRemaining=remBs;sale.debtRemainingUSD=S.bin?remBs/S.bin:null;}
  sale.totalPaid=(sale.totalPaid||0)+totalBs;
  sale.ts=sale.ts||sale.id;
  saveSale(sale);
  closeModal('debtModal');renderDebts();renderHome();
}

/* ── OLD DEBT ── */
function updOldDebtUSD(){var amt=parseFloat(document.getElementById('old-debt-amount').value)||0;var prev=document.getElementById('old-debt-usd-preview');if(amt>0&&S.bin){prev.textContent='= '+fmtUSD(amt/S.bin)+' anclado (Binance: Bs.'+fmtN(S.bin)+')';prev.style.display='block';}else prev.style.display='none';}
function showAddDebtModal(){document.getElementById('old-debt-client').value='';document.getElementById('old-debt-amount').value='';document.getElementById('old-debt-date').value=todayStr();document.getElementById('old-debt-usd-preview').style.display='none';openModal('addDebtModal');}
function saveOldDebt(){
  var client=document.getElementById('old-debt-client').value.trim();var amount=parseFloat(document.getElementById('old-debt-amount').value)||0;var date=document.getElementById('old-debt-date').value||todayStr();
  if(!client||amount<=0){alert('Completa todos los campos');return;}
  var anchorUSD=S.bin?amount/S.bin:null;
  var debtSale={id:Date.now(),date:date,time:'00:00',client:client,items:[],total:amount,payMethod:'pagomovil',status:'debe',debtRemaining:amount,debtRemainingUSD:anchorUSD,debtAnchorUSD:anchorUSD,totalPaid:0,user:S.user,bcvRate:S.bcv,binRate:S.bin,abonos:[],legacy:true,ts:Date.now()};
  saveSale(debtSale);
  if(S.clients.indexOf(client)<0)S.clients.push(client);saveS();closeModal('addDebtModal');renderDebts();renderHome();
}

/* ── ARQUEO ── */
function calcArqueo(dateStr){
  var sales=S.sales.filter(function(s){return s.date===dateStr;});
  var totales={};ALL_M.forEach(function(m){totales[m]=0;});
  var totalBs=0,nVentas=sales.length,nPagado=0,nDebe=0;
  sales.forEach(function(s){
    if(s.status==='pagado')nPagado++;else nDebe++;
    (s.breakdown||[]).forEach(function(b){totales[b.method]=(totales[b.method]||0)+b.amountBs;totalBs+=b.amountBs;});
  });
  var abonosBs=0,abonosTotales={};ALL_M.forEach(function(m){abonosTotales[m]=0;});
  S.sales.forEach(function(s){
    (s.abonos||[]).forEach(function(a){
      if(a.date!==dateStr)return;
      abonosBs+=a.amountBs;
      (a.breakdown||[]).forEach(function(b){abonosTotales[b.method]=(abonosTotales[b.method]||0)+b.amountBs;});
    });
  });
  return {date:dateStr,nVentas:nVentas,nPagado:nPagado,nDebe:nDebe,totales:totales,totalBs:totalBs,abonosTotales:abonosTotales,abonosBs:abonosBs,cajaTotal:totalBs+abonosBs};
}
function renderArqueoHTML(data){
  var html='';
  html+='<div class="arq-section">RESUMEN</div>';
  html+='<div class="arq-row"><span class="arq-lbl">Ventas registradas</span><span class="arq-val">'+data.nVentas+'</span></div>';
  html+='<div class="arq-row"><span class="arq-lbl">Pagadas</span><span class="arq-val green">'+data.nPagado+'</span></div>';
  html+='<div class="arq-row"><span class="arq-lbl">Pendientes</span><span class="arq-val red">'+data.nDebe+'</span></div>';
  html+='<div class="arq-row total"><span class="arq-lbl">Total cobrado en ventas</span><div><div class="arq-val">Bs.'+fmtN(data.totalBs)+'</div>'+(S.bin?'<div class="arq-sub">$'+(data.totalBs/S.bin).toFixed(2)+' BIN</div>':'')+'</div></div>';
  html+='<div class="arq-section" style="margin-top:8px;">POR METODO (ventas)</div>';
  var hayV=false;ALL_M.forEach(function(m){if(data.totales[m]>0){hayV=true;var isUSD=ALL_M_USD.indexOf(m)>=0;html+='<div class="arq-row"><span class="arq-lbl">'+MNAMES[m]+'</span><div><div class="arq-val">Bs.'+fmtN(data.totales[m])+'</div>'+(isUSD&&S.bin?'<div class="arq-sub">$'+(data.totales[m]/S.bin).toFixed(2)+'</div>':'')+'</div></div>';}});
  if(!hayV)html+='<div style="padding:8px 14px;font-size:12px;color:var(--text3);">Sin cobros</div>';
  html+='<div class="arq-section" style="margin-top:8px;">ABONOS COBRADOS</div>';
  var hayA=false;ALL_M.forEach(function(m){if(data.abonosTotales[m]>0){hayA=true;var isUSD=ALL_M_USD.indexOf(m)>=0;html+='<div class="arq-row"><span class="arq-lbl">'+MNAMES[m]+'</span><div><div class="arq-val">Bs.'+fmtN(data.abonosTotales[m])+'</div>'+(isUSD&&S.bin?'<div class="arq-sub">$'+(data.abonosTotales[m]/S.bin).toFixed(2)+'</div>':'')+'</div></div>';}});
  if(!hayA)html+='<div style="padding:8px 14px;font-size:12px;color:var(--text3);">Sin abonos</div>';
  html+='<div class="arq-row total" style="margin-top:6px;background:var(--blue);border-radius:var(--rs);"><span class="arq-lbl" style="color:var(--gold-dim);">TOTAL CAJA</span><div><div class="arq-val" style="color:var(--gold);font-size:20px;">Bs.'+fmtN(data.cajaTotal)+'</div>'+(S.bin?'<div class="arq-sub" style="color:var(--gold-dim);">$'+(data.cajaTotal/S.bin).toFixed(2)+' BIN</div>':'')+'</div></div>';
  return html;
}
function openArqueo(){
  if(!canArqueo())return;
  var today=todayStr();
  document.getElementById('arqueo-date-input').value=today;
  document.getElementById('arqueo-fecha').textContent=formatDate(today);
  document.getElementById('arqueo-content').innerHTML=renderArqueoHTML(calcArqueo(today));
  openModal('arqueoModal');
}
function cambiarFechaArqueo(){
  var d=document.getElementById('arqueo-date-input').value;
  if(!d)return;
  document.getElementById('arqueo-fecha').textContent=formatDate(d);
  document.getElementById('arqueo-content').innerHTML=renderArqueoHTML(calcArqueo(d));
}
function exportArqueoCSV(){
  var d=document.getElementById('arqueo-date-input').value||todayStr();
  var data=calcArqueo(d);
  var rows=[['Arqueo de caja','La Bombonera'],['Fecha',d],[''],
    ['VENTAS',''],['Total ventas',data.nVentas],['Pagadas',data.nPagado],['Pendientes',data.nDebe],['Total cobrado Bs.',data.totalBs]];
  ALL_M.forEach(function(m){if(data.totales[m]>0)rows.push([MNAMES[m]+' (ventas)','Bs.'+Math.round(data.totales[m])]);});
  rows.push(['']);
  rows.push(['ABONOS','']);
  rows.push(['Total abonos Bs.',data.abonosBs]);
  ALL_M.forEach(function(m){if(data.abonosTotales[m]>0)rows.push([MNAMES[m]+' (abonos)','Bs.'+Math.round(data.abonosTotales[m])]);});
  rows.push(['']);
  rows.push(['TOTAL CAJA','Bs.'+Math.round(data.cajaTotal)]);
  if(S.bin)rows.push(['TOTAL CAJA USD','$'+(data.cajaTotal/S.bin).toFixed(2)]);
  var csv=rows.map(function(r){return r.join(',');}).join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='Arqueo_'+d+'.csv';a.click();URL.revokeObjectURL(url);
}

/* ── HISTORIAL ── */
function renderHistorial(){
  var from=document.getElementById('hist-from').value,to=document.getElementById('hist-to').value;
  var filtered=S.sales.filter(function(s){return s.date>=from&&s.date<=to;}).sort(function(a,b){return b.date<a.date?-1:b.date>a.date?1:b.id-a.id;});
  var paid=filtered.filter(function(s){return s.status==='pagado';});var totBs=paid.reduce(function(a,s){return a+s.total;},0);var totUSD=paid.reduce(function(a,s){return a+(s.totalUSD||0);},0);
  document.getElementById('hist-summary').innerHTML=filtered.length===0?'':'<div style="background:var(--card);border-radius:var(--rs);padding:10px 14px;margin-bottom:4px;box-shadow:var(--sh);display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:10px;color:var(--text2);">Total cobrado</div><div style="font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:18px;color:var(--blue);">$'+totUSD.toFixed(2)+'</div><div style="font-size:11px;color:var(--text3);">Bs.'+fmtN(totBs)+'</div></div><div style="text-align:right;"><div style="font-size:10px;color:var(--text2);">'+filtered.length+' ventas</div></div></div>';
  var byDate={};filtered.forEach(function(s){if(!byDate[s.date])byDate[s.date]=[];byDate[s.date].push(s);});
  var list=document.getElementById('hist-list');
  if(filtered.length===0){list.innerHTML='<div class="empty-state"><div class="empty-icon">&#128197;</div>Sin ventas en este periodo</div>';return;}
  list.innerHTML=Object.keys(byDate).map(function(date){var sales=byDate[date];var dayTot=sales.filter(function(s){return s.status==='pagado';}).reduce(function(a,s){return a+(s.totalUSD||0);},0);return '<div class="hist-day">'+formatDate(date)+' - $'+dayTot.toFixed(2)+'</div><div style="background:var(--card);">'+sales.map(saleRowHTML).join('')+'</div>';}).join('');
}
function exportCSV(){
  if(!isOwner()){alert('Solo los administradores pueden exportar.');return;}
  var from=document.getElementById('hist-from').value,to=document.getElementById('hist-to').value;
  var filtered=S.sales.filter(function(s){return s.date>=from&&s.date<=to;}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:a.id-b.id;});
  var cols=['Fecha','Hora','Cliente','Productos','Total USD','Total Bs.','Tasa Binance','Metodo','Estado'];
  var rows=filtered.map(function(s){var prods=s.items&&s.items.length?s.items.map(function(i){return i.name+' x'+i.qty;}).join(' | '):'Deuda';return [s.date,s.time,s.client,'"'+prods+'"',(s.totalUSD||0).toFixed(2),s.total,s.binRate||S.bin||'-',(MNAMES[s.payMethod]||s.payMethod||'-'),s.status];});
  var csv=[cols.join(',')].concat(rows.map(function(r){return r.join(',');})).join('\n');
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='LaBombonera_'+from+'_'+to+'.csv';a.click();URL.revokeObjectURL(url);
}

/* ── MENU EDITOR ── */
function renderMenuEditor(){
  var ed=document.getElementById('menu-editor');if(!ed)return;
  ed.innerHTML=S.menu.map(function(item,idx){
    var pbs=itemPriceBs(item);
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><div style="flex:1;"><div style="font-size:13px;font-weight:500;">'+item.name+'</div><div style="font-size:11px;color:var(--text2);">'+item.cat+'</div></div><div style="display:flex;align-items:center;gap:8px;"><div style="text-align:right;"><div style="font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:15px;color:var(--blue);">$'+(item.usd||0).toFixed(2)+'</div><div style="font-size:10px;color:var(--text3);">Bs.'+fmtN(pbs)+'</div></div><button onclick="showAddItemModal('+idx+')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;color:var(--text2);">editar</button><button onclick="delMenuItem('+idx+')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;color:var(--red);">x</button></div></div>';
  }).join('');
}
function showAddItemModal(idx){S.editingItemIdx=idx;document.getElementById('add-item-title').textContent=idx===null?'Nuevo producto':'Editar producto';if(idx!==null){var item=S.menu[idx];document.getElementById('item-cat').value=item.cat;document.getElementById('item-name').value=item.name;document.getElementById('item-usd').value=item.usd||'';}else{document.getElementById('item-name').value='';document.getElementById('item-usd').value='';}updItemPreview();openModal('addItemModal');}
function updItemPreview(){var u=parseFloat(document.getElementById('item-usd').value)||0;var el=document.getElementById('item-bs-preview');if(u>0&&S.bin){el.textContent='= Bs.'+fmtN(ceil50(u*S.bin))+' (tasa Binance: Bs.'+fmtN(S.bin)+')';el.style.display='block';}else el.style.display='none';}
function saveMenuItem(){var cat=document.getElementById('item-cat').value,name=document.getElementById('item-name').value.trim(),usd=parseFloat(document.getElementById('item-usd').value);if(!name||!usd){alert('Completa todos los campos');return;}if(S.editingItemIdx!==null)S.menu[S.editingItemIdx]={cat:cat,name:name,usd:usd};else S.menu.push({cat:cat,name:name,usd:usd});saveS();renderMenuEditor();renderMenu();closeModal('addItemModal');}
function delMenuItem(idx){if(!confirm('Eliminar "'+S.menu[idx].name+'"?'))return;S.menu.splice(idx,1);saveS();renderMenuEditor();renderMenu();}

/* ── MONTHLY ── */
function renderMonthlySummary(){
  var el=document.getElementById('monthly-summary');if(!el)return;
  var mo=new Date().toISOString().slice(0,7);var ms=S.sales.filter(function(s){return s.date&&s.date.startsWith(mo);});
  var paid=ms.filter(function(s){return s.status==='pagado';});
  var totBs=paid.reduce(function(a,s){return a+s.total;},0);
  var totUSD=paid.reduce(function(a,s){return a+(s.totalUSD||0);},0);
  var methods={};paid.forEach(function(s){methods[s.payMethod]=(methods[s.payMethod]||0)+s.total;});
  el.innerHTML='<div class="summ-row"><span class="summ-lbl">Total cobrado</span><div><div class="summ-val">$'+totUSD.toFixed(2)+'</div><div style="font-size:10px;color:var(--text3);">Bs.'+fmtN(totBs)+'</div></div></div><div class="summ-row"><span class="summ-lbl">Ventas del mes</span><span class="summ-val">'+ms.length+'</span></div><div style="height:1px;background:var(--border);"></div>'+Object.keys(methods).map(function(m){return '<div class="summ-row"><span class="summ-lbl">'+(MNAMES[m]||m)+'</span><span class="summ-val">Bs.'+fmtN(methods[m])+'</span></div>';}).join('');
}

/* ── MODALS ── */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('open');});});

loadS();


/* ══════════════════════════════════════════
   FIREBASE DATA LAYER
   Wraps Firestore ops. Falls back gracefully.
   ══════════════════════════════════════════ */

var db = null;
var unsubVentas = null;
var unsubPedidos = null;
var NEGOCIO_ID = 'la-bombonera'; /* unique ID per business */

function initFirebase() {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      console.warn('Firebase app not initialized');
      db = null;
      return;
    }
    db = firebase.firestore();
    /* offline persistence — ignore errors, not critical */
    db.enablePersistence({synchronizeTabs:true}).catch(function(err){
      console.warn('Persistence not available:', err.code);
    });
    console.log('Firebase Firestore ready');
    /* test connection with a small write */
    db.collection('negocios').doc(NEGOCIO_ID).set({
      _ping: Date.now(),
      appVersion: '2.0'
    }, {merge: true}).then(function(){
      console.log('Firestore write test OK');
      subscribeToData();
    }).catch(function(e){
      console.error('Firestore write test FAILED:', e);
      /* still try to subscribe for reads */
      subscribeToData();
    });
  } catch(e) {
    console.error('Firebase init error:', e);
    db = null;
  }
}

/* ── REAL-TIME SUBSCRIPTIONS ── */
function subscribeToData() {
  if (!db) return;

  /* Config (rates, menu, clients) */
  db.collection('negocios').doc(NEGOCIO_ID)
    .onSnapshot(function(doc) {
      if (!doc.exists) return;
      var data = doc.data();
      if (data.bcv) S.bcv = data.bcv;
      if (data.bin) S.bin = data.bin;
      if (data.tasaUpdated) S.tasaUpdated = data.tasaUpdated;
      if (data.menu && data.menu.length) S.menu = data.menu;
      if (data.clients && data.clients.length) S.clients = data.clients;
      /* Update UI */
      updRatesBar();
      renderMenu();
      if (document.getElementById('bcv-input')) {
        document.getElementById('bcv-input').value = S.bcv || '';
        document.getElementById('bin-input').value = S.bin || '';
      }
      updTasaLbl();
    }, function(err) { console.warn('Config sub error:', err); });

  /* Sales — real time */
  unsubVentas = db.collection('negocios').doc(NEGOCIO_ID)
    .collection('ventas')
    .limit(500)
    .onSnapshot(function(snap) {
      var sales = [];
      snap.forEach(function(doc) { sales.push(doc.data()); });
      /* sort by timestamp descending in memory */
      sales.sort(function(a,b){ return (b.ts||b.id||0)-(a.ts||a.id||0); });
      S.sales = sales;
      renderHome();
      renderDebts();
      if (document.getElementById('screen-historial').classList.contains('active')) {
        renderHistorial();
      }
    }, function(err) { console.error('Ventas subscription error:', err); });

  /* Pedidos — real time */
  unsubPedidos = db.collection('negocios').doc(NEGOCIO_ID)
    .collection('pedidos')
    .onSnapshot(function(snap) {
      var activos = [], hist = [];
      var today = todayStr();
      snap.forEach(function(doc) {
        var p = doc.data();
        if (p.status === 'listo' && p.doneDate === today) hist.push(p);
        else if (p.status === 'pendiente') activos.push(p);
      });
      pedidos = activos;
      pedidosHist = hist;
      renderPedidos();
    }, function(err) { console.warn('Pedidos sub error:', err); });
}

/* ── SAVE HELPERS ── */
function saveS() {
  /* always save config to localStorage as backup */
  try {
    localStorage.setItem('lb5', JSON.stringify({
      bcv: S.bcv, bin: S.bin, tasaUpdated: S.tasaUpdated,
      sales: S.sales, clients: S.clients, menu: S.menu
    }));
  } catch(e) {}

  if (!db) return;

  /* Save config doc */
  db.collection('negocios').doc(NEGOCIO_ID).set({
    bcv: S.bcv, bin: S.bin, tasaUpdated: S.tasaUpdated,
    menu: S.menu, clients: S.clients,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).catch(function(e) { console.warn('saveConfig:', e); });
}

function saveSale(sale) {
  /* add to local array immediately for instant UI */
  var existing = S.sales.findIndex(function(s) { return s.id === sale.id; });
  if (existing >= 0) S.sales[existing] = sale;
  else S.sales.unshift(sale);

  if (!db) { saveS(); return; }

  sale.ts = sale.ts || Date.now();
  db.collection('negocios').doc(NEGOCIO_ID)
    .collection('ventas').doc(String(sale.id))
    .set(sale)
    .catch(function(e) { console.warn('saveSale:', e); });
  saveS(); /* also update config/clients */
}

function deleteSaleFromDB(id) {
  S.sales = S.sales.filter(function(s) { return s.id !== id; });
  if (!db) { saveS(); return; }
  db.collection('negocios').doc(NEGOCIO_ID)
    .collection('ventas').doc(String(id)).delete()
    .catch(function(e) { console.warn('deleteSale:', e); });
}

function savePedidoDB(pedido) {
  if (!db) { savePedidos(); return; }
  db.collection('negocios').doc(NEGOCIO_ID)
    .collection('pedidos').doc(String(pedido.id))
    .set(pedido)
    .catch(function(e) { console.warn('savePedido:', e); });
}

function deletePedidoDB(id) {
  if (!db) { savePedidos(); return; }
  db.collection('negocios').doc(NEGOCIO_ID)
    .collection('pedidos').doc(String(id)).delete()
    .catch(function(e) { console.warn('deletePedido:', e); });
}

/* ── STALE RATES ALERT ── */
function checkRatesFreshness() {
  if (!S.tasaUpdated) return;
  /* tasaUpdated is a formatted string, check hours since last update */
  var stored = localStorage.getItem('lb5_rates_ts');
  if (!stored) return;
  var diff = (Date.now() - parseInt(stored)) / 3600000;
  var banner = document.getElementById('stale-rates-banner');
  if (banner) banner.style.display = diff >= 24 ? 'flex' : 'none';
}

/* ── ONLINE/OFFLINE INDICATOR ── */
function updateOnlineStatus() {
  var ind = document.getElementById('online-indicator');
  if (!ind) return;
  if (navigator.onLine) {
    ind.style.display = 'none';
  } else {
    ind.style.display = 'flex';
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);


/* ══════════════════════════════════════════
   MODULO PEDIDOS — completamente separado de ventas
   Estados: pendiente -> listo (desaparece de activos, queda en historial del dia)
   Conexion opcional: boton "Cobrar" abre pantalla de pago
   ══════════════════════════════════════════ */

var QUICK_NOTES=['Sin cebolla','Sin salsa','Sin vegetales','Sin queso','Sin salchicha','Sin papas/tostones','Para llevar','Delivery'];
var pedidos=[];        /* pedidos activos (pendiente) */
var pedidosHist=[];    /* pedidos listos del dia — se limpia al cambiar fecha */
var pedidoEditId=null;
var pedidoCart={};
var pedidoFromHistDate=null;

function loadPedidos(){
  try{
    var d=localStorage.getItem('lb5_p');
    if(d){var p=JSON.parse(d);pedidos=p.activos||[];pedidosHist=p.hist||[];}
    /* limpia historial si es de otro dia */
    var today=todayStr();
    pedidosHist=pedidosHist.filter(function(p){return p.doneDate===today;});
  }catch(e){pedidos=[];pedidosHist=[];}
}
function savePedidos(){
  try{localStorage.setItem('lb5_p',JSON.stringify({activos:pedidos,hist:pedidosHist}));}catch(e){}
}

/* ── RENDER PANTALLA PEDIDOS ── */
function renderPedidos(){
  renderPedidosActivos();
  renderPedidosHist();
  /* badge en nav */
  var badge=document.getElementById('ped-nav-badge');
  if(badge)badge.textContent=pedidos.length>0?pedidos.length:'';
  badge=document.getElementById('ped-count-sub');
  if(badge)badge.textContent=pedidos.length>0?pedidos.length+' activo'+(pedidos.length!==1?'s':''):'Sin pedidos activos';
}

function renderPedidosActivos(){
  var list=document.getElementById('pedido-list');
  if(!list)return;
  if(pedidos.length===0){
    list.innerHTML='<div class="empty-state"><div class="empty-icon">&#127860;</div>Sin pedidos en curso</div>';
    return;
  }
  list.innerHTML=pedidos.map(function(p){return pedCardHTML(p,false);}).join('');
}

function renderPedidosHist(){
  var sec=document.getElementById('pedido-hist-section');
  var list=document.getElementById('pedido-hist-list');
  if(!sec||!list)return;
  if(pedidosHist.length===0){sec.style.display='none';return;}
  sec.style.display='block';
  list.innerHTML=pedidosHist.map(function(p){return pedCardHTML(p,true);}).join('');
}

function pedCardHTML(p,done){
  var itemLines=p.items.map(function(it){
    var item=S.menu[it.menuIdx];
    var name=item?item.name:'?';
    var notes=[];
    if(it.notes&&it.notes.length)notes=notes.concat(it.notes);
    if(it.customNote&&it.customNote.trim())notes.push(it.customNote.trim());
    return '<div class="ped-item-row">'
      +'<span class="ped-item-name">'+it.qty+'x '+name+'</span>'
      +(notes.length?'<span class="ped-item-notes">'+notes.join(' · ')+'</span>':'')
      +'</div>';
  }).join('');
  var total=pedidoTotal(p);
  var usd=p.items.reduce(function(a,it){return a+(S.menu[it.menuIdx]?S.menu[it.menuIdx].usd*it.qty:0);},0);
  var actions='';
  if(!done){
    actions='<div class="ped-actions">'
      +'<button class="ped-edit-btn" onclick="openEditPedido('+p.id+')">&#9998; Editar</button>'
      +'<button class="ped-cobrar-btn" onclick="pedirCobro('+p.id+')">$ Cobrar</button>'
      +'<button class="ped-check-btn" onclick="marcarListo('+p.id+')">&#10003; Listo</button>'
      +'</div>';
  } else {
    actions='<div class="ped-actions">'
      +'<div style="font-size:11px;color:var(--green);font-family:Barlow Condensed,sans-serif;font-weight:700;padding:4px 0;">&#10003; Entregado '+p.doneTime+'</div>'
      +'<button class="ped-cobrar-btn" onclick="pedirCobro('+p.id+')">$ Cobrar</button>'
      +'</div>';
  }
  return '<div class="ped-card'+(done?' ped-done':'')+'" id="ped-'+p.id+'">'
    +'<div class="ped-header">'
      +'<div>'
        +'<div class="ped-client">'+p.client+'</div>'
        +'<div class="ped-time">Anotado '+p.createdAt+(done?' · Listo '+p.doneTime:'')+'</div>'
      +'</div>'
      +'<div style="text-align:right;flex-shrink:0;">'
        +'<div class="ped-total">$'+usd.toFixed(2)+'</div>'
        +(S.bin?'<div style="font-size:10px;color:var(--text3);">Bs.'+fmtN(total)+'</div>':'')
      +'</div>'
    +'</div>'
    +'<div class="ped-items">'+itemLines+'</div>'
    +actions
    +'</div>';
}

function pedidoTotal(p){
  return p.items.reduce(function(a,it){
    var item=S.menu[it.menuIdx];return a+(item?itemPriceBs(item)*it.qty:0);
  },0);
}

/* ── MARCAR LISTO ── */
function marcarListo(id){
  /* Update Firestore status */
  if(db){db.collection('negocios').doc(NEGOCIO_ID).collection('pedidos').doc(String(id)).update({status:'listo',doneDate:todayStr(),doneTime:timeNow()}).catch(function(e){console.warn(e);});}
  var _orig=id;
  var p=pedidos.find(function(x){return x.id===id;});
  if(!p)return;
  p.doneTime=timeNow();
  p.doneDate=todayStr();
  pedidosHist.unshift(p);  /* agrega al historial del dia */
  pedidos=pedidos.filter(function(x){return x.id!==id;});
  savePedidos();renderPedidos();
}

/* ── COBRAR (boton opcional) ── */
function pedirCobro(id){
  /* busca en activos y en historial */
  var p=pedidos.find(function(x){return x.id===id;})||pedidosHist.find(function(x){return x.id===id;});
  if(!p)return;
  if(!S.bin){alert('Ingresa la tasa Binance antes de cobrar.');return;}
  var total=pedidoTotal(p);
  var usd=p.items.reduce(function(a,it){return a+(S.menu[it.menuIdx]?S.menu[it.menuIdx].usd*it.qty:0);},0);
  var items=p.items.map(function(it){
    var item=S.menu[it.menuIdx];
    return {name:item?item.name:'?',qty:it.qty,usd:item?item.usd:0,priceBs:item?itemPriceBs(item):0,notes:it.notes||[],customNote:it.customNote||''};
  });
  S._pendingSale={
    id:Date.now(),date:todayStr(),time:timeNow(),
    client:p.client,items:items,total:total,totalUSD:usd,
    status:'pagado',debtRemaining:0,debtRemainingUSD:0,
    debtAnchorUSD:S.bin?total/S.bin:null,
    totalPaid:0,breakdown:[],payMethod:'pagomovil',
    user:S.user,bcvRate:S.bcv,binRate:S.bin,abonos:[],
    fromPedidoId:id
  };
  S.pagoTotal=total;
  clearPay('pm-');
  document.getElementById('pago-title').textContent='Cobrar pedido';
  document.getElementById('pago-context-lbl').textContent='Pedido de '+p.client;
  document.getElementById('pago-bs').textContent='Bs.'+fmtN(total);
  document.getElementById('pago-usd-lbl').textContent='= $'+usd.toFixed(2)+' USD (Binance: Bs.'+fmtN(S.bin)+')';
  document.getElementById('pago-back-btn').onclick=function(){S._pendingSale=null;goTo('pedidos');};
  selStatus('pagado');updateRemaining();
  goTo('pago');
}

/* ── NUEVO / EDITAR PEDIDO ── */
function openNuevoPedido(){
  pedidoEditId=null;pedidoCart={};
  document.getElementById('pedido-client-input').value='';
  document.getElementById('pedido-modal-title').textContent='Nuevo pedido';
  renderPedidoMenu();openModal('pedidoModal');
}
function openEditPedido(id){
  var p=pedidos.find(function(x){return x.id===id;});if(!p)return;
  pedidoEditId=id;pedidoCart={};
  p.items.forEach(function(it){pedidoCart[it.menuIdx]={qty:it.qty,notes:it.notes?it.notes.slice():[],customNote:it.customNote||''};});
  document.getElementById('pedido-client-input').value=p.client;
  document.getElementById('pedido-modal-title').textContent='Editar pedido';
  renderPedidoMenu();openModal('pedidoModal');
}

function renderPedidoMenu(){
  var cats=[];S.menu.forEach(function(m){if(cats.indexOf(m.cat)<0)cats.push(m.cat);});
  document.getElementById('pedido-menu-list').innerHTML=cats.map(function(cat){
    var rows=[];
    S.menu.forEach(function(item,idx){
      if(item.cat!==cat)return;
      var entry=pedidoCart[idx]||{qty:0,notes:[],customNote:''};
      var qty=entry.qty;
      var priceBs=itemPriceBs(item);
      var ctrl=qty>0
        ?'<div class="qty-ctrl"><button class="qty-btn" onclick="pedChgQ('+idx+',-1)">-</button><span class="qty-num">'+qty+'</span><button class="qty-btn" onclick="pedChgQ('+idx+',1)">+</button></div>'
        :'<button class="add-btn" onclick="pedChgQ('+idx+',1)">+</button>';
      var notesArea='';
      if(qty>0){
        var qbtns=QUICK_NOTES.map(function(n){
          var on=(entry.notes||[]).indexOf(n)>=0;
          return '<button class="quick-note'+(on?' qn-on':'')+'" onclick="pedToggleNote('+idx+',this)" data-note="'+n+'">'+n+'</button>';
        }).join('');
        notesArea='<div class="ped-notes-area"><div class="quick-notes">'+qbtns+'</div>'
          +'<input type="text" class="note-input" placeholder="Nota libre..." value="'+(entry.customNote||'')+'" oninput="pedSetNote('+idx+',this.value)"></div>';
      }
      rows.push(
        '<div class="menu-item'+(qty>0?' selected':'')+'">'
        +'<div style="flex:1;"><div class="mi-name">'+item.name+'</div>'
        +'<div style="display:flex;align-items:center;gap:8px;margin-top:2px;">'
        +'<span class="mi-usd-main">$'+item.usd.toFixed(2)+'</span>'
        +(S.bin?'<span class="mi-bs-calc">Bs.'+fmtN(priceBs)+'</span>':'')
        +'</div></div>'
        +'<div style="display:flex;align-items:center;">'+ctrl+'</div>'
        +'</div>'
        +(qty>0?notesArea:'')
      );
    });
    return '<div style="background:var(--card);margin-top:8px;">'
      +'<div style="padding:8px 14px 3px;"><span class="menu-cat-title">'+cat+'</span></div>'
      +rows.join('')+'</div>';
  }).join('');
  updPedidoTotal();
}

function pedChgQ(idx,delta){
  if(!pedidoCart[idx])pedidoCart[idx]={qty:0,notes:[],customNote:''};
  pedidoCart[idx].qty=Math.max(0,pedidoCart[idx].qty+delta);
  if(pedidoCart[idx].qty===0){pedidoCart[idx].notes=[];pedidoCart[idx].customNote='';}
  renderPedidoMenu();
}
function pedToggleNote(idx,btn){
  if(!pedidoCart[idx])return;
  var n=btn.getAttribute('data-note');
  var notes=pedidoCart[idx].notes||[];
  var pos=notes.indexOf(n);
  if(pos>=0)notes.splice(pos,1);else notes.push(n);
  pedidoCart[idx].notes=notes;
  btn.classList.toggle('qn-on',pos<0);
}
function pedSetNote(idx,val){
  if(!pedidoCart[idx])pedidoCart[idx]={qty:0,notes:[],customNote:''};
  pedidoCart[idx].customNote=val;
}
function updPedidoTotal(){
  var t=Object.keys(pedidoCart).reduce(function(a,i){var e=pedidoCart[i];return a+(e&&e.qty>0?itemPriceBs(S.menu[i])*e.qty:0);},0);
  var usd=Object.keys(pedidoCart).reduce(function(a,i){var e=pedidoCart[i];return a+(e&&e.qty>0?(S.menu[i].usd||0)*e.qty:0);},0);
  document.getElementById('pedido-total-bs').textContent='Bs.'+fmtN(t);
  document.getElementById('pedido-total-usd').textContent='$'+usd.toFixed(2);
}

function savePedido(){
  var client=document.getElementById('pedido-client-input').value.trim()||'Anonimo';
  var items=Object.keys(pedidoCart).filter(function(i){return pedidoCart[i]&&pedidoCart[i].qty>0;}).map(function(i){
    return {menuIdx:parseInt(i),qty:pedidoCart[i].qty,notes:pedidoCart[i].notes||[],customNote:pedidoCart[i].customNote||''};
  });
  if(items.length===0){alert('Agrega al menos un producto');return;}
  if(pedidoEditId!==null){
    var p=pedidos.find(function(x){return x.id===pedidoEditId;});
    if(p){p.client=client;p.items=items;}
  } else {
    pedidos.push({id:Date.now(),client:client,items:items,createdAt:timeNow(),status:'pendiente'});
    if(client!=='Anonimo'&&S.clients.indexOf(client)<0)S.clients.push(client);
  }
  var ped=pedidoEditId!==null?pedidos.find(function(x){return x.id===pedidoEditId;}):pedidos[pedidos.length-1];
  if(ped)savePedidoDB(ped);
  savePedidos();saveS();closeModal('pedidoModal');renderPedidos();
}

function deletePedidoActivo(id){
  if(!confirm('Eliminar este pedido?'))return;
  pedidos=pedidos.filter(function(x){return x.id!==id;});
  savePedidos();renderPedidos();
}

/* ── CONFIRM PAGO — maneja tanto venta directa como desde pedido ── */
function confirmPagoFull(){
  var bd=buildBD('pm-');
  var totalPaid=bd.reduce(function(a,b){return a+b.amountBs;},0);
  if(S.payStatus==='pagado'&&totalPaid===0){alert('Ingresa al menos un monto');return;}
  var sale;
  if(S._pendingSale){
    sale=S._pendingSale;
  } else {
    var client=document.getElementById('client-input').value.trim()||'Anonimo';
    var tusd=cartTotalUSD();
    var items=[];Object.keys(S.cart).forEach(function(i){if(S.cart[i]>0)items.push({name:S.menu[i].name,qty:S.cart[i],usd:S.menu[i].usd||0,priceBs:itemPriceBs(S.menu[i])});});
    var debtAmt=Math.max(0,S.pagoTotal-totalPaid);
    sale={id:Date.now(),date:todayStr(),time:timeNow(),client:client,items:items,total:S.pagoTotal,totalUSD:tusd,status:S.payStatus,debtRemaining:S.payStatus==='debe'?debtAmt:0,debtRemainingUSD:S.payStatus==='debe'&&S.bin?debtAmt/S.bin:0,debtAnchorUSD:S.bin?S.pagoTotal/S.bin:null,totalPaid:0,breakdown:[],payMethod:'pagomovil',user:S.user,bcvRate:S.bcv,binRate:S.bin,abonos:[]};
    if(client!=='Anonimo'&&S.clients.indexOf(client)<0)S.clients.push(client);
  }
  sale.status=S.payStatus;
  sale.totalPaid=totalPaid;
  sale.breakdown=bd;
  if(bd.length>0)sale.payMethod=bd[0].method;
  if(S.payStatus==='debe'){
    sale.debtRemaining=Math.max(0,sale.total-totalPaid);
    sale.debtRemainingUSD=S.bin?sale.debtRemaining/S.bin:0;
  } else {
    sale.debtRemaining=0;sale.debtRemainingUSD=0;
  }
  sale.ts = Date.now();
  saveSale(sale);
  var detailUSD=sale.totalUSD?'$'+sale.totalUSD.toFixed(2)+' ':'';
  document.getElementById('confirm-detail').textContent=sale.client+' - '+detailUSD+'(Bs.'+fmtN(sale.total)+') - '+(S.payStatus==='debe'?'quedo debiendo':'pagado');
  S._pendingSale=null;
  clearVenta();
  openModal('confirmModal');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      console.log('SW registered:', reg.scope);
    }).catch(function(err) {
      console.warn('SW registration failed:', err);
    });
  });
}