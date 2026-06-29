/* === APP.JS === */
let selectedCity = localStorage.getItem('gd_city') || 'Казань';
let cart = [], favList = [], activeChip = 'Все', revRating = 0;
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ru-RU');
const starsStr = n => '★'.repeat(n) + '☆'.repeat(5-n);

const PhoneMask = {
  bind(input) {
    if (!input || input.dataset.masked) return;
    input.dataset.masked = '1';
    input.addEventListener('input', function() {
      let v = this.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1,4);
      if (v.length >= 4) out += ') ' + v.slice(4,7);
      if (v.length >= 7) out += '-' + v.slice(7,9);
      if (v.length >= 9) out += '-' + v.slice(9,11);
      this.value = out;
    });
  },
  bindAll(root=document) {
    root.querySelectorAll('input[type="tel"]').forEach(inp => this.bind(inp));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PhoneMask.bindAll();
  $('cityName').textContent = selectedCity;
  Ticker.render();
  HeroSlider.render();
  Mega.render();
  CatIcons.render();
  Catalog.init();
  Advantages.render();
  Reviews.render();
  Reviews.renderStars();
  Footer.render();
  MobMenu.render();
  Anim.init();
  if (!localStorage.getItem('gd_city')) setTimeout(() => City.open(), 1200);
});

/* === TICKER === */
const Ticker = {
  render() {
    const h = TICKER_ITEMS.map(t =>
      `<span><svg class="ico ico-14"><use href="#${t.icon}"/></svg> ${t.text}</span>`
    ).join('');
    $('tickerTrack').innerHTML = h + h;
  }
};

/* === HERO SLIDER === */
const HeroSlider = {
  cur: 0, timer: null,
  render() {
    $('heroSlides').innerHTML = HERO_SLIDES.map((s, i) => `
      <div class="hero-slide${i===0?' active':''}" style="background:${s.bg}">
        <div class="ct hero-row">
          <div class="hero-txt">
            <span class="hero-label" style="background:${s.labelBg}">${s.label}</span>
            <h1>${s.title}</h1>
            <p class="hero-desc">${s.text}</p>
            <div class="hero-btns">
              <a href="${s.btn1.href}" class="btn-p">${s.btn1.text}</a>
              <a href="${s.btn2.href}" class="btn-o">${s.btn2.text}</a>
            </div>
          </div>
          <div class="hero-pic">
            <img src="${photoUrl(s.img,600,460)}" alt="" loading="${i===0?'eager':'lazy'}" decoding="async">
          </div>
        </div>
      </div>
    `).join('');
    $('heroDots').innerHTML = HERO_SLIDES.map((_, i) =>
      `<button class="hero-dot${i===0?' active':''}" onclick="HeroSlider.go(${i})"></button>`
    ).join('');
    this.auto();
  },
  go(n) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    slides[this.cur].classList.remove('active');
    dots[this.cur].classList.remove('active');
    this.cur = n;
    slides[this.cur].classList.add('active');
    dots[this.cur].classList.add('active');
  },
  next() { this.go((this.cur + 1) % HERO_SLIDES.length); this.auto(); },
  prev() { this.go((this.cur - 1 + HERO_SLIDES.length) % HERO_SLIDES.length); this.auto(); },
  auto() { clearInterval(this.timer); this.timer = setInterval(() => this.next(), 6000); }
};

/* === MEGA MENU === */
const Mega = {
  render() {
    $('megaGrid').innerHTML = MEGA.map(col => `
      <div class="mega-col"><div class="mega-t">${col.title}</div>
        ${col.links.map(l => {
          const cls = l[1]==='Все' ? ' mega-all' : '';
          const oc = l[1] ? ` onclick="Catalog.setChip('${l[1]}')"` : '';
          return `<a href="#catalog" class="mega-l${cls}"${oc}>${l[0]}</a>`;
        }).join('')}
      </div>`).join('');
  },
  toggle() {
    const m=$('megaMenu'),b=$('megaBd');
    if(m.classList.contains('on')){this.close();return}
    m.style.top=document.querySelector('.header').getBoundingClientRect().bottom+'px';
    m.classList.add('on');b.classList.add('on');
  },
  close(){$('megaMenu').classList.remove('on');$('megaBd').classList.remove('on')}
};

/* === CATEGORY ICONS === */
const CatIcons = {
  render() {
    $('catsGrid').innerHTML = CAT_ICONS.map(c => `
      <a href="#catalog" class="cat-ico" onclick="Catalog.setChip('${c.f}')">
        <div class="cat-ico-circle">
          <svg class="ico"><use href="#${c.ico}"/></svg>
        </div>
        <span>${c.name}</span>
      </a>`).join('');
  }
};

/* === CATALOG === */
let selectedColor = '';

const Catalog = {
  init() {
    this.renderChips();
    this.renderFilters();
    this.filter();
  },
  renderChips() {
    $('chips').innerHTML = CHIPS.map(c =>
      `<button class="chip${c===activeChip?' on':''}" onclick="Catalog.setChip('${c}')">${c}</button>`
    ).join('');
  },
  renderFilters() {
    // Материалы
    const mats = [...new Set(PRODUCTS.map(p => {
      const m = p.mat.split(',')[0].trim();
      return m;
    }))].sort();
    const sel = $('filterMat');
    if (sel) {
      sel.innerHTML = '<option value="">Все материалы</option>' +
        mats.map(m => `<option value="${m}">${m}</option>`).join('');
    }
    // Цвета
    const allClrs = [];
    PRODUCTS.forEach(p => {
      (p.clrs || []).forEach(c => {
        if (!allClrs.includes(c)) allClrs.push(c);
      });
    });
    const fc = $('filterColors');
    if (fc) {
      fc.innerHTML = allClrs.slice(0, 12).map(c =>
        `<div class="filter-color" style="background:${c}"
          onclick="Catalog.pickColor('${c}',this)"
          title="${c}"></div>`
      ).join('');
    }
  },
  pickColor(c, el) {
    if (selectedColor === c) {
      selectedColor = '';
      el.classList.remove('on');
    } else {
      selectedColor = c;
      document.querySelectorAll('.filter-color').forEach(
        d => d.classList.remove('on'));
      el.classList.add('on');
    }
    this.filter();
  },
  setChip(c) { activeChip = c; this.renderChips(); this.filter(); Mega.close(); },
  reset() {
    activeChip = 'Все';
    selectedColor = '';
    this.renderChips();
    const pf = $('priceFrom'); if (pf) pf.value = '';
    const pt = $('priceTo'); if (pt) pt.value = '';
    const fm = $('filterMat'); if (fm) fm.value = '';
    const so = $('saleOnly'); if (so) so.checked = false;
    document.querySelectorAll('.filter-color').forEach(
      d => d.classList.remove('on'));
    const cq = $('catQ'); if (cq) cq.value = '';
    const cs = $('catSort'); if (cs) cs.value = 'popular';
    this.filter();
  },
  filter() {
    const q = ($('catQ')||{}).value?.toLowerCase()||'';
    const pFrom = +($('priceFrom')||{}).value || 0;
    const pTo = +($('priceTo')||{}).value || 999999;
    const matF = ($('filterMat')||{}).value || '';
    const so = ($('saleOnly')||{}).checked;
    const sort = ($('catSort')||{}).value||'popular';
    let f = PRODUCTS.filter(p => {
      if (activeChip!=='Все' && p.cat!==activeChip) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (p.price < pFrom || p.price > pTo) return false;
      if (matF && !p.mat.toLowerCase().includes(matF.toLowerCase())) return false;
      if (selectedColor && !(p.clrs||[]).includes(selectedColor)) return false;
      if (so && !p.disc) return false;
      return true;
    });
    if(sort==='asc') f.sort((a,b)=>a.price-b.price);
    if(sort==='desc') f.sort((a,b)=>b.price-a.price);
    if(sort==='disc') f.sort((a,b)=>b.disc-a.disc);
    $('catCount').textContent = 'Показано '+f.length+' товаров';
    $('prodEmpty').style.display = f.length?'none':'block';
    $('prodGrid').innerHTML = f.map(p => {
      const bdg = p.badge==='sale'?`<div class="bdg-sale">-${p.disc}%</div>`:p.badge==='new'?`<div class="bdg-new">Новинка</div>`:p.badge==='hit'?`<div class="bdg-hit">Хит</div>`:'';
      const old = p.old?`<span class="p-old">${fmt(p.old)} ₽</span>`:'';
      return `<div class="p-card" onclick="Product.open(${p.id})">
        <div class="p-img">${bdg}<button class="p-fav" onclick="event.stopPropagation();Fav.toggle(this)">&#9825;</button>
          <img src="${photoUrl(p.img)}" alt="${p.name}" loading="lazy" decoding="async"></div>
        <div class="p-body"><div class="p-stars">${starsStr(p.rate)} <span>(${p.rev})</span></div>
          <div class="p-name">${p.name}</div><div class="p-meta">${p.colors} цв. · ${p.cat}</div>
          <div class="p-prices"><span class="p-price">${fmt(p.price)} ₽</span>${old}</div>
          <button class="btn-p w100 btn-sm" onclick="event.stopPropagation();Cart.add('${p.name.replace(/'/g,"\\'")}',${p.price})">В корзину</button></div></div>`;
    }).join('');
  }
};

/* === PRODUCT MODAL === */
const Product = {
  open(id) {
    const p = PRODUCTS.find(x=>x.id===id); if(!p)return;
    const old = p.old?`<span class="p-old" style="font-size:16px">${fmt(p.old)} ₽</span>`:'';
    const disc = p.disc?`<span class="bdg-sale" style="position:static;margin-left:8px">-${p.disc}%</span>`:'';
    const cols = (p.clrs||[]).map((c,i)=>
      `<div class="clr-dot${i===0?' on':''}" style="background:${c}" onclick="document.querySelectorAll('.clr-dot').forEach(e=>e.classList.remove('on'));this.classList.add('on')"></div>`
    ).join('');
    $('prodBody').innerHTML = `
      <div class="pm-img"><img src="${photoUrl(p.img,600,600)}" alt="${p.name}"></div>
      <div class="pm-info">
        <div class="pm-meta"><span class="pm-cat">${p.cat}</span><span class="pm-stars">${starsStr(p.rate)}</span><span class="pm-rev">(${p.rev} отзывов)</span></div>
        <h2>${p.name}</h2><p class="pm-desc">${p.desc}</p>
        <div class="pm-price-row"><span class="pm-price">${fmt(p.price)} ₽</span>${old}${disc}</div>
        <p class="pm-inst">Сборка: <b>${fmt(p.price <= 15000 ? 1800 : Math.round(p.price * 0.12))} ₽</b></p>
        ${cols?`<div style="margin-bottom:14px"><span style="font-size:12px;font-weight:600;color:var(--gr5);text-transform:uppercase;display:block;margin-bottom:6px">Цвет (${p.colors})</span><div class="pm-colors">${cols}</div></div>`:''}
        <div class="pm-btns"><button class="btn-p" style="flex:1" onclick="Cart.add('${p.name.replace(/'/g,"\\'")}',${p.price});Modal.close('prodModal')">В корзину</button><button class="btn-or" style="flex:1" onclick="Cart.add('${p.name.replace(/'/g,"\\'")}',${p.price});Modal.close('prodModal')">Купить сейчас</button></div>
        <div class="pm-specs"><h4>Характеристики</h4><div class="spec-row"><span>Размеры</span><span>${p.dims}</span></div><div class="spec-row"><span>Материал</span><span>${p.mat}</span></div><div class="spec-row"><span>Вес</span><span>${p.wt}</span></div><div class="spec-row"><span>Артикул</span><span>ГД-${String(p.id).padStart(5,'0')}</span></div></div>
      </div>`;
    Modal.open('prodModal');
  }
};

/* === MODAL === */
const Modal = {
  open(id){
    $(id).classList.add('on');
    document.body.style.overflow='hidden';
    if(id==='cityModal') City.render();
    setTimeout(() => PhoneMask.bindAll($(id)), 0);
  },
  close(id){$(id).classList.remove('on');document.body.style.overflow=''}
};

/* === CART === */
const Cart = {
  open(){ Modal.open('cartModal'); this.render(); },
  close(){ Modal.close('cartModal'); },
  add(n,p){const e=cart.find(i=>i.n===n);if(e)e.q++;else cart.push({n,p,q:1});this.badge();this.open()},
  rm(i){cart.splice(i,1);this.badge();this.render()},
  qty(i,d){cart[i].q+=d;if(cart[i].q<1)cart.splice(i,1);this.badge();this.render()},
  clear(){
    cart=[];
    cartDelivery=0;
    cartAssemblyCost=0;
    cartLiftCost=0;
    if($('cartAssembly')) $('cartAssembly').checked=false;
    if($('cartLift')) $('cartLift').checked=false;
    if($('cartLiftFloor')) $('cartLiftFloor').value=1;
    if($('cartDelPrice')) $('cartDelPrice').textContent='не рассчитана';
    this.badge();
    this.render();
  },
  print(){
    const goods = cart.reduce((s,i)=>s+i.p*i.q,0);
    const total = goods + cartDelivery + cartAssemblyCost + cartLiftCost;
    const city = ($('cartDelCity')||{}).value || '—';
    const addr = ($('cartDelAddr')||{}).value || '—';
    const phone = ($('cartDelPhone')||{}).value || '—';
    const floors = ($('cartLift')&&$('cartLift').checked) ? (($('cartLiftFloor')||{}).value || '1') : '—';
    const win = window.open('', '_blank');
    const rows = cart.map(i => `<tr><td>${i.n}</td><td>${i.q}</td><td>${fmt(i.p*i.q)} ₽</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Заказ</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}.sum{margin-top:20px;font-size:16px}</style></head><body><h1>Эстетика Дома — заказ</h1><p><b>Город:</b> ${city}<br><b>Адрес:</b> ${addr}<br><b>Телефон:</b> ${phone}</p><table><thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead><tbody>${rows}</tbody></table><div class="sum"><p><b>Товары:</b> ${fmt(goods)} ₽</p><p><b>Сборка:</b> ${fmt(cartAssemblyCost)} ₽</p><p><b>Подъём:</b> ${fmt(cartLiftCost)} ₽ ${floors !== '—' ? '(этаж: '+floors+')' : ''}</p><p><b>Доставка:</b> ${fmt(cartDelivery)} ₽</p><p><b>Итого:</b> ${fmt(total)} ₽</p></div><script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  },
  badge(){$('cartBadge').textContent=cart.reduce((s,i)=>s+i.q,0)},
  render(){
    const el=$('cartList'),ft=$('cartFoot');
    $('cartCnt').textContent=`(${cart.reduce((s,i)=>s+i.q,0)})`;
    if(!cart.length){
      el.innerHTML='<div class="panel-empty">Корзина пуста</div>';
      ft.style.display='none';
      cartDelivery = 0;
      cartAssemblyCost = 0;
      cartLiftCost = 0;
      if($('sumGoods')) $('sumGoods').textContent='0 ₽';
      if($('sumAssembly')) $('sumAssembly').textContent='0 ₽';
      if($('sumLift')) $('sumLift').textContent='0 ₽';
      if($('sumDelivery')) $('sumDelivery').textContent='0 ₽';
      if($('cartTotalFinal')) $('cartTotalFinal').textContent='0 ₽';
      return;
    }
    ft.style.display='block';
    let t=0;
    el.innerHTML=cart.map((it,i)=>{
      t+=it.p*it.q;
      return`<div class="cart-item"><div><div class="ci-name">${it.n}</div><div class="ci-price">${fmt(it.p*it.q)} ₽</div></div><div class="ci-qty"><button class="qty-btn" onclick="Cart.qty(${i},-1)">−</button><span>${it.q}</span><button class="qty-btn" onclick="Cart.qty(${i},1)">+</button><button class="ci-rm" onclick="Cart.rm(${i})">&times;</button></div></div>`
    }).join('');
    $('cartSum').textContent=fmt(t)+' ₽';

    ['cartDelCity','cartDelName','cartDelAddr','cartDelPhone','cartDelTime','cartLiftFloor']
      .forEach(id => {
        const el = $(id);
        if (!el || el.dataset.bound) return;
        el.dataset.bound = '1';
        el.addEventListener('change', () => {
          CartDel.saveSaved({
            city: $('cartDelCity')?.value || '',
            name: $('cartDelName')?.value || '',
            addr: $('cartDelAddr')?.value || '',
            phone: $('cartDelPhone')?.value || '',
            time: $('cartDelTime')?.value || 'Любое время'
          });
          CartDel.renderMap();
        });
      });

    // Автоподстановка/пересчёт
    CartDel.restore();
    CartExtras.update();
    this.updateTotal();
    PhoneMask.bindAll($('cartModal'));
  },
  updateTotal() {
    const t = cart.reduce((s,i)=>s+i.p*i.q,0);
    const total = t + cartDelivery + cartAssemblyCost + cartLiftCost;
    if ($('sumGoods')) $('sumGoods').textContent = fmt(t) + ' ₽';
    if ($('sumAssembly')) $('sumAssembly').textContent = fmt(cartAssemblyCost) + ' ₽';
    if ($('sumLift')) $('sumLift').textContent = fmt(cartLiftCost) + ' ₽';
    if ($('sumDelivery')) $('sumDelivery').textContent = fmt(cartDelivery) + ' ₽';
    $('cartTotalFinal').textContent = fmt(total) + ' ₽';
  }
};

/* === FAV === */
const Fav = {
  open(){ Modal.open('favModal'); this.render(); },
  close(){ Modal.close('favModal'); },
  toggle(btn){
    const n=btn.closest('.p-card').querySelector('.p-name').textContent;
    const i=favList.indexOf(n);
    if(i>-1){favList.splice(i,1);btn.innerHTML='&#9825;';btn.classList.remove('on')}
    else{favList.push(n);btn.innerHTML='&#9829;';btn.classList.add('on')}
    const b=$('favBadge');b.textContent=favList.length;b.classList.toggle('shown',favList.length>0);
  },
  render(){
    $('favCnt').textContent=`(${favList.length})`;
    if(!favList.length){$('favList').innerHTML='<div class="panel-empty">Список пуст</div>';return}
    $('favList').innerHTML=favList.map((n,i)=>
      `<div class="cart-item"><span>${n}</span><button class="ci-rm" onclick="favList.splice(${i},1);Fav.render();var b=$('favBadge');b.textContent=favList.length;b.classList.toggle('shown',favList.length>0)">&times;</button></div>`
    ).join('');
  }
};

/* === ADVANTAGES === */
const Advantages = {
  render() {
    $('advGrid').innerHTML = ADVANTAGES.map(a => `
      <div class="adv-card" data-anim="up">
        <div class="adv-ico" style="background:${a.bg};color:${a.color}">
          <svg class="ico ico-24"><use href="#${a.icon}"/></svg></div>
        <h3>${a.title}</h3><p>${a.desc}</p>
      </div>`).join('');
  }
};

/* === REVIEWS === */
const Reviews = {
  render(){
    $('revsGrid').innerHTML = REVIEWS_DATA.map(r => `
      <div class="rev-card"><div class="rev-head"><div class="rev-av">${r.init}</div>
        <div><div class="rev-name">${r.name}</div><div class="rev-date">${r.date}</div></div>
        <div class="rev-stars">${starsStr(r.stars)}</div></div>
        <p>${r.text}</p></div>`).join('');
  },
  renderStars(){
    $('starsPick').innerHTML=[1,2,3,4,5].map(n=>
      `<span class="r-star" onclick="Reviews.rate(${n})">&#9733;</span>`).join('');
  },
  rate(n){
    revRating=n;
    document.querySelectorAll('.r-star').forEach((s,i)=>s.classList.toggle('on',i<n));
    const l=$('starsTxt');
    l.textContent=['','Ужасно','Плохо','Нормально','Хорошо','Отлично!'][n];
    l.style.color=n>=4?'var(--g600)':n>=3?'var(--o500)':'#dc2626';
  },
  submit(e){
    e.preventDefault();
    const name=$('revName').value.trim(),text=$('revText').value.trim();
    if(!revRating||!name||!text)return;
    $('revForm').style.display='none';$('revOk').classList.add('show');
    const d=new Date(),ms=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    const ds=d.getDate()+' '+ms[d.getMonth()]+' '+d.getFullYear();
    const div=document.createElement('div');div.className='rev-card';div.style.animation='fadeUp .4s ease';
    div.innerHTML=`<div class="rev-head"><div class="rev-av">${name[0].toUpperCase()}</div><div><div class="rev-name">${name}</div><div class="rev-date">${ds}</div></div><div class="rev-stars">${starsStr(revRating)}</div></div><p>${text}</p>`;
    $('revsGrid').prepend(div);
  }
};

/* === FOOTER === */
const Footer = {
  render(){
    $('footerGrid').innerHTML=`
      <div class="f-col f-about">
        <div class="f-logo">
          <svg class="f-logo-ico" viewBox="156 156 200 200">
            <rect x="156" y="156" width="200" height="200" rx="40" fill="#2E5A45"/>
            <g transform="translate(176,226)">
              <rect x="20" y="0" width="120" height="35" rx="8" fill="#d4af7a" stroke="#2E5A45" stroke-width="2"/>
              <rect x="15" y="30" width="60" height="25" rx="6" fill="#d4af7a" stroke="#2E5A45" stroke-width="2"/>
              <rect x="85" y="30" width="60" height="25" rx="6" fill="#d4af7a" stroke="#2E5A45" stroke-width="2"/>
              <path d="M5 25Q0 25 0 30L0 50Q0 55 5 55L15 55 15 30Q15 25 10 25Z" fill="#d4af7a" stroke="#2E5A45" stroke-width="2" stroke-linejoin="round"/>
              <path d="M155 25Q160 25 160 30L160 50Q160 55 155 55L145 55 145 30Q145 25 150 25Z" fill="#d4af7a" stroke="#2E5A45" stroke-width="2" stroke-linejoin="round"/>
              <path d="M25 55L20 70 25 70 28 55Z" fill="#d4af7a" stroke="#2E5A45" stroke-width="1.5"/>
              <path d="M135 55L132 70 137 70 140 55Z" fill="#d4af7a" stroke="#2E5A45" stroke-width="1.5"/>
            </g>
          </svg>
          <span class="f-logo-text">Эстетика Дома</span>
        </div>
        <p>Интернет-магазин мебели в Казани. 100+ товаров от проверенных российских фабрик. Доставка по городу и России, профессиональная сборка.</p>
        <div class="f-social">
          <a href="#" class="soc-btn" title="ВКонтакте">
            <svg class="soc-ico" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.56 13.56s.24-.03.36-.16c.11-.12.11-.35.11-.35s-.02-1.08.49-1.24c.49-.16 1.13 1.04 1.8 1.5.51.35.9.27.9.27l1.8-.02s.94-.06.5-.8c-.04-.06-.26-.55-1.34-1.55-1.13-1.05-.98-.88.38-2.7.83-1.1 1.16-1.77 1.06-2.06-.1-.28-.7-.2-.7-.2l-2.04.01s-.15-.02-.26.05c-.11.06-.18.22-.18.22s-.32.86-.76 1.6c-.91 1.54-1.27 1.62-1.42 1.53-.35-.22-.26-.9-.26-1.38 0-1.5.23-2.12-.44-2.28-.22-.06-.39-.09-.96-.1-.73 0-1.34 0-1.7.18-.23.11-.41.36-.3.38.14.02.44.08.6.3.21.28.2.91.2.91s.12 1.76-.28 1.98c-.28.15-.65-.16-1.47-1.56-.42-.72-.73-1.51-.73-1.51s-.06-.15-.17-.23c-.13-.1-.31-.13-.31-.13l-1.93.01s-.29.01-.4.13c-.09.11 0 .34 0 .34s1.52 3.56 3.25 5.36c1.58 1.64 3.38 1.54 3.38 1.54h.81z"/>
            </svg>
          </a>
          <a href="#" class="soc-btn" title="Telegram">
            <svg class="soc-ico" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.5 3.16l-2.55 12.03c-.19.85-.69.85-1.12.53l-3.07-2.26-1.48 1.43c-.16.16-.3.3-.62.3l.22-3.15 5.7-5.15c.25-.22-.05-.34-.39-.12L6.32 11.8l-3.05-.95c-.66-.21-.68-.66.14-.98L15.65 2.2c.55-.2 1.03.14.85.96z"/>
            </svg>
          </a>
        </div>
      </div>
      <div class="f-col"><h4>Каталог</h4><a href="#">Диваны</a><a href="#">Кухни</a><a href="#">Шкафы</a><a href="#">Спальня</a><a href="#">Матрасы</a></div>
      <div class="f-col"><h4>Покупателям</h4><a onclick="Delivery.open()">Доставка</a><a onclick="Info.open('payment')">Оплата</a><a onclick="Info.open('warranty')">Гарантии</a><a href="#">Сборка</a><a href="#">Возврат</a></div>
      <div class="f-col"><h4>Контакты</h4><a href="tel:+78435587508" class="f-phone">+7 (843) 558-75-08</a><span class="f-hours">Пн–Вс: 9:00 — 21:00</span><a href="mailto:info@garmoniadoma.ru">info@garmoniadoma.ru</a><button class="btn-p btn-sm" style="margin-top:10px" onclick="Modal.open('callModal')">Заказать звонок</button></div>`;
  }
};

/* === CITY === */
const City = {
  open(){Modal.open('cityModal')},
  render(){
    $('cityBody').innerHTML=`<h2>Выберите ваш город</h2><p class="sub-p">От выбора города зависит стоимость и сроки доставки</p>
      <input class="inp" id="cityQ" placeholder="Введите название города..." oninput="City.search()">
      <div class="city-grid" id="cityGrid">${MAJOR_CITIES.map(c=>`<button class="city-btn${c===selectedCity?' on':''}" onclick="City.pick('${c}')">${c}</button>`).join('')}</div>
      <div id="cityRes" style="display:none;margin-top:16px"><div class="city-grid city-3" id="cityResList"></div><p id="cityNone" class="center sub-p" style="display:none">Город не найден</p></div>`;
  },
  search(){
    const q=$('cityQ').value.trim().toLowerCase();
    const w=$('cityRes'),l=$('cityResList'),n=$('cityNone');
    if(q.length<2){w.style.display='none';return}
    w.style.display='block';
    const f=ALL_CITIES.filter(c=>c.toLowerCase().includes(q));
    if(!f.length){l.style.display='none';n.style.display='block'}
    else{n.style.display='none';l.style.display='grid';
      l.innerHTML=f.map(c=>`<button class="city-btn${c===selectedCity?' on':''}" onclick="City.pick('${c}')">${c}</button>`).join('')}
  },
  pick(c){selectedCity=c;localStorage.setItem('gd_city',c);$('cityName').textContent=c;const m=$('cityNameMob');if(m)m.textContent=c;Modal.close('cityModal')}
};

/* === INFO PANEL === */
const Info = {
  open(k){const d=INFO_DATA[k];if(!d)return;$('infoTitle').textContent=d.title;$('infoBody').innerHTML=d.html;$('infoPn').classList.add('on');$('infoBd').classList.add('on');document.body.style.overflow='hidden'},
  close(){$('infoPn').classList.remove('on');$('infoBd').classList.remove('on');document.body.style.overflow=''}
};

/* === SEARCH === */
/* Search теперь встроен в header — отдельный toggle не нужен */

/* === MOBILE MENU === */
const MobMenu = {
  render(){
    $('mobNav').innerHTML=`<a href="#hero" onclick="MobMenu.toggle()">Главная</a><a href="#catalog" onclick="MobMenu.toggle()">Каталог</a><a href="#about" onclick="MobMenu.toggle()">О нас</a><a href="#reviews" onclick="MobMenu.toggle()">Отзывы</a><a href="#footer" onclick="MobMenu.toggle()">Контакты</a><a onclick="Delivery.open();MobMenu.toggle()">Доставка</a><a onclick="Info.open('payment');MobMenu.toggle()">Оплата</a>
      <div class="mob-bot"><span class="city-pick" onclick="City.open();MobMenu.toggle()"><svg class="ico ico-16"><use href="#i-pin"/></svg><span id="cityNameMob">${selectedCity}</span> — изменить</span><a href="tel:+78435587508" class="mob-phone">+7 (843) 558-75-08</a><span class="mob-hours">Пн–Вс: 9:00 — 21:00</span><button class="btn-p w100" onclick="Modal.open('callModal');MobMenu.toggle()">Заказать звонок</button></div>`;
  },
  toggle(){$('mobMenu').classList.toggle('on');document.body.style.overflow=$('mobMenu').classList.contains('on')?'hidden':''}
};

/* === AUTH TABS === */
const AuthTabs = {
  switch(tab, btn) {
    document.querySelectorAll('.auth-tab').forEach(
      t => t.classList.remove('on'));
    btn.classList.add('on');
    $('authLogin').style.display = tab === 'login' ? '' : 'none';
    $('authReg').style.display = tab === 'reg' ? '' : 'none';
  }
};

/* === CALLBACK === */
const Callback = {
  submit(){$('cbForm').style.display='none';$('cbOk').classList.add('show');setTimeout(()=>{Modal.close('callModal');$('cbForm').style.display='block';$('cbOk').classList.remove('show')},3000)}
};

/* === CHAT === */
const Chat = {
  open:false,init:false,
  toggle(){
    this.open=!this.open;$('chatW').classList.toggle('on',this.open);$('chatFab').classList.toggle('open',this.open);
    $('chatIco').style.display=this.open?'none':'';$('chatX').style.display=this.open?'':'none';$('chatBdg').style.display='none';
    if(this.open&&!this.init){this.initMsgs();this.init=true}
  },
  tab(t,btn){document.querySelectorAll('.chat-tab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');$('chatPanel').style.display=t==='chat'?'':'none';$('chatCallPn').style.display=t==='call'?'':'none'},
  initMsgs(){this.bot('Здравствуйте! Я — виртуальный помощник <b>Эстетики Дома</b>.',500);this.bot('Чем могу помочь? Выберите тему или напишите свой вопрос.',1800)},
  bot(txt,dl){const b=$('chatMsgs'),tp=document.createElement('div');tp.className='chat-typing';tp.innerHTML='<i></i><i></i><i></i>';b.appendChild(tp);b.scrollTop=b.scrollHeight;setTimeout(()=>{tp.remove();const m=document.createElement('div');m.className='chat-msg bot';const t=new Date();m.innerHTML=txt+`<span class="chat-time">${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}</span>`;b.appendChild(m);b.scrollTop=b.scrollHeight},dl||1000)},
  user(txt){const b=$('chatMsgs'),m=document.createElement('div');m.className='chat-msg user';const t=new Date();m.innerHTML=txt+`<span class="chat-time">${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}</span>`;b.appendChild(m);b.scrollTop=b.scrollHeight},
  getReply(t){const l=t.toLowerCase();for(const[k,v]of Object.entries(BOT_REPLIES))if(l.includes(k))return v;return'Спасибо за вопрос! Передам менеджеру — он свяжется с вами в ближайшее время.'},
  send(){const inp=$('chatInp'),t=inp.value.trim();if(!t)return;this.user(t);inp.value='';this.bot(this.getReply(t),1000+Math.random()*800)},
  quick(t){this.user(t);this.bot(this.getReply(t),800);$('chatQuick').style.display='none'}
};

/* === ANIMATIONS === */
const Anim = {
  init(){
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const d=e.target.dataset.delay||0;setTimeout(()=>e.target.classList.add('anim-on'),+d)}})},{threshold:0.1});
    document.querySelectorAll('[data-anim]').forEach(el=>obs.observe(el));
  }
};

/* === ДОП. УСЛУГИ В КОРЗИНЕ === */
let cartDelivery = 0;
let cartAssemblyCost = 0;
let cartLiftCost = 0;

const CartExtras = {
  update() {
    const total = cart.reduce((s,i) => s+i.p*i.q, 0);
    const asm = $('cartAssembly');
    const lift = $('cartLift');
    const floor = parseInt(($('cartLiftFloor')||{}).value || '1', 10);

    if (asm && asm.checked) {
      cartAssemblyCost = total <= 15000 ? 1800 : Math.round(total * 0.12);
      $('cartAssemblyPrice').textContent = fmt(cartAssemblyCost) + ' ₽';
    } else {
      cartAssemblyCost = 0;
      if ($('cartAssemblyPrice')) $('cartAssemblyPrice').textContent = '0 ₽';
    }

    if (lift && lift.checked) {
      cartLiftCost = 300 * Math.max(1, floor || 1);
      if ($('cartLiftPrice')) $('cartLiftPrice').textContent = fmt(cartLiftCost) + ' ₽';
      if ($('cartLiftSub')) $('cartLiftSub').classList.add('on');
    } else {
      cartLiftCost = 0;
      if ($('cartLiftPrice')) $('cartLiftPrice').textContent = '0 ₽';
      if ($('cartLiftSub')) $('cartLiftSub').classList.remove('on');
    }

    Cart.updateTotal();
  }
};
const CartDel = {
  storageKey:'ed_delivery_data',
  loadSaved(){
    try{return JSON.parse(localStorage.getItem(this.storageKey)||'{}')}catch(e){return {}}
  },
  saveSaved(data){
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  },
  renderMap(){
    const city = ($('cartDelCity')||{}).value || '';
    const addr = ($('cartDelAddr')||{}).value || '';
    const frame = $('cartDelMap');
    if(!frame) return;
    const q = encodeURIComponent((city + ' ' + addr).trim() || city || 'Казань');
    frame.src = 'https://www.google.com/maps?q=' + q + '&output=embed';
  },
  toggle() {
    const b = $('cartDelBody');
    const opening = b.style.display === 'none';
    b.style.display = opening ? 'block' : 'none';
    if(opening) this.restore();
  },
  restore(){
    const s = this.loadSaved();
    if($('cartDelCity')) $('cartDelCity').value = s.city || selectedCity || '';
    if($('cartDelName')) $('cartDelName').value = s.name || '';
    if($('cartDelAddr')) $('cartDelAddr').value = s.addr || '';
    if($('cartDelPhone')) $('cartDelPhone').value = s.phone || '';
    if($('cartDelTime') && s.time) $('cartDelTime').value = s.time;
    this.recalc();
    this.renderMap();
  },
  recalc() { 
    const cityInput = $('cartDelCity');
    if (!cityInput || !cityInput.value.trim()) {
      cartDelivery = 0;
      if ($('cartDelPrice')) $('cartDelPrice').textContent = 'не рассчитана';
      this.renderMap();
      return;
    }
    const city = cityInput.value.trim();
    const wt = Delivery.cartWeight();
    const res = Delivery.calc(city, wt);
    if (!res) {
      cartDelivery = 0;
      if ($('cartDelPrice')) $('cartDelPrice').textContent = 'нет данных';
      return;
    }
    cartDelivery = res.price;
    if ($('cartDelPrice')) {
      $('cartDelPrice').innerHTML = '<strong>' + fmt(res.price) + ' ₽</strong>' +
        '<span style="font-size:11px;color:var(--gr4);margin-left:6px">' + res.range + '</span>';
    }
  },
  suggest() {
    const q = $('cartDelCity').value.trim().toLowerCase();
    const w = $('cartDelSug');
    if (q.length < 1) { w.innerHTML = ''; w.style.display = 'none'; return; }

    const found = DELIVERY_RATES.filter(r =>
      r[0].toLowerCase().includes(q)
    ).slice(0, 8);

    if (!found.length) {
      w.innerHTML = '<div class="del-sg-empty">Город не найден в списке доставки</div>';
      w.style.display = 'block';
      return;
    }

    w.innerHTML = found.map(r => {
      const wt = Delivery.cartWeight();
      const res = Delivery.calc(r[0], wt);
      const price = res ? fmt(res.price) + ' ₽' : '';
      return `<div class="del-sg-item" onclick="CartDel.pick('${r[0]}')">
        <span>${r[0]}</span>
        <span class="del-sg-price">${price}</span>
      </div>`;
    }).join('');
    w.style.display = 'block';
  },
  pick(city) {
    $('cartDelCity').value = city;
    $('cartDelSug').style.display = 'none';
    const wt = Delivery.cartWeight();
    const res = Delivery.calc(city, wt);
    if (!res) {
      $('cartDelPrice').textContent = 'нет данных';
      cartDelivery = 0;
    } else {
      cartDelivery = res.price;
      $('cartDelPrice').innerHTML =
        '<strong>' + fmt(res.price) + ' ₽</strong>' +
        '<span style="font-size:11px;color:var(--gr4);margin-left:6px">' +
        res.range + '</span>';
    }
    this.saveSaved({
      city: $('cartDelCity')?.value || '',
      name: $('cartDelName')?.value || '',
      addr: $('cartDelAddr')?.value || '',
      phone: $('cartDelPhone')?.value || '',
      time: $('cartDelTime')?.value || 'Любое время'
    });
    this.renderMap();
    Cart.updateTotal();
  },
  checkout() {
    const city = ($('cartDelCity') || {}).value;
    const name = ($('cartDelName') || {}).value;
    const addr = ($('cartDelAddr') || {}).value;
    const phone = ($('cartDelPhone') || {}).value;

    if (!city) { alert('Выберите город доставки'); return; }
    if (!name) { alert('Укажите ваше имя'); return; }
    if (!addr) { alert('Укажите адрес доставки'); return; }
    if (!phone) { alert('Укажите номер телефона'); return; }

    Modal.close('cartModal');
    setTimeout(() => {
      Modal.open('callModal');
      $('cbForm').innerHTML = `
        <div class="del-ok">
          <svg class="ico ico-48" style="color:var(--g600)">
            <use href="#i-check"/></svg>
          <h3>Заказ оформлен!</h3>
          <p>${name}, ваш заказ принят.<br>
          Доставка в ${city} — ${fmt(cartDelivery)} ₽<br>
          Менеджер позвонит по номеру ${phone}</p>
        </div>`;
    }, 300);
  }
};

/* === ЛИЧНЫЙ КАБИНЕТ (ДЕМО) === */
const LK = {
  demoLogin() {
    Modal.close('authModal');
    setTimeout(() => {
      Modal.open('lkModal');
      this.render();
    }, 300);
  },
  render() {
    $('lkBody').innerHTML = `
    <div class="lk-layout">
      <!-- Сайдбар -->
      <div class="lk-side">
        <div class="lk-avatar">АИ</div>
        <div class="lk-user">Алексей Иванов</div>
        <div class="lk-email">demo@estetika.ru</div>
        <nav class="lk-nav">
          <a class="on" onclick="LK.tab('dash')">Главная</a>
          <a onclick="LK.tab('orders')">Мои заказы</a>
          <a onclick="LK.tab('boards')">Мои подборки</a>
          <a onclick="LK.tab('services')">Услуги</a>
          <a onclick="LK.tab('warranty')">Гарантии</a>
          <a onclick="LK.tab('bonus')">Бонусы</a>
          <a onclick="LK.tab('profile')">Профиль</a>
          <a onclick="LK.tab('support')">Поддержка</a>
        </nav>
      </div>
      <!-- Контент -->
      <div class="lk-main" id="lkMain"></div>
    </div>`;
    this.tab('dash');
  },
  tab(t) {
    document.querySelectorAll('.lk-nav a').forEach(a => a.classList.remove('on'));
    event?.target?.classList.add('on');
    const m = $('lkMain');
    const tabs = {
      dash: `
        <h2>Добро пожаловать, Алексей!</h2>
        <p class="lk-sub">Ваш персональный кабинет — управляйте заказами и настройками</p>
        <div class="lk-cards">
          <div class="lk-card">
            <div class="lk-card-ico" style="background:var(--g50);color:var(--g600)">
              <svg class="ico ico-24"><use href="#i-bag"/></svg></div>
            <div><strong>3 заказа</strong><span>1 активный</span></div>
          </div>
          <div class="lk-card">
            <div class="lk-card-ico" style="background:var(--o100);color:var(--o500)">
              <svg class="ico ico-24"><use href="#i-heart"/></svg></div>
            <div><strong>12 избранных</strong><span>в 3 подборках</span></div>
          </div>
          <div class="lk-card">
            <div class="lk-card-ico" style="background:var(--g50);color:var(--g600)">
              <svg class="ico ico-24"><use href="#i-shield"/></svg></div>
            <div><strong>2 гарантии</strong><span>активны до 2027</span></div>
          </div>
          <div class="lk-card">
            <div class="lk-card-ico" style="background:var(--o100);color:var(--o500)">
              <svg class="ico ico-24"><use href="#i-check"/></svg></div>
            <div><strong>1 450 бонусов</strong><span>≈ 1 450 ₽</span></div>
          </div>
        </div>
        <h3 style="margin-top:28px">Активный заказ</h3>
        <div class="lk-order-card">
          <div class="lk-order-head">
            <span>Заказ #ЭД-00142</span>
            <span class="lk-status lk-status-active">В производстве</span>
          </div>
          <div class="lk-order-items">
            <div class="lk-order-item">
              <img src="${photoUrl('photo-1555041469-a586c61ea9bc',80,80)}" alt="">
              <div><strong>Диван прямой Дарси</strong><span>велюр, серо-коричневый</span></div>
              <span>16 690 ₽</span>
            </div>
          </div>
          <div class="lk-progress">
            <div class="lk-progress-step done">Оплачен</div>
            <div class="lk-progress-step done">На производстве</div>
            <div class="lk-progress-step">Готов к отгрузке</div>
            <div class="lk-progress-step">Доставлен</div>
            <div class="lk-progress-step">Собран</div>
          </div>
        </div>`,

      orders: `
        <h2>Мои заказы</h2>
        <div class="lk-order-card">
          <div class="lk-order-head"><span>#ЭД-00142</span>
            <span class="lk-status lk-status-active">В производстве</span></div>
          <p style="font-size:13px;color:var(--gr5);margin:8px 0">
            Дата: 15.05.2026 · Доставка: Казань · Сумма: 18 190 ₽</p>
          <p style="font-size:12px;color:var(--g700);margin:0 0 6px">
            Стоимость доставки: 1 399 ₽ · Сборка: 1 800 ₽</p>
          <div class="lk-progress">
            <div class="lk-progress-step done">Оплачен</div>
            <div class="lk-progress-step done">Производство</div>
            <div class="lk-progress-step">Отгрузка</div>
            <div class="lk-progress-step">Доставлен</div>
            <div class="lk-progress-step">Собран</div>
          </div>
        </div>
        <div class="lk-order-card">
          <div class="lk-order-head"><span>#ЭД-00098</span>
            <span class="lk-status lk-status-done">Доставлен</span></div>
          <p style="font-size:13px;color:var(--gr5);margin:8px 0">
            Дата: 02.03.2026 · Доставка: Казань · Сумма: 42 990 ₽</p>
          <p style="font-size:12px;color:var(--g700);margin:0 0 6px">
            Стоимость доставки: 2 099 ₽ · Сборка: 5 159 ₽</p>
        </div>
        <div class="lk-order-card">
          <div class="lk-order-head"><span>#ЭД-00067</span>
            <span class="lk-status lk-status-done">Собран</span></div>
          <p style="font-size:13px;color:var(--gr5);margin:8px 0">
            Дата: 10.01.2026 · Доставка: Казань · Сумма: 14 990 ₽</p>
          <p style="font-size:12px;color:var(--g700);margin:0 0 6px">
            Стоимость доставки: 1 399 ₽ · Сборка: 1 800 ₽</p>
        </div>`,

      boards: `
        <h2>Мои подборки</h2>
        <p class="lk-sub">Визуальные доски для планирования интерьера</p>
        <div class="lk-boards">
          <div class="lk-board">
            <div class="lk-board-img" style="background:var(--g50)">🛋</div>
            <strong>Гостиная</strong><span>5 товаров</span>
          </div>
          <div class="lk-board">
            <div class="lk-board-img" style="background:var(--o100)">🛏</div>
            <strong>Спальня</strong><span>4 товара</span>
          </div>
          <div class="lk-board">
            <div class="lk-board-img" style="background:var(--g50)">🍳</div>
            <strong>Кухня</strong><span>3 товара</span>
          </div>
          <div class="lk-board lk-board-add" onclick="alert('В разработке')">
            <div class="lk-board-img" style="background:var(--gr1)">+</div>
            <strong>Новая подборка</strong>
          </div>
        </div>`,

      services: `
        <h2>Услуги</h2>
        <div class="lk-services">
          <div class="lk-service" onclick="alert('Заявка на замер отправлена!')">
            <svg class="ico ico-24"><use href="#i-search"/></svg>
            <div><strong>Вызов замерщика</strong>
            <span>Бесплатный выезд для кухонь и шкафов</span></div>
          </div>
          <div class="lk-service" onclick="alert('Запись на консультацию!')">
            <svg class="ico ico-24"><use href="#i-user"/></svg>
            <div><strong>Консультация дизайнера</strong>
            <span>Подбор мебели под ваш интерьер</span></div>
          </div>
          <div class="lk-service" onclick="alert('Выбор даты доставки!')">
            <svg class="ico ico-24"><use href="#i-truck"/></svg>
            <div><strong>Выбор даты доставки</strong>
            <span>Удобный день и временной интервал</span></div>
          </div>
          <div class="lk-service" onclick="alert('Заказ сборки!')">
            <svg class="ico ico-24"><use href="#i-check"/></svg>
            <div><strong>Заказ сборки</strong>
            <span>До 15 000 ₽ — 1 800 ₽, свыше 15 000 ₽ — 12% от заказа</span></div>
          </div>
        </div>`,

      warranty: `
        <h2>Гарантии и документы</h2>
        <div class="lk-warranty-card">
          <strong>Диван прямой Дарси</strong>
          <span class="lk-status lk-status-active">Гарантия до 15.05.2027</span>
          <p>Паспорт изделия · Инструкция по уходу за велюром</p>
          <a style="color:var(--g600);font-size:13px;cursor:pointer">
            Скачать документы →</a>
        </div>
        <div class="lk-warranty-card">
          <strong>Шкаф 3-створч. Тивина</strong>
          <span class="lk-status lk-status-active">Гарантия до 10.01.2028</span>
          <p>Паспорт изделия · Схема сборки</p>
          <a style="color:var(--g600);font-size:13px;cursor:pointer">
            Скачать документы →</a>
        </div>
        <h3 style="margin-top:24px">Советы по уходу</h3>
        <div class="lk-tip">Велюровая обивка — протирайте мягкой щёткой
          по направлению ворса, избегайте прямых солнечных лучей</div>
        <div class="lk-tip">ЛДСП — протирайте влажной тканью,
          не используйте абразивные средства</div>`,

      bonus: `
        <h2>Бонусная программа</h2>
        <div class="lk-bonus-hero">
          <div><span>Ваш баланс</span><strong>1 450 бонусов</strong>
          <span>= 1 450 ₽ при следующей покупке</span></div>
        </div>
        <h3 style="margin-top:24px">Как копить</h3>
        <div class="lk-tip">5% от каждой покупки начисляется бонусами</div>
        <div class="lk-tip">Оставьте отзыв — получите 200 бонусов</div>
        <div class="lk-tip">Приведите друга — 500 бонусов обоим</div>`,

      profile: `
        <h2>Профиль</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="fg-label">Имя</label>
            <input class="inp" value="Алексей Иванов"></div>
          <div><label class="fg-label">Телефон</label>
            <input class="inp" value="+7 (917) 123-45-67"></div>
          <div><label class="fg-label">Email</label>
            <input class="inp" value="demo@estetika.ru"></div>
          <div><label class="fg-label">Город</label>
            <input class="inp" value="Казань"></div>
        </div>
        <h3 style="margin-top:24px">Адрес доставки</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="fg-label">Адрес</label>
            <input class="inp" value="ул. Баумана, д. 42, кв. 15"></div>
          <div><label class="fg-label">Этаж / лифт</label>
            <input class="inp" value="7 этаж, грузовой лифт есть"></div>
        </div>
        <button class="btn-p" style="margin-top:16px"
          onclick="alert('Сохранено!')">Сохранить</button>`,

      support: `
        <h2>Поддержка</h2>
        <p class="lk-sub">Создайте обращение или напишите в чат</p>
        <div class="lk-service" onclick="alert('Форма создана!')">
          <svg class="ico ico-24"><use href="#i-phone"/></svg>
          <div><strong>Создать обращение</strong>
          <span>Гарантийный ремонт, замена, возврат</span></div>
        </div>
        <div class="lk-service" onclick="Chat.toggle();Modal.close('lkModal')">
          <svg class="ico ico-24"><use href="#i-chat"/></svg>
          <div><strong>Написать в чат</strong>
          <span>Ответим в течение 2 минут</span></div>
        </div>
        <h3 style="margin-top:24px">История обращений</h3>
        <div class="lk-tip">Обращение #12 — Скрип механизма дивана —
          <span style="color:var(--g600)">Решено</span></div>`,
    };
    m.innerHTML = tabs[t] || tabs.dash;
  }
};

/* === SITE SEARCH === */
const SiteSearch = {
  live() {
    const q = $('headerQ').value.trim().toLowerCase();
    const res = $('searchResults');
    if (q.length < 2) { res.classList.remove('on'); return; }

    const found = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!found.length) {
      res.innerHTML = '<div class="sr-empty">Ничего не найдено</div>';
      res.classList.add('on');
      return;
    }

    res.innerHTML = found.map(p => {
      const old = p.old
        ? '<span class="sr-old">' + fmt(p.old) + ' ₽</span>' : '';
      return '<div class="sr-item" onclick="Product.open(' + p.id + ');SiteSearch.close()">'
        + '<div class="sr-img"><img src="' + photoUrl(p.img, 96, 96)
        + '" alt=""></div>'
        + '<div class="sr-info"><div class="sr-name">' + p.name + '</div>'
        + '<div><span class="sr-price">' + fmt(p.price) + ' ₽</span>'
        + old + '</div></div></div>';
    }).join('');
    res.classList.add('on');
  },
  go() {
    const q = $('headerQ').value.trim();
    if (!q) return;
    activeChip = 'Все';
    Catalog.renderChips();
    const catQ = $('catQ');
    if (catQ) catQ.value = q;
    Catalog.filter();
    $('searchResults').classList.remove('on');
    document.getElementById('catalog')
      .scrollIntoView({ behavior: 'smooth' });
  },
  close() {
    $('searchResults').classList.remove('on');
    $('headerQ').value = '';
  }
};

// Закрытие результатов по клику вне
document.addEventListener('click', function(e) {
  if (!e.target.closest('#headerSearch')) {
    $('searchResults').classList.remove('on');
  }
  // Закрытие подсказок города в корзине
  if (!e.target.closest('.cart-del-city-wrap')) {
    var s = $('cartDelSug');
    if (s) s.style.display = 'none';
  }
});

// Enter в поиске
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.activeElement === $('headerQ')) {
    SiteSearch.go();
  }
});

/* === GLOBAL EVENTS === */
window.addEventListener('scroll',()=>{$('toTop').classList.toggle('show',scrollY>400)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal.on').forEach(m=>m.classList.remove('on'));document.querySelectorAll('.panel.on').forEach(p=>p.classList.remove('on'));document.querySelectorAll('.panel-bd.on').forEach(b=>b.classList.remove('on'));Mega.close();Info.close();$('mobMenu').classList.remove('on');/* search integrated */if(Chat.open)Chat.toggle();document.body.style.overflow=''}});
document.addEventListener('click',e=>{if($('megaMenu').classList.contains('on')&&!e.target.closest('.mega')&&!e.target.closest('.cat-btn'))Mega.close()});
setTimeout(()=>{if(!Chat.open)$('chatBdg').style.display='flex'},8000);
