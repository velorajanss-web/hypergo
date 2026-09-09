const input=document.getElementById("searchInput"),cards=document.getElementById("cards"),count=document.getElementById("count"),title=document.getElementById("resultTitle"),sort=document.getElementById("sort"),min=document.getElementById("min"),max=document.getElementById("max"),store=document.getElementById("store");let all=[];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function url(v){try{let u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:"#"}catch{return"#"}}
function num(v){if(v==null||v==="")return null;let s=String(v).replace(/[^\d,.-]/g,"");if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else if(s.includes(","))s=s.replace(",",".");let n=Number(s);return Number.isFinite(n)?n:null}
function money(v){let n=num(v);return n==null?"":new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(n)}
function applyFilters(){let list=[...all],lo=min.value===""?null:Number(min.value),hi=max.value===""?null:Number(max.value),s=store.value.trim().toLowerCase();if(s)list=list.filter(x=>String(x.source||"").toLowerCase().includes(s));if(lo!==null)list=list.filter(x=>{let p=num(x.price);return p!==null&&p>=lo});if(hi!==null)list=list.filter(x=>{let p=num(x.price);return p!==null&&p<=hi});if(sort.value==="cheap")list.sort((a,b)=>(num(a.price)??Infinity)-(num(b.price)??Infinity));if(sort.value==="expensive")list.sort((a,b)=>(num(b.price)??-Infinity)-(num(a.price)??-Infinity));if(sort.value==="title")list.sort((a,b)=>a.title.localeCompare(b.title,"tr"));render(list)}
function render(list){cards.innerHTML="";count.textContent=list.length+" sonuç";if(!list.length){cards.innerHTML='<div class="empty">Bu filtrelerle sonuç bulunamadı.</div>';return}list.forEach(x=>{let p=money(x.price),e=document.createElement("article");e.className="product";e.innerHTML=`${x.image?`<img class="pic" src="${esc(x.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'<div class="pic"></div>'}<div class="info">${x.type==="shopping"?'<span class="tag">ÜRÜN</span>':''}<h3>${esc(x.title)}</h3><div class="source">${esc(x.source)}</div><div class="desc">${esc(x.snippet)}</div></div><div class="side"><div class="${p?'price':'no-price'}">${p||"Fiyat bulunamadı"}</div><a class="go" href="${esc(url(x.link))}" target="_blank" rel="noopener noreferrer">Siteye git →</a></div>`;cards.appendChild(e)})}
async function search(){let q=input.value.trim();if(!q)return;title.textContent='"'+q+'"';count.textContent="";cards.innerHTML='<div class="loading">🔎 Ürünler, fiyatlar ve görseller aranıyor...</div>';try{let r=await fetch("/api/search?q="+encodeURIComponent(q)+"&v=FINAL7",{cache:"no-store"}),d=await r.json();if(!r.ok)throw Error(d.error||"Arama hatası");all=d.results||[];applyFilters();document.getElementById("sonuclar").scrollIntoView({behavior:"smooth"})}catch(e){cards.innerHTML='<div class="empty"><b>Arama hatası</b><br>'+esc(e.message)+'</div>'}}
function quick(q){input.value=q;search()}function clearFilters(){min.value="";max.value="";store.value="";sort.value="relevance";render(all)}function toggleNav(){document.getElementById("nav").classList.toggle("open")}function seller(){alert("Satıcı öne çıkarma sistemi ödeme altyapısına bağlanacak.")}
document.getElementById("searchBtn").onclick=search;input.onkeydown=e=>{if(e.key==="Enter")search()};sort.onchange=applyFilters;[min,max,store].forEach(x=>x.oninput=applyFilters);
// PWA / Ana ekrana ekleme
let deferredInstallPrompt = null;
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');
const installClose = document.getElementById('installClose');

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function showInstallPrompt(){
  if (isStandalone()) return;
  if (installPrompt) installPrompt.hidden = false;
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallPrompt();
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installPrompt) installPrompt.hidden = true;
  localStorage.setItem('hypergoInstalled', '1');
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch {}
      deferredInstallPrompt = null;
      if (installPrompt) installPrompt.hidden = true;
      return;
    }

    // iPhone/iPad: Safari does not expose beforeinstallprompt.
    if (isIOS()) {
      alert('iPhone/iPad’da HyperGo’yu eklemek için Safari’de Paylaş düğmesine dokunup “Ana Ekrana Ekle” seçeneğini seç.');
      return;
    }

    alert('Tarayıcı menüsünü açıp “Ana ekrana ekle” veya “Uygulamayı yükle” seçeneğini kullanabilirsin.');
  });
}

if (installClose) {
  installClose.addEventListener('click', () => {
    if (installPrompt) installPrompt.hidden = true;
    localStorage.setItem('hypergoInstallDismissed', '1');
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW kaydı başarısız:', err));
  });
}

// Install prompt may not fire until the browser decides the app is installable.
setTimeout(() => {
  if (!isStandalone() && isIOS() && localStorage.getItem('hypergoInstallDismissed') !== '1') showInstallPrompt();
}, 900);
