// ─────────────────────────────────────────
//  UTKU KATALOG — app.js
//  Firestore (veri) + Firebase Storage (resimler)
// ─────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDs0dYbZwwjwXGPmWQuA0mNixbuVYNSo4c",
  authDomain: "utkuhirdavat-2c56b.firebaseapp.com",
  projectId: "utkuhirdavat-2c56b",
  storageBucket: "utkuhirdavat-2c56b.firebasestorage.app",
  messagingSenderId: "739139104412",
  appId: "1:739139104412:web:f98e9db238a9b658f28759",
  measurementId: "G-8BBLZ3GT7R"
};

let app, db, auth;
try {
  app     = initializeApp(firebaseConfig);
  db      = getFirestore(app);
  auth    = getAuth(app);
} catch(e) {
  console.error("Firebase başlatılamadı:", e);
  document.body.innerHTML = `<div style="padding:40px;color:#c94c4c;font-family:sans-serif">❌ Firebase bağlantı hatası: ${e.message}</div>`;
}

// ─── WhatsApp KİŞİLER ───
const WA_CONTACTS = [
  { name: 'Emir', number: '905057271651' },
];

// ─── TELEFON KİŞİLER ───
const CALL_CONTACTS = [
  { name: 'Emir', number: '05057271651' },
];

// ─── TELEFON KİŞİ SEÇİM MODALI ───
function openCallChooser() {
  const existing = document.getElementById('callChooserOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'callChooserOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-top:3px solid #3b82f6;border-radius:16px;padding:32px 28px;width:100%;max-width:360px;text-align:center;animation:modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;">
      <div style="font-size:36px;margin-bottom:8px;">📞</div>
      <h3 style="font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:var(--text-primary);margin-bottom:6px;">Kimi Aramak İstersiniz?</h3>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">Aramak istediğiniz kişiyi seçin:</p>
      <div id="callContactBtns" style="display:flex;flex-direction:column;gap:12px;"></div>
      <button id="callCancelBtn" style="margin-top:16px;background:transparent;border:1px solid var(--border);color:var(--text-muted);padding:9px 24px;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;">İptal</button>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  document.getElementById('callCancelBtn').addEventListener('click', () => overlay.remove());

  const btnContainer = document.getElementById('callContactBtns');
  CALL_CONTACTS.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = `📞 ${c.name} — ${c.number}`;
    btn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 20px;border-radius:12px;background:#3b82f6;color:#fff;border:none;font-family:\'DM Sans\',sans-serif;font-weight:700;font-size:15px;cursor:pointer;width:100%;transition:opacity .2s;';
    btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
    btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
    btn.addEventListener('click', () => {
      overlay.remove();
      window.location.href = `tel:+9${c.number}`;
    });
    btnContainer.appendChild(btn);
  });
}

// WhatsApp kişi seçim modalını aç
function openWaChooser(message) {
  const existing = document.getElementById('waChooserOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'waChooserOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-top:3px solid #25D366;border-radius:16px;padding:32px 28px;width:100%;max-width:360px;text-align:center;animation:modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;">
      <div style="font-size:36px;margin-bottom:8px;">💬</div>
      <h3 style="font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:var(--text-primary);margin-bottom:6px;">WhatsApp ile Paylaş</h3>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">Mesajı göndermek istediğiniz kişiyi seçin:</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${WA_CONTACTS.map(c => `
          <a href="https://wa.me/${c.number}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener"
             onclick="document.getElementById('waChooserOverlay').remove()"
             style="display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 20px;border-radius:12px;background:#25D366;color:#fff;text-decoration:none;font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;transition:opacity .2s;"
             onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            ${escHtml(c.name)}
          </a>
        `).join('')}
      </div>
      <button onclick="document.getElementById('waChooserOverlay').remove()" style="margin-top:16px;background:transparent;border:1px solid var(--border);color:var(--text-muted);padding:9px 24px;border-radius:9px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;transition:border-color .2s,color .2s;" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'">İptal</button>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ─── STATE ───
let products      = [];
let categories    = [];
let sliderItems   = [];
let currentCategory = 'Tüm Ürünler';
let imgList       = [];
let imgFileList   = [];
let currentSort   = 'default';
let selectedIds   = new Set();

// ═══════════════════════════════════════
//  SEPET
// ═══════════════════════════════════════
let cart = [];

function getCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function getCartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function addToCart(e, id) {
  e.stopPropagation();
  const p = products.find(p => p.id === id);
  if (!p) return;
  if (p.stock === 'Stokta Yok') return toast('⚠️ Bu ürün stokta yok');
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id, name: p.name, price: p.price, img: (p.imgs && p.imgs[0]) || p.img || '', qty: 1 }); }
  updateCartFab();
  toast(`🛒 "${p.name}" sepete eklendi`);
  renderProducts();
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); updateCartFab(); renderCartDrawer(); renderProducts(); }
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id); if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  updateCartFab(); renderCartDrawer();
}
function updateCartFab() {
  const fab = document.getElementById('cartFab'), badge = document.getElementById('cartFabBadge'), count = getCartCount();
  fab.style.display = count > 0 ? 'flex' : 'none'; badge.textContent = count;
}
function openCart() { renderCartDrawer(); document.getElementById('cartOverlay').classList.add('open'); }
function closeCart() { document.getElementById('cartOverlay').classList.remove('open'); }
function closeCartOverlay(e) { if (e.target.id === 'cartOverlay') closeCart(); }

function renderCartDrawer() {
  const itemsEl = document.getElementById('cartItems'), footerEl = document.getElementById('cartFooter');
  if (cart.length === 0) { itemsEl.innerHTML = `<div class="cart-empty"><div style="font-size:48px;opacity:.3">🛒</div><p>Sepetiniz boş.</p></div>`; footerEl.innerHTML = ''; return; }
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      ${item.img ? `<img src="${item.img}" class="cart-item-img" alt=""/>` : `<div class="cart-item-img" style="background:var(--bg-card2)"></div>`}
      <div class="cart-item-info"><div class="cart-item-name">${escHtml(item.name)}</div><div class="cart-item-price">₺${formatPrice(item.price)}</div></div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
      </div>
      <button class="cart-item-del" onclick="removeFromCart('${item.id}')">✕</button>
    </div>`).join('');
  const total = getCartTotal();
  const waMsg = 'Merhaba, aşağıdaki ürünleri sipariş etmek istiyorum:\n\n' + cart.map(i => `• ${i.name} × ${i.qty}  →  ₺${formatPrice(i.price * i.qty)}`).join('\n') + `\n\nToplam: ₺${formatPrice(total)}`;

  footerEl.innerHTML = `
    <div class="cart-total"><span>Toplam</span><span style="color:var(--gold);font-weight:800;font-size:20px">₺${formatPrice(total)}</span></div>
    <button class="btn-wa cart-order-btn" id="cartWaBtn">💬 WhatsApp ile Sipariş Ver</button>
    <button class="cart-clear-btn" onclick="clearCart()">🗑 Sepeti Temizle</button>`;

  const cartWaBtn = document.getElementById('cartWaBtn');
  if (cartWaBtn) {
    cartWaBtn.addEventListener('click', () => {
      window.open('https://wa.me/905057271651?text=' + encodeURIComponent(waMsg), '_blank');
    });
  }
}
function clearCart() {
  if (!confirm('Sepeti temizlemek istediğinize emin misiniz?')) return;
  cart = []; updateCartFab(); renderCartDrawer(); renderProducts();
}

// ─── BEĞENİ ───
function getLikes() { try { return JSON.parse(localStorage.getItem('utku_likes') || '{}'); } catch { return {}; } }
function saveLikes(obj) { localStorage.setItem('utku_likes', JSON.stringify(obj)); }
function getLikeCount(id) { return getLikes()[id] || 0; }
function isLiked(id) { return !!JSON.parse(localStorage.getItem('utku_liked') || '{}')[id]; }
function toggleLike(e, id) {
  e.stopPropagation();
  const likes = getLikes(), liked = JSON.parse(localStorage.getItem('utku_liked') || '{}');
  if (liked[id]) { likes[id] = Math.max(0, (likes[id] || 1) - 1); delete liked[id]; }
  else { likes[id] = (likes[id] || 0) + 1; liked[id] = true; }
  saveLikes(likes); localStorage.setItem('utku_liked', JSON.stringify(liked)); renderProducts();
}

let adminUnlocked = false;
const WA_NUMBER = '905057271651', PHONE_NUMBER = '05057271651', MAX_IMGS = 5;
const SITE_URL = 'https://utkuhirdavat.com.tr';

// ─── FİREBASE STORAGE YÜKLEME (Cloudinary yerine) ───
async function uploadToFirebaseStorage(file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `urunler/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}

async function uploadImages(files) {
  return Promise.all(files.map(f => uploadToFirebaseStorage(f)));
}

// ═══════════════════════════════════════
//  ZİYARETÇİ SAYACI
// ═══════════════════════════════════════

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function recordVisit() {
  if (sessionStorage.getItem('utku_admin_session')) return;
  if (sessionStorage.getItem('utku_visit_recorded')) return;
  sessionStorage.setItem('utku_visit_recorded', '1');
  try {
    const today = getTodayKey();
    const docRef = doc(db, 'visits', today);
    await setDoc(docRef, { count: increment(1), date: today }, { merge: true });
  } catch(e) {
    console.warn('Ziyaret kaydedilemedi:', e);
  }
}

async function renderVisitStats() {
  const wrap = document.getElementById('visitStatsWrap');
  if (!wrap) return;
  wrap.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:12px 0">⏳ Yükleniyor...</div>`;
  try {
    const snap = await getDocs(collection(db, 'visits'));
    const allData = snap.docs.map(d => ({ date: d.data().date || d.id, count: d.data().count || 0 }));
    allData.sort((a, b) => a.date.localeCompare(b.date));

    const totalVisits = allData.reduce((s, d) => s + d.count, 0);
    const todayKey = getTodayKey();
    const todayData = allData.find(d => d.date === todayKey);
    const todayCount = todayData ? todayData.count : 0;

    const last30 = allData.slice(-30);
    const maxCount = Math.max(...last30.map(d => d.count), 1);

    const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    function fmtDate(dateStr) {
      const [,m,d] = dateStr.split('-');
      return `${parseInt(d)} ${monthNames[parseInt(m)-1]}`;
    }

    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-left:3px solid var(--gold);border-radius:var(--radius);padding:18px 20px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Toplam Ziyaret</div>
          <div style="font-size:28px;font-weight:800;color:var(--gold)">${totalVisits.toLocaleString('tr-TR')}</div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-left:3px solid var(--green);border-radius:var(--radius);padding:18px 20px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Bugün</div>
          <div style="font-size:28px;font-weight:800;color:var(--green)">${todayCount.toLocaleString('tr-TR')}</div>
        </div>
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-left:3px solid #3b82f6;border-radius:var(--radius);padding:18px 20px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Kayıtlı Gün</div>
          <div style="font-size:28px;font-weight:800;color:#3b82f6">${allData.length}</div>
        </div>
      </div>

      <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">Son ${last30.length} Günlük Ziyaret Grafiği</div>
      <div style="overflow-x:auto;padding-bottom:4px">
        <div style="display:flex;align-items:flex-end;gap:4px;height:140px;min-width:${last30.length * 28}px">
          ${last30.map(d => {
            const h = Math.max(4, Math.round((d.count / maxCount) * 120));
            const isToday = d.date === todayKey;
            const color = isToday ? 'var(--gold)' : 'rgba(201,168,76,0.35)';
            const borderColor = isToday ? 'var(--gold)' : 'rgba(201,168,76,0.5)';
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:22px" title="${fmtDate(d.date)}: ${d.count} ziyaret">
              <div style="font-size:9px;color:var(--text-muted);font-weight:700;line-height:1">${d.count}</div>
              <div style="width:100%;height:${h}px;background:${color};border:1px solid ${borderColor};border-radius:3px 3px 0 0;transition:.2s;cursor:default"
                onmouseover="this.style.background='var(--gold)';this.parentElement.querySelector('div:first-child').style.color='var(--gold)'"
                onmouseout="this.style.background='${color}';this.parentElement.querySelector('div:first-child').style.color='var(--text-muted)'"></div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:4px;min-width:${last30.length * 28}px;margin-top:4px">
          ${last30.map((d, i) => {
            const showLabel = i === 0 || i === last30.length - 1 || i % 5 === 0;
            return `<div style="flex:1;min-width:22px;text-align:center;font-size:8px;color:var(--text-muted);white-space:nowrap;overflow:hidden">${showLabel ? fmtDate(d.date) : ''}</div>`;
          }).join('')}
        </div>
      </div>

      <div style="margin-top:24px">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:10px">Son 10 Günün Detayı</div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);padding:8px 12px;border-bottom:1px solid var(--border)">Tarih</th>
              <th style="text-align:right;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);padding:8px 12px;border-bottom:1px solid var(--border)">Ziyaret</th>
            </tr>
          </thead>
          <tbody>
            ${[...allData].reverse().slice(0,10).map(d => `
              <tr style="${d.date === todayKey ? 'background:rgba(201,168,76,0.05)' : ''}">
                <td style="padding:10px 12px;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--border)">${fmtDate(d.date)} <span style="font-size:10px;color:var(--text-muted)">(${d.date})</span>${d.date === todayKey ? ' <span style="font-size:10px;font-weight:700;color:var(--gold)">● Bugün</span>' : ''}</td>
                <td style="padding:10px 12px;text-align:right;font-size:14px;font-weight:700;color:var(--gold);border-bottom:1px solid var(--border)">${d.count.toLocaleString('tr-TR')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    wrap.innerHTML = `<div style="color:var(--red);font-size:13px">❌ Ziyaret verisi yüklenemedi: ${e.message}</div>`;
  }
}

// ═══════════════════════════════════════
//  EXPORT / IMPORT
// ═══════════════════════════════════════

async function exportProducts() {
  const btn = document.getElementById('btnExport');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Dışa aktarılıyor...'; }
  try {
    const snap = await getDocs(collection(db, 'products'));
    const data = snap.docs.map(d => ({ firebaseId: d.id, ...d.data() }));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'urunler_yedek.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast(`✅ ${data.length} ürün dışa aktarıldı`);
  } catch (e) { toast('❌ Dışa aktarma hatası: ' + e.message); }
  finally { if (btn) { btn.disabled = false; btn.textContent = '📤 Dışa Aktar (JSON)'; } }
}

async function importProducts() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput?.files[0];
  if (!file) return toast('⚠️ Önce bir dosya seçin');
  if (!file.name.endsWith('.json')) return toast('⚠️ Yalnızca .json dosyası yüklenebilir');

  const btn = document.getElementById('btnImport');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Yükleniyor...'; }

  try {
    const text = await file.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Geçersiz JSON dosyası'); }
    if (!Array.isArray(data)) throw new Error('JSON bir dizi (array) olmalı');

    const snap = await getDocs(collection(db, 'products'));
    const existingByCode = {};
    snap.docs.forEach(d => {
      const code = d.data().stok_kodu || d.data().stockCode;
      if (code) existingByCode[code] = d.id;
    });

    let inserted = 0, updated = 0, skipped = 0;
    for (const item of data) {
      const { firebaseId, ...fields } = item;
      const code = fields.stok_kodu || fields.stockCode;
      try {
        if (code && existingByCode[code]) {
          await updateDoc(doc(db, 'products', existingByCode[code]), fields);
          updated++;
        } else {
          await addDoc(collection(db, 'products'), fields);
          inserted++;
        }
      } catch (e) { console.error('Ürün aktarma hatası:', e); skipped++; }
    }
    toast(`✅ Tamamlandı: ${inserted} eklendi, ${updated} güncellendi${skipped ? ', ' + skipped + ' atlandı' : ''}`);
    fileInput.value = '';
  } catch (e) { toast('❌ İçe aktarma hatası: ' + e.message); }
  finally { if (btn) { btn.disabled = false; btn.textContent = '📥 Yükle'; } }
}

// ─── INIT ───
window.addEventListener('DOMContentLoaded', () => {
  checkAdminHash(); checkProductHash(); showLoadingState();
  recordVisit();
  onSnapshot(collection(db, 'products'), snap => { products = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderAll(); renderSlider(); });
  onSnapshot(collection(db, 'categories'), snap => { categories = snap.docs.map(d => d.data().name); renderAll(); });
  onSnapshot(collection(db, 'slider'), snap => { sliderItems = snap.docs.map(d => ({ docId: d.id, ...d.data() })); renderSlider(); if (adminUnlocked) renderAdminSlider(); });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      adminUnlocked = true;
      sessionStorage.setItem('utku_admin_session', '1');
    } else {
      adminUnlocked = false;
    }
  });
});
function checkProductHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#urun-')) { const id = hash.replace('#urun-', ''); setTimeout(() => { const p = products.find(p => p.id === id); if (p) openModal(id); }, 1500); }
}
function showLoadingState() { const grid = document.getElementById('productGrid'); if (grid) grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>Yükleniyor...</p></div>`; }
function renderAll() {
  renderCatalogSidebar(); renderCategorySelect(); renderProducts();
  if (adminUnlocked) { renderAdminProductList(); renderAdminCatList(); renderAdminSlider(); renderStats(); }
}
function checkAdminHash() { if (window.location.hash === '#sys-7x9q') { showAdminLogin(); history.replaceState(null, '', window.location.pathname); } }

// ─── ADMIN GİRİŞ ───
function showAdminLogin() {
  const overlay = document.createElement('div'); overlay.id = 'adminLoginOverlay';
  overlay.innerHTML = `<div class="login-box"><div class="login-logo">⚙</div><h2>Yönetim Paneli</h2><p>Devam etmek için giriş yapın</p>
    <input type="email" id="adminEmailInput" placeholder="E-posta..." autocomplete="off" />
    <input type="password" id="adminPassInput" placeholder="Şifre..." autocomplete="off" />
    <div id="loginError" class="login-error"></div>
    <button onclick="submitAdminLogin()">Giriş Yap</button>
    <span class="login-cancel" onclick="closeAdminLogin()">İptal</span></div>`;
  document.body.appendChild(overlay); setTimeout(() => overlay.classList.add('visible'), 10);
  document.getElementById('adminPassInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitAdminLogin(); });
  document.getElementById('adminPassInput').focus();
}

async function submitAdminLogin() {
  const emailInput = document.getElementById('adminEmailInput');
  const passInput  = document.getElementById('adminPassInput');
  const email = emailInput ? emailInput.value.trim() : 'admin@utkuhirdavat.com';
  const pass  = passInput.value;
  const btn   = document.querySelector('#adminLoginOverlay button');
  const err   = document.getElementById('loginError');

  if (btn) { btn.disabled = true; btn.textContent = 'Giriş yapılıyor...'; }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    adminUnlocked = true;
    closeAdminLogin();
    openAdminPanel();
  } catch (e) {
    err.textContent = '❌ E-posta veya şifre hatalı!';
    passInput.value = '';
    setTimeout(() => { err.textContent = ''; }, 3000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Giriş Yap'; }
  }
}

function closeAdminLogin() { const o = document.getElementById('adminLoginOverlay'); if (o) { o.classList.remove('visible'); setTimeout(() => o.remove(), 300); } }
function openAdminPanel() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-admin').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  renderCategorySelect(); renderAdminProductList(); renderAdminCatList(); renderAdminSlider(); renderStats();
  renderVisitStats();
}

// ─── PAGE NAV ───
function openPage(name) {
  if (name === 'admin') { if (!adminUnlocked) { showAdminLogin(); return; } openAdminPanel(); return; }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event?.target?.classList.add('active');
  if (name === 'catalog') { renderCatalogSidebar(); renderProducts(); }
}

async function adminLogout() {
  try { await signOut(auth); } catch(e) {}
  adminUnlocked = false;
  selectedIds.clear();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-catalog').classList.add('active');
  renderCatalogSidebar(); renderProducts();
  toast('👋 Admin panelinden çıkış yapıldı');
}

// ─── ÇOKLU FOTOĞRAF PREVIEW ───
function previewImage(e) {
  const files = Array.from(e.target.files); if (!files.length) return;
  const remaining = MAX_IMGS - imgList.length; if (remaining <= 0) return toast(`⚠️ En fazla ${MAX_IMGS} fotoğraf`);
  let loaded = 0;
  files.slice(0, remaining).forEach(file => {
    imgFileList.push(file);
    const reader = new FileReader();
    reader.onload = ev => { imgList.push(ev.target.result); loaded++; if (loaded === Math.min(files.length, remaining)) renderImgPreviewList(); };
    reader.readAsDataURL(file);
  }); e.target.value = '';
}
function renderImgPreviewList() {
  const ph = document.getElementById('imgPlaceholder'), list = document.getElementById('imgPreviewList');
  if (imgList.length === 0) { ph.style.display = 'flex'; list.innerHTML = ''; return; }
  ph.style.display = 'none';
  list.innerHTML = imgList.map((src, i) => `<div class="img-thumb-wrap"><img src="${src}" class="img-thumb"/>${i === 0 ? '<span class="img-thumb-badge">Ana</span>' : ''}<button class="img-thumb-del" onclick="removeImg(${i})">×</button></div>`).join('');
  if (imgList.length < MAX_IMGS) list.innerHTML += `<div class="img-thumb-add" onclick="document.getElementById('imgFile').click()">＋</div>`;
}
function removeImg(i) { imgList.splice(i, 1); imgFileList.splice(i, 1); renderImgPreviewList(); }

// ─── ADD PRODUCT ───
async function addProduct() {
  const name = document.getElementById('prodName').value.trim(), desc = document.getElementById('prodDesc').value.trim();
  const price = parseFloat(document.getElementById('prodPrice').value), stock = document.getElementById('prodStock').value;
  const newCat = document.getElementById('prodCatNew').value.trim(), selCat = document.getElementById('prodCatSelect').value, cat = newCat || selCat;
  if (!name) return toast('⚠️ Ürün adı zorunlu'); if (!cat) return toast('⚠️ Kategori seç veya yaz'); if (isNaN(price) || price < 0) return toast('⚠️ Geçerli fiyat girin');
  const btn = document.getElementById('btnAddProduct'); btn.disabled = true; btn.textContent = imgFileList.length > 0 ? '📤 Resimler yükleniyor...' : 'Ekleniyor...';
  try {
    if (cat && !categories.includes(cat)) await addDoc(collection(db, 'categories'), { name: cat });
    let imgUrls = [];
    if (imgFileList.length > 0) { try { imgUrls = await uploadImages(imgFileList); } catch (uploadErr) { btn.disabled = false; btn.textContent = 'Ürünü Kataloga Ekle'; toast('❌ Resim yüklenemedi: ' + uploadErr.message); return; } }
    await addDoc(collection(db, 'products'), { name, desc, price, stock, cat, img: imgUrls[0] || '', imgs: imgUrls, createdAt: Date.now() });
    document.getElementById('prodName').value = ''; document.getElementById('prodDesc').value = ''; document.getElementById('prodPrice').value = '';
    document.getElementById('prodStock').selectedIndex = 0; document.getElementById('prodCatNew').value = ''; document.getElementById('prodCatSelect').value = '';
    imgList = []; imgFileList = []; renderImgPreviewList(); toast('✅ Ürün kataloğa eklendi!');
  } catch (e) { toast('❌ Hata: ' + e.message); } finally { btn.disabled = false; btn.textContent = 'Ürünü Kataloga Ekle'; }
}

// ─── DELETE PRODUCT ───
async function deleteProduct(id) {
  if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
  try {
    const sliderSnap = await getDocs(collection(db, 'slider'));
    for (const d of sliderSnap.docs) { if (d.data().productId === id) await deleteDoc(doc(db, 'slider', d.id)); }
    await deleteDoc(doc(db, 'products', id));
    cart = cart.filter(i => i.id !== id); updateCartFab();
    selectedIds.delete(id); updateBulkUI();
    toast('🗑️ Ürün silindi');
  } catch (e) { toast('❌ Hata: ' + e.message); }
}

// ─── EDIT PRODUCT ───
function editProduct(id) {
  const p = products.find(p => p.id === id); if (!p) return;
  const catOptions = categories.map(c => `<option value="${escHtml(c)}" ${c === p.cat ? 'selected' : ''}>${escHtml(c)}</option>`).join('');
  const imgs = p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : []);
  const overlay = document.createElement('div'); overlay.id = 'editOverlay';
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;`;
  overlay.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:32px;width:min(480px,90vw);max-height:90vh;overflow-y:auto;">
    <h2 style="margin:0 0 24px;color:var(--gold);font-family:'Playfair Display',serif">✏️ Ürünü Düzenle</h2>
    <div class="form-group" style="margin-bottom:16px"><label>Ürün Adı</label><input type="text" id="editName" value="${escHtml(p.name)}" /></div>
    <div class="form-group" style="margin-bottom:16px"><label>Açıklama</label><textarea id="editDesc" rows="3">${escHtml(p.desc)}</textarea></div>
    <div class="form-group" style="margin-bottom:16px"><label>Fiyat (₺)</label><input type="number" id="editPrice" value="${p.price}" min="0" step="1" /></div>
    <div class="form-group" style="margin-bottom:16px"><label>Stok Durumu</label>
      <select id="editStock">
        <option value="Stokta Var" ${p.stock === 'Stokta Var' ? 'selected' : ''}>✅ Stokta Var</option>
        <option value="Sınırlı Stok" ${p.stock === 'Sınırlı Stok' ? 'selected' : ''}>⚠️ Sınırlı Stok</option>
        <option value="Stokta Yok" ${p.stock === 'Stokta Yok' ? 'selected' : ''}>❌ Stokta Yok</option>
      </select></div>
    <div class="form-group" style="margin-bottom:16px"><label>Kategori</label><select id="editCat">${catOptions}</select></div>
    <div class="form-group" style="margin-bottom:24px">
      <label>Fotoğraflar (<span id="editImgCount">${imgs.length}</span>/${MAX_IMGS})</label>
      <div id="editImgList" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>
      <input type="file" id="editImgFile" accept="image/*" multiple style="display:none" onchange="addEditImg(event)"/>
    </div>
    <div style="display:flex;gap:12px"><button class="btn-add" style="flex:1" id="editSaveBtn" onclick="saveEditProduct('${id}')">Kaydet</button><button class="btn-logout" onclick="document.getElementById('editOverlay').remove()">İptal</button></div>
  </div>`;
  overlay._editImgs = [...imgs]; overlay._editNewFiles = []; overlay._editNewPreviews = [];
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay); refreshEditImgList(); document.getElementById('editName').focus();
}
function refreshEditImgList() {
  const overlay = document.getElementById('editOverlay'); if (!overlay) return;
  const existing = overlay._editImgs, newPrev = overlay._editNewPreviews, total = existing.length + newPrev.length;
  document.getElementById('editImgCount').textContent = total;
  document.getElementById('editImgList').innerHTML =
    existing.map((src, i) => `<div style="position:relative"><img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border)"/>${i === 0 && newPrev.length === 0 ? '<span style="position:absolute;top:2px;left:2px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 4px;border-radius:4px">Ana</span>' : ''}<button onclick="removeEditExistingImg(${i})" style="position:absolute;top:-6px;right:-6px;background:#e53e3e;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;">×</button></div>`).join('') +
    newPrev.map((src, i) => `<div style="position:relative"><img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--gold)"/>${existing.length === 0 && i === 0 ? '<span style="position:absolute;top:2px;left:2px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 4px;border-radius:4px">Ana</span>' : ''}<button onclick="removeEditNewImg(${i})" style="position:absolute;top:-6px;right:-6px;background:#e53e3e;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;">×</button></div>`).join('') +
    (total < MAX_IMGS ? `<div onclick="document.getElementById('editImgFile').click()" style="width:64px;height:64px;border:2px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-muted);font-size:22px">+</div>` : '');
}
function removeEditExistingImg(i) { const o = document.getElementById('editOverlay'); o._editImgs.splice(i, 1); refreshEditImgList(); }
function removeEditNewImg(i) { const o = document.getElementById('editOverlay'); o._editNewFiles.splice(i, 1); o._editNewPreviews.splice(i, 1); refreshEditImgList(); }
function addEditImg(e) {
  const overlay = document.getElementById('editOverlay'), files = Array.from(e.target.files);
  const total = overlay._editImgs.length + overlay._editNewFiles.length, remaining = MAX_IMGS - total;
  if (remaining <= 0) return toast(`⚠️ En fazla ${MAX_IMGS} fotoğraf`);
  let loaded = 0;
  files.slice(0, remaining).forEach(file => {
    overlay._editNewFiles.push(file);
    const reader = new FileReader();
    reader.onload = ev => { overlay._editNewPreviews.push(ev.target.result); loaded++; if (loaded === Math.min(files.length, remaining)) refreshEditImgList(); };
    reader.readAsDataURL(file);
  }); e.target.value = '';
}
async function saveEditProduct(id) {
  const name = document.getElementById('editName').value.trim(), desc = document.getElementById('editDesc').value.trim();
  const price = parseFloat(document.getElementById('editPrice').value), stock = document.getElementById('editStock').value, cat = document.getElementById('editCat').value;
  if (!name) return toast('⚠️ Ürün adı zorunlu'); if (isNaN(price) || price < 0) return toast('⚠️ Geçerli fiyat girin');
  const btn = document.getElementById('editSaveBtn'); btn.disabled = true; btn.textContent = 'Kaydediliyor...';
  try {
    const overlay = document.getElementById('editOverlay'), existing = overlay._editImgs, newFiles = overlay._editNewFiles;
    let newUrls = []; if (newFiles.length > 0) { toast('📤 Resimler yükleniyor...'); newUrls = await uploadImages(newFiles); }
    const allUrls = [...existing, ...newUrls];
    await updateDoc(doc(db, 'products', id), { name, desc, price, stock, cat, imgs: allUrls, img: allUrls[0] || '' });
    overlay.remove(); toast('✅ Ürün güncellendi!');
  } catch (e) { toast('❌ Hata: ' + e.message); btn.disabled = false; btn.textContent = 'Kaydet'; }
}

// ─── DELETE CATEGORY ───
async function deleteCategory(elOrCat) {
  const cat = typeof elOrCat === 'string' ? elOrCat : elOrCat.dataset.cat;
  const usedBy = products.filter(p => p.cat === cat);
  if (usedBy.length > 0) return toast(`⚠️ Bu kategori ${usedBy.length} üründe kullanılıyor.`);
  try {
    const snap = await getDocs(collection(db, 'categories')); const catDoc = snap.docs.find(d => d.data().name === cat);
    if (catDoc) await deleteDoc(doc(db, 'categories', catDoc.id)); toast('🗑️ Kategori silindi');
  } catch (e) { toast('❌ Hata: ' + e.message); }
}
function catSelectChanged() { const sel = document.getElementById('prodCatSelect').value; if (sel) document.getElementById('prodCatNew').value = ''; }

// ─── RENDER CATALOG SIDEBAR + MOBİL ÇİP BAR ───
function renderCatalogSidebar() {
  const list = document.getElementById('categoryList');
  document.getElementById('count-all').textContent = products.length;
  list.querySelectorAll('.cat-item-dynamic').forEach(i => i.remove());
  categories.forEach(cat => {
    const count = products.filter(p => p.cat === cat).length, li = document.createElement('li');
    li.className = 'cat-item cat-item-dynamic' + (currentCategory === cat ? ' active' : '');
    li.innerHTML = `<span class="cat-icon">🔧</span> ${escHtml(cat)}<span class="cat-count">${count}</span>`;
    li.onclick = () => selectCategory(cat, li); list.appendChild(li);
  });
  const allItem = list.querySelector('.cat-item:not(.cat-item-dynamic)');
  if (allItem) allItem.classList.toggle('active', currentCategory === 'Tüm Ürünler');
  renderMobileCatBar();
}

function renderMobileCatBar() {
  const bar = document.getElementById('mobileCatBar');
  if (!bar) return;
  const S = 'display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;padding:7px 14px;border-radius:20px;border:1px solid #2a2a2a;background:#171717;color:#8a8680;font-family:DM Sans,sans-serif;font-size:13px;font-weight:500;cursor:pointer;min-height:36px;user-select:none;-webkit-user-select:none;';
  const SA = 'display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;padding:7px 14px;border-radius:20px;border:1px solid #c9a84c;background:rgba(201,168,76,0.15);color:#c9a84c;font-family:DM Sans,sans-serif;font-size:13px;font-weight:700;cursor:pointer;min-height:36px;user-select:none;-webkit-user-select:none;';
  const CN = 'background:#1e1e1e;color:#555;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;display:inline-block;';
  const CA = 'background:rgba(201,168,76,0.25);color:#c9a84c;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;display:inline-block;';
  const allCount = products.length, allIsActive = currentCategory === 'Tüm Ürünler';
  let html = `<span style="${allIsActive ? SA : S}" onclick="selectCategoryMobile('Tüm Ürünler', this)" data-cat="Tüm Ürünler">📦 Tüm Ürünler <span style="${allIsActive ? CA : CN}">${allCount}</span></span>`;
  categories.forEach(cat => {
    const count = products.filter(p => p.cat === cat).length, isAct = currentCategory === cat;
    html += `<span style="${isAct ? SA : S}" onclick="selectCategoryMobile('${escHtml(cat).replace(/'/g, "\\'")}'  , this)" data-cat="${escHtml(cat)}">${escHtml(cat)} <span style="${isAct ? CA : CN}">${count}</span></span>`;
  });
  bar.innerHTML = html;
  const activeEl = [...bar.querySelectorAll('[data-cat]')].find(el => el.dataset.cat === currentCategory);
  if (activeEl) setTimeout(() => activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 50);
}

function selectCategoryMobile(cat, el) {
  currentCategory = cat;
  renderMobileCatBar();
  document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
  if (cat === 'Tüm Ürünler') {
    const allItem = document.querySelector('.cat-item:not(.cat-item-dynamic)');
    if (allItem) allItem.classList.add('active');
  } else {
    document.querySelectorAll('.cat-item-dynamic').forEach(i => { if (i.textContent.trim().startsWith(cat)) i.classList.add('active'); });
  }
  document.getElementById('currentCatLabel').textContent = cat;
  renderProducts();
}

function selectCategory(cat, el) {
  currentCategory = cat;
  document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('currentCatLabel').textContent = cat;
  renderMobileCatBar();
  renderProducts();
}

// ─── RENDER PRODUCTS ───
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const minPrice = parseFloat(document.getElementById('filterMinPrice')?.value) || 0;
  const maxPrice = parseFloat(document.getElementById('filterMaxPrice')?.value) || Infinity;
  const onlyStock = document.getElementById('filterStock')?.checked || false;
  let filtered = currentCategory === 'Tüm Ürünler' ? [...products] : products.filter(p => p.cat === currentCategory);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.desc || '').toLowerCase().includes(search) || p.cat.toLowerCase().includes(search));
  if (minPrice) filtered = filtered.filter(p => p.price >= minPrice);
  if (maxPrice !== Infinity) filtered = filtered.filter(p => p.price <= maxPrice);
  if (onlyStock) filtered = filtered.filter(p => p.stock === 'Stokta Var');
  const likes = getLikes();
  if (currentSort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (currentSort === 'popular') filtered.sort((a, b) => (likes[b.id] || 0) - (likes[a.id] || 0));
  document.getElementById('productCount').textContent = filtered.length + ' ürün';
  if (filtered.length === 0) { grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Sonuç bulunamadı.</p></div>`; return; }
  grid.innerHTML = filtered.map((p, i) => {
    const mainImg = (p.imgs && p.imgs[0]) || p.img || '';
    const extraCount = p.imgs && p.imgs.length > 1 ? p.imgs.length : 0;
    const inCart = cart.find(c => c.id === p.id), outOfStock = p.stock === 'Stokta Yok';
    return `<div class="product-card" style="animation-delay:${i * 0.04}s" onclick="openModal('${p.id}')">
      ${mainImg ? `<div style="position:relative"><img class="card-img" src="${mainImg}" alt="${escHtml(p.name)}" loading="lazy"/>${extraCount > 1 ? `<span class="card-img-count">+${extraCount - 1}</span>` : ''}</div>` : `<div class="card-img-placeholder"><span>📷</span><p>Görsel yok</p></div>`}
      <div class="card-body">
        <div class="card-cat">${escHtml(p.cat)}</div>
        <div class="card-name">${escHtml(p.name)}</div>
        <div class="card-desc">${escHtml(p.desc)}</div>
        <div class="card-footer">
          <div class="card-price">₺${formatPrice(p.price)}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="stock-badge ${stockClass(p.stock)}">${escHtml(p.stock)}</span>
            <button class="like-btn ${isLiked(p.id) ? 'liked' : ''}" onclick="toggleLike(event,'${p.id}')" title="Beğen">${isLiked(p.id) ? '♥' : '♡'} <span>${getLikeCount(p.id) || ''}</span></button>
          </div>
        </div>
        <button class="btn-add-cart ${outOfStock ? 'btn-add-cart-disabled' : ''} ${inCart ? 'btn-add-cart-in' : ''}" onclick="addToCart(event,'${p.id}')" ${outOfStock ? 'disabled' : ''}>
          ${outOfStock ? '❌ Stok Yok' : inCart ? `🛒 Sepette (${inCart.qty})` : '+ Sepete Ekle'}
        </button>
      </div></div>`;
  }).join('');
}
function filterProducts() { renderProducts(); }
function setSort(val) { currentSort = val; renderProducts(); }
function resetFilters() { document.getElementById('filterMinPrice').value = ''; document.getElementById('filterMaxPrice').value = ''; document.getElementById('filterStock').checked = false; renderProducts(); }

// ─── MODAL ───
function openModal(id) {
  const p = products.find(p => p.id === id); if (!p) return;
  const imgs = (p.imgs && p.imgs.length) ? p.imgs : (p.img ? [p.img] : []);
  const waOrderMsg = `Merhaba, *${p.name}* hakkında bilgi almak istiyorum.`;
  const galleryHtml = imgs.length > 0 ? `<div class="modal-img-wrap"><img class="modal-img" id="modalMainImg" src="${imgs[0]}" alt="${escHtml(p.name)}"/></div>${imgs.length > 1 ? `<div class="modal-thumbs">${imgs.map((src, i) => `<img src="${src}" class="modal-thumb ${i === 0 ? 'active' : ''}" onclick="switchModalImg(this,'${src}')"/>`).join('')}</div>` : ''}` : '';

  document.getElementById('modalContent').innerHTML = `${galleryHtml}
    <div class="modal-body">
      <div class="modal-cat">${escHtml(p.cat)}</div>
      <div class="modal-name">${escHtml(p.name)}</div>
      <div class="modal-desc">${escHtml(p.desc) || '<em style="color:var(--text-muted)">Açıklama girilmemiş.</em>'}</div>
      <div class="modal-footer"><div class="modal-price">₺${formatPrice(p.price)}</div><span class="stock-badge ${stockClass(p.stock)}">${escHtml(p.stock)}</span></div>
      <div class="modal-actions">
        <button class="btn-wa" onclick="window.open('https://wa.me/905057271651?text=' + encodeURIComponent('${escHtml(waOrderMsg).replace(/'/g,"\\'")}'  ), '_blank')">💬 Sipariş Ver</button>
        <button class="btn-share" onclick="shareProduct(event,this)" data-name="${escHtml(p.name)}" data-price="${formatPrice(p.price)}" data-id="${p.id}" data-img="${encodeURIComponent(imgs[0] || '')}">📤 Paylaş</button>
      </div>
      ${p.stock !== 'Stokta Yok' ? `<button class="btn-add-cart-modal" onclick="addToCart(event,'${p.id}');closeModalDirect()">🛒 Sepete Ekle</button>` : ''}
    </div>`;

  document.getElementById('modal').classList.add('open');
  history.pushState({ modal: id }, '', `#urun-${id}`);
}
function closeModalDirect() { document.getElementById('modal').classList.remove('open'); if (window.location.hash.startsWith('#urun-')) history.pushState(null, '', window.location.pathname); }
function shareProduct(e, btn) {
  const name = btn.dataset.name, price = btn.dataset.price, id = btn.dataset.id; e.stopPropagation();
  const productUrl = `${SITE_URL}#urun-${id}`, imgUrl = decodeURIComponent(btn.dataset.img);
  const msg = `${name} — ₺${price}\n\n${productUrl}${imgUrl ? '\n' + imgUrl : ''}`;
  openWaChooser(msg);
}
function switchModalImg(thumb, src) { document.getElementById('modalMainImg').src = src; document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active')); thumb.classList.add('active'); }
function closeModal(e) { if (e.target.id === 'modal') { document.getElementById('modal').classList.remove('open'); if (window.location.hash.startsWith('#urun-')) history.pushState(null, '', window.location.pathname); } }

// ─── RENDER ADMIN PRODUCT LIST ───
function renderAdminProductList() {
  const wrap = document.getElementById('adminProductList');
  const search = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  const filtered = search ? products.filter(p => p.name.toLowerCase().includes(search)) : products;
  if (products.length === 0) { wrap.innerHTML = '<p class="empty-msg">Henüz ürün yok.</p>'; return; }
  if (filtered.length === 0) { wrap.innerHTML = '<p class="empty-msg">Arama sonucu bulunamadı.</p>'; return; }
  wrap.innerHTML = `<table class="admin-table"><thead><tr><th style="width:32px"></th><th>Görsel</th><th>Ürün Adı</th><th>Kategori</th><th>Fiyat</th><th>Stok</th><th></th></tr></thead><tbody>
    ${filtered.map(p => {
      const thumb = (p.imgs && p.imgs[0]) || p.img || '';
      const count = p.imgs ? p.imgs.length : (p.img ? 1 : 0);
      const checked = selectedIds.has(p.id) ? 'checked' : '';
      return `<tr class="${selectedIds.has(p.id) ? 'row-selected' : ''}">
        <td><input type="checkbox" class="bulk-check" ${checked} onchange="toggleSelect('${p.id}',this.checked)" onclick="event.stopPropagation()"/></td>
        <td style="position:relative">${thumb ? `<img class="admin-thumb" src="${thumb}" alt=""/>` : `<div class="admin-thumb" style="background:var(--bg-card2);border-radius:6px;display:inline-block"></div>`}${count > 1 ? `<span style="position:absolute;top:2px;right:2px;background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 4px;border-radius:4px">${count}📷</span>` : ''}</td>
        <td class="admin-name">${escHtml(p.name)}</td><td>${escHtml(p.cat)}</td>
        <td style="color:var(--gold);font-weight:700">₺${formatPrice(p.price)}</td>
        <td><span class="stock-badge ${stockClass(p.stock)}">${escHtml(p.stock)}</span></td>
        <td style="display:flex;gap:8px;align-items:center"><button class="btn-edit" onclick="editProduct('${p.id}')">Düzenle</button><button class="btn-delete" onclick="deleteProduct('${p.id}')">Sil</button></td>
      </tr>`;
    }).join('')}</tbody></table>`;
  updateBulkUI();
}
function filterAdminProducts() { renderAdminProductList(); }

// ─── TOPLU SEÇİM ───
function toggleSelect(id, checked) {
  if (checked) selectedIds.add(id); else selectedIds.delete(id);
  updateBulkUI();
  document.querySelectorAll('.admin-table tbody tr').forEach(row => {
    const cb = row.querySelector('.bulk-check'); if (cb) row.classList.toggle('row-selected', cb.checked);
  });
}
function toggleSelectAll(checked) {
  document.querySelectorAll('.bulk-check').forEach(cb => { cb.checked = checked; const id = cb.closest('tr')?.querySelector('button.btn-edit')?.getAttribute('onclick')?.match(/'(.+?)'/)?.[1]; if (id) { if (checked) selectedIds.add(id); else selectedIds.delete(id); } });
  const search = (document.getElementById('adminSearchInput')?.value || '').toLowerCase();
  const filtered = search ? products.filter(p => p.name.toLowerCase().includes(search)) : products;
  filtered.forEach(p => { if (checked) selectedIds.add(p.id); else selectedIds.delete(p.id); });
  renderAdminProductList();
}
function updateBulkUI() {
  const count = selectedIds.size;
  const bulkCount = document.getElementById('bulkCount'); if (bulkCount) bulkCount.textContent = `${count} seçili`;
  const bulkActions = document.getElementById('bulkActions'); if (bulkActions) bulkActions.style.display = count > 0 ? 'flex' : 'none';
  const selectAll = document.getElementById('selectAllCheck');
  if (selectAll) {
    const total = products.length; selectAll.checked = count > 0 && count === total; selectAll.indeterminate = count > 0 && count < total;
  }
}
async function bulkDelete() {
  if (selectedIds.size === 0) return toast('⚠️ Önce ürün seçin');
  if (!confirm(`${selectedIds.size} ürünü silmek istediğinize emin misiniz?`)) return;
  const ids = [...selectedIds]; let ok = 0;
  for (const id of ids) {
    try {
      const sliderSnap = await getDocs(collection(db, 'slider'));
      for (const d of sliderSnap.docs) { if (d.data().productId === id) await deleteDoc(doc(db, 'slider', d.id)); }
      await deleteDoc(doc(db, 'products', id)); cart = cart.filter(i => i.id !== id); ok++;
    } catch (e) { console.error(e); }
  }
  selectedIds.clear(); updateCartFab(); toast(`🗑️ ${ok} ürün silindi`);
}
async function bulkChangeStock() {
  const sel = document.getElementById('bulkStockSelect'); if (!sel?.value) return toast('⚠️ Stok durumu seçin');
  if (selectedIds.size === 0) return toast('⚠️ Önce ürün seçin');
  const newStock = sel.value; let ok = 0;
  for (const id of selectedIds) { try { await updateDoc(doc(db, 'products', id), { stock: newStock }); ok++; } catch (e) { console.error(e); } }
  sel.value = ''; toast(`✅ ${ok} ürünün stoku güncellendi`);
}

// ─── İSTATİSTİK KARTLARI ───
function renderStats() {
  if (!adminUnlocked) return;
  const total = products.length;
  const catCount = categories.length;
  const inStock = products.filter(p => p.stock === 'Stokta Var').length;
  const outStock = products.filter(p => p.stock === 'Stokta Yok').length;
  const likes = getLikes();
  let topProd = null, topCount = 0;
  products.forEach(p => { const c = likes[p.id] || 0; if (c > topCount) { topCount = c; topProd = p; } });
  const avg = total > 0 ? products.reduce((s, p) => s + (p.price || 0), 0) / total : 0;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('statTotalProducts', total); set('statTotalCats', catCount); set('statInStock', inStock); set('statOutStock', outStock);
  set('statTopLiked', topProd ? `${escHtml(topProd.name)} (${topCount} ♥)` : 'Henüz beğeni yok');
  set('statAvgPrice', total > 0 ? `₺${formatPrice(Math.round(avg))}` : '—');
}

function renderAdminCatList() {
  const wrap = document.getElementById('adminCatList');
  if (categories.length === 0) { wrap.innerHTML = '<p class="empty-msg">Henüz kategori yok.</p>'; return; }
  wrap.innerHTML = categories.map(cat => `<div class="cat-chip">${escHtml(cat)}<span class="cat-chip-del" onclick="deleteCategory(this)" data-cat="${escHtml(cat)}" title="Sil">×</span></div>`).join('');
}
function renderCategorySelect() {
  const sel = document.getElementById('prodCatSelect'); if (!sel) return;
  const prev = sel.value; sel.innerHTML = '<option value="">-- Kategori Seç --</option>';
  categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat; opt.textContent = cat; sel.appendChild(opt); });
  if (prev) sel.value = prev;
}

// ═══════════════════════════════════════
//  BANNER SLIDER
// ═══════════════════════════════════════
let sliderCurrentIndex = 0, sliderTimer = null;
function renderSlider() {
  const section = document.getElementById('sliderSection'); if (!section) return;
  const sliderProducts = sliderItems.sort((a, b) => (a.order || 0) - (b.order || 0)).map(item => { const p = products.find(p => p.id === item.productId); return p ? { ...p, sliderLabel: item.label || '' } : null; }).filter(Boolean);
  if (sliderProducts.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const track = document.getElementById('sliderTrack'), dots = document.getElementById('sliderDots');
  track.innerHTML = sliderProducts.map((p, i) => {
    const img = (p.imgs && p.imgs[0]) || p.img || '';
    return `<div class="slide" data-index="${i}" onclick="openModal('${p.id}')">
      ${img ? `<img src="${img}" class="slide-img" alt="${escHtml(p.name)}" loading="lazy"/>` : `<div class="slide-img-placeholder">📷</div>`}
      <div class="slide-overlay">${p.sliderLabel ? `<div class="slide-label">${escHtml(p.sliderLabel)}</div>` : ''}<div class="slide-name">${escHtml(p.name)}</div><div class="slide-price">₺${formatPrice(p.price)}</div><span class="stock-badge ${stockClass(p.stock)}" style="align-self:flex-start">${escHtml(p.stock)}</span></div>
    </div>`;
  }).join('');
  dots.innerHTML = sliderProducts.map((_, i) => `<button class="slider-dot ${i === 0 ? 'active' : ''}" onclick="goSlide(${i})"></button>`).join('');
  sliderCurrentIndex = 0; startSliderAuto(sliderProducts.length);
}
function startSliderAuto(count) { clearInterval(sliderTimer); if (count < 2) return; sliderTimer = setInterval(() => nextSlide(), 4000); }
function goSlide(i) {
  const slides = document.querySelectorAll('.slide'), dots = document.querySelectorAll('.slider-dot'); if (!slides.length) return;
  const count = slides.length; sliderCurrentIndex = ((i % count) + count) % count;
  slides.forEach((s, idx) => s.classList.toggle('active', idx === sliderCurrentIndex));
  dots.forEach((d, idx) => d.classList.toggle('active', idx === sliderCurrentIndex));
}
function nextSlide() { goSlide(sliderCurrentIndex + 1); }
function prevSlide() { goSlide(sliderCurrentIndex - 1); }

// ─── ADMIN SLIDER ───
function renderAdminSlider() {
  const wrap = document.getElementById('adminSliderList'); if (!wrap) return;
  const sorted = [...sliderItems].sort((a, b) => (a.order || 0) - (b.order || 0)), usedIds = sorted.map(s => s.productId);
  if (sorted.length === 0) { wrap.innerHTML = '<p class="empty-msg">Slider boş — aşağıdan ürün ekleyin.</p>'; }
  else {
    wrap.innerHTML = sorted.map((item, i) => {
      const p = products.find(p => p.id === item.productId);
      const img = p ? ((p.imgs && p.imgs[0]) || p.img || '') : '';
      return `<div class="slider-admin-row">
        ${img ? `<img src="${img}" class="admin-thumb" style="flex-shrink:0"/>` : `<div class="admin-thumb" style="background:var(--bg-card2);border-radius:6px;flex-shrink:0"></div>`}
        <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p ? escHtml(p.name) : '(Silinmiş ürün)'}</div>
          <input type="text" value="${escHtml(item.label || '')}" placeholder="Etiket (örn: Bu Hafta Kampanya)" onchange="updateSliderLabel('${item.docId}',this.value)" style="margin-top:6px;width:100%;background:var(--bg-card2);border:1px solid var(--border);color:var(--text-primary);padding:5px 10px;border-radius:6px;font-family:'DM Sans',sans-serif;font-size:12px;outline:none"/></div>
        <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
          ${i > 0 ? `<button class="btn-edit" style="padding:4px 8px;font-size:11px" onclick="moveSliderItem('${item.docId}',-1)">↑</button>` : '<div style="height:26px"></div>'}
          ${i < sorted.length - 1 ? `<button class="btn-edit" style="padding:4px 8px;font-size:11px" onclick="moveSliderItem('${item.docId}',1)">↓</button>` : ''}
        </div>
        <button class="btn-delete" style="padding:5px 10px;font-size:12px;flex-shrink:0" onclick="removeSliderItem('${item.docId}')">Çıkar</button>
      </div>`;
    }).join('');
  }
  const addSel = document.getElementById('sliderAddSelect');
  if (addSel) { const available = products.filter(p => !usedIds.includes(p.id)); addSel.innerHTML = '<option value="">-- Ürün seç --</option>' + available.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join(''); }
}
async function addSliderItem() {
  const sel = document.getElementById('sliderAddSelect'); if (!sel || !sel.value) return toast('⚠️ Önce ürün seçin');
  if (sliderItems.length >= 6) return toast("⚠️ Slider'a en fazla 6 ürün eklenebilir");
  try { const maxOrder = sliderItems.reduce((m, s) => Math.max(m, s.order || 0), -1); await addDoc(collection(db, 'slider'), { productId: sel.value, label: '', order: maxOrder + 1 }); toast("✅ Slider'a eklendi"); }
  catch (e) { toast('❌ Hata: ' + e.message); }
}
async function removeSliderItem(docId) { try { await deleteDoc(doc(db, 'slider', docId)); toast("🗑️ Slider'dan çıkarıldı"); } catch (e) { toast('❌ Hata: ' + e.message); } }
async function updateSliderLabel(docId, label) { try { await updateDoc(doc(db, 'slider', docId), { label }); } catch (e) { toast('❌ Etiket kaydedilemedi'); } }
async function moveSliderItem(docId, direction) {
  const sorted = [...sliderItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  const idx = sorted.findIndex(s => s.docId === docId), swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= sorted.length) return;
  const a = sorted[idx], b = sorted[swapIdx];
  try { await updateDoc(doc(db, 'slider', a.docId), { order: b.order ?? swapIdx }); await updateDoc(doc(db, 'slider', b.docId), { order: a.order ?? idx }); }
  catch (e) { toast('❌ Sıralama kaydedilemedi'); }
}

// ─── TOAST ───
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }

// ─── HELPERS ───
function formatPrice(n) { const num = Number(n); if (Number.isInteger(num)) return num.toLocaleString('tr-TR'); return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function escHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function stockClass(s) { if (s === 'Stokta Var') return 'green'; if (s === 'Sınırlı Stok') return 'orange'; return 'red'; }

// Global
window.toggleAdminSection = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('admin-section--open');
};

window.openWaChooser=openWaChooser;
window.openCallChooser=openCallChooser;
window.toggleLike=toggleLike; window.setSort=setSort; window.openPage=openPage; window.adminLogout=adminLogout;
window.submitAdminLogin=submitAdminLogin; window.closeAdminLogin=closeAdminLogin;
window.previewImage=previewImage; window.removeImg=removeImg;
window.addProduct=addProduct; window.deleteProduct=deleteProduct;
window.editProduct=editProduct; window.saveEditProduct=saveEditProduct;
window.addEditImg=addEditImg; window.removeEditExistingImg=removeEditExistingImg;
window.removeEditNewImg=removeEditNewImg; window.deleteCategory=deleteCategory;
window.catSelectChanged=catSelectChanged; window.selectCategory=selectCategory;
window.selectCategoryMobile=selectCategoryMobile;
window.filterProducts=filterProducts; window.resetFilters=resetFilters;
window.openModal=openModal; window.closeModal=closeModal; window.closeModalDirect=closeModalDirect;
window.switchModalImg=switchModalImg; window.filterAdminProducts=filterAdminProducts;
window.shareProduct=shareProduct;
window.goSlide=goSlide; window.nextSlide=nextSlide; window.prevSlide=prevSlide;
window.addSliderItem=addSliderItem; window.removeSliderItem=removeSliderItem;
window.updateSliderLabel=updateSliderLabel; window.moveSliderItem=moveSliderItem;
window.addToCart=addToCart; window.removeFromCart=removeFromCart; window.changeQty=changeQty;
window.openCart=openCart; window.closeCart=closeCart; window.closeCartOverlay=closeCartOverlay; window.clearCart=clearCart;
window.toggleSelect=toggleSelect; window.toggleSelectAll=toggleSelectAll;
window.bulkDelete=bulkDelete; window.bulkChangeStock=bulkChangeStock;
window.exportProducts=exportProducts; window.importProducts=importProducts;
