/* ============================================ */
/*                  Product PDP                 */
/* ============================================ */

(function () {
  // ====== Config ======
  const DATA_URL = '/products.json'; // serve via Eleventy passthrough or your dev server
  const PLACEHOLDER = '/images/placeholder.jpg';

  // ====== Helpers ======
  const $ = (sel, el = document) => el.querySelector(sel);
  const money = v => (Number(v) || 0).toFixed(2);
  const esc = s => String(s ?? '');

  // Get slug from ?slug=... (rewrite adds this), otherwise last segment
  const params = new URLSearchParams(location.search);
  const slugFromQS = params.get('slug');
  const slugFromPath = location.pathname.replace(/\/+$/, '').split('/').pop();
  const slug = slugFromQS || (slugFromPath && slugFromPath !== 'product' ? slugFromPath : '');

  const state = { product: null, base: 0 };

  async function load() {
    if (!slug) return fail('No product specified.');
    let data;
    try {
      const res = await fetch(`${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}cb=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (e) {
      return fail('Failed to load products.');
    }
    const list = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
    const p = list.find(x => x && (x.slug === slug || x.id === slug));
    if (!p) return fail('Product not found.');

    state.product = p;
    state.base = Number(p.price ?? p.base_price ?? 0);
    render(p);
    wireSnipcart(p);
    loadPhoneCaseAddons(p, list);
  }

  function fail(msg) {
    $('#pdp').innerHTML = `<p style="max-width:800px;margin:40px auto;text-align:center">${esc(msg)}</p>`;
  }

  function render(p) {
  // helpers (local so we don't depend on outer scope)
  const $ = (sel, el = document) => el.querySelector(sel);
  const money = v => (Number(v) || 0).toFixed(2);
  const htmlEsc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c)
  ));

  // DOM refs (guard every access)
  const pdpEl   = $('#pdp');
  const titleEl = $('#pdpTitle');
  const crumbEl = $('#pdpCrumb');
  const descEl  = $('#pdpDesc');
  const imgEl   = $('#pdpImg');
  const priceEl = $('#pdpPrice');
  const optsEl  = $('#pdpOptions');

  if (!pdpEl || !titleEl || !imgEl || !priceEl || !optsEl) return; // nothing to render into

  // Base content
  const title = p.title || p.name || p.slug || 'Product';
  titleEl.textContent = title;
  if (crumbEl) crumbEl.textContent = title;
  if (descEl)  descEl.textContent  = p.description || '';

  imgEl.src = p.image || PLACEHOLDER;
  imgEl.alt = p.imageAlt || title;

  // Mirror into banner if present
  const bt = document.getElementById('pdpBannerTitle');
  const bc = document.getElementById('pdpBannerCrumb');
  if (bt) bt.textContent = title;
  if (bc) bc.textContent = title;

  // Normalize options
  const rawOpts = Array.isArray(p.options) ? p.options : [];
  const opts = rawOpts
    .map(o => ({
      name: o?.name || 'Option',
      values: Array.isArray(o?.values) ? o.values : []
    }))
    .filter(o => o.values.length > 0);

  const hasOptions = opts.length > 0;

  // Layout: compact when no options
  pdpEl.classList.toggle('pdp--simple', !hasOptions);

  // Clear options UI every render
  optsEl.innerHTML = '';

  if (hasOptions) {
    // Build selects
    opts.forEach((opt, i) => {
      const id = `opt${i}`;
      const rows = opt.values.map(v => {
        const label = v?.label || v?.value || v?.id || '';
        const delta = Number(v?.price_delta || 0);
        const escLabel = htmlEsc(label);
        return `<option value="${escLabel}" data-delta="${delta}" data-label="${escLabel}">
                  ${escLabel}${delta ? ` (+$${money(delta)})` : ''}
                </option>`;
      }).join('');

      optsEl.insertAdjacentHTML('beforeend', `
        <label for="${id}">
          <span class="pdp__opt-name">${htmlEsc(opt.name)}</span>
          <select id="${id}" data-opt-index="${i}">
            ${rows}
          </select>
        </label>
      `);
    });

    // Price = base + selected deltas
    function recalc() {
      const selects = optsEl.querySelectorAll('select');
      let total = Number(p.price ?? p.base_price ?? 0);
      selects.forEach(sel => {
        const d = Number(sel.selectedOptions[0]?.dataset.delta || 0);
        total += d;
      });
      priceEl.textContent = `$${money(total)}`;
    }
    optsEl.addEventListener('change', recalc);
    recalc();
    optsEl.style.display = ''; // make sure it’s visible
  } else {
    // Simple product: show base price and hide empty options block
    priceEl.textContent = `$${money(Number(p.price ?? p.base_price ?? 0))}`;
    optsEl.style.display = 'none';
  }
}


  // Prepare the real Snipcart button: base price + deltas via custom fields
  function wireSnipcart(p) {
    const btn = $('#snipBtn');

    // Build custom field definitions (with [+delta] so Snipcart computes price)
    const opts = Array.isArray(p.options) ? p.options : [];
    function syncButtonAttrs() {
      btn.setAttribute('data-item-id', p.id || p.slug);
      btn.setAttribute('data-item-name', p.title || p.name || p.slug);
      btn.setAttribute('data-item-url', `/products/${encodeURIComponent(p.slug)}/`);
      btn.setAttribute('data-item-image', p.image || '');
      btn.setAttribute('data-item-description', p.description || '');
      btn.setAttribute('data-item-price', Number(p.price ?? p.base_price ?? 0)); // base only

      opts.forEach((opt, i) => {
        const idx = i + 1;
        const select = document.querySelector(`[data-opt-index="${i}"]`);
        const selected = select?.selectedOptions?.[0];
        const selectedLabel = selected?.dataset.label || '';

        const optionsStr = (Array.isArray(opt.values) ? opt.values : []).map(v => {
          const label = v.label || v.value || v.id || '';
          const d = Number(v.price_delta || 0);
          return d ? `${label}[+${money(d)}]` : label;
        }).join('|');

        btn.setAttribute(`data-item-custom${idx}-name`, opt.name || `Option ${idx}`);
        btn.setAttribute(`data-item-custom${idx}-options`, optionsStr);
        if (selectedLabel) {
          btn.setAttribute(`data-item-custom${idx}-value`, selectedLabel);
        }
      });
    }
    // Keep attributes in sync with current selections
    $('#pdpOptions').addEventListener('change', syncButtonAttrs);
    syncButtonAttrs();
  }

  load();
})();

/* ============================================ */
/*              Phone Case Add-ons              */
/* ============================================ */

function loadPhoneCaseAddons(currentProduct, allProducts) {
  const addonsSection = document.getElementById('phone-case-addons');
  const addonsGrid = document.getElementById('addonsGrid');
  
  if (!addonsSection || !addonsGrid) return;

  // Don't show add-ons if the current product is already a phone case
  if (isPhoneCase(currentProduct)) {
    addonsSection.style.display = 'none';
    return;
  }

  // Get relevant phone cases based on the current product
  const relevantCases = getRelevantPhoneCases(currentProduct, allProducts);
  
  if (relevantCases.length === 0) {
    addonsSection.style.display = 'none';
    return;
  }

  // Display the add-ons section
  addonsSection.style.display = 'block';
  addonsGrid.innerHTML = relevantCases.map(createAddonCard).join('');
}

function isPhoneCase(product) {
  const title = (product.title || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  return title.includes('case') || category.includes('mobile accessories');
}

function getRelevantPhoneCases(currentProduct, allProducts) {
  // Get all phone cases
  const phoneCases = allProducts.filter(product => 
    product.category === 'Mobile Accessories' && 
    (product.title || '').toLowerCase().includes('case')
  );

  // If current product is iPhone-related, show iPhone cases
  const currentTitle = (currentProduct.title || '').toLowerCase();
  const currentCategory = (currentProduct.category || '').toLowerCase();
  
  if (currentTitle.includes('iphone') || currentCategory.includes('iphone')) {
    return phoneCases.filter(case_ => 
      (case_.title || '').toLowerCase().includes('iphone')
    );
  }
  
  // If current product is mobile/phone related, show all cases
  if (currentCategory.includes('mobile') || currentCategory.includes('phone') || 
      currentTitle.includes('phone') || currentTitle.includes('mobile')) {
    return phoneCases.slice(0, 4); // Show up to 4 cases
  }
  
  // For other products, show a couple of popular cases
  return phoneCases.slice(0, 2);
}

function createAddonCard(caseProduct) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => (Number(v) || 0).toFixed(2);
  
  const IS_PROD = /^(www\.)?kvgarage\.com$/.test(location.hostname);
  const productUrl = IS_DEV
    ? `/product/?slug=${encodeURIComponent(caseProduct.slug || caseProduct.id)}`
    : `/products/${encodeURIComponent(caseProduct.slug || caseProduct.id)}/`;

  return `
    <div class="addon-card">
      <div class="addon-card__image">
        <img src="${esc(caseProduct.image || '/images/placeholder.jpg')}" 
             alt="${esc(caseProduct.title || 'Phone case')}" 
             loading="lazy">
      </div>
      <div class="addon-card__content">
        <h3 class="addon-card__title">${esc(caseProduct.title || 'Phone case')}</h3>
        <p class="addon-card__price">$${money(caseProduct.price || 0)}</p>
        <p class="addon-card__description">${esc(caseProduct.description || '')}</p>
        <button class="addon-card__btn snipcart-add-item" 
                data-item-id="${esc(caseProduct.slug || caseProduct.id)}"
                data-item-name="${esc(caseProduct.title || caseProduct.slug)}"
                data-item-url="${esc(productUrl)}"
                data-item-image="${esc(caseProduct.image || '')}"
                data-item-description="${esc(caseProduct.description || '')}"
                data-item-price="${Number(caseProduct.price || 0)}">
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

/* ============================================ */
/*           Related Products (Carousel)        */
/* ============================================ */

(function(){
  const root = document.getElementById('related-products');
  const track = document.getElementById('rpTrack');
  const scroller = root.querySelector('.rp-viewport');   // viewport scrolls
  const btnPrev = root.querySelector('.rp-btn.prev');
  const btnNext = root.querySelector('.rp-btn.next');
  const DATA_URL = root.getAttribute('data-src') || '/products.json';

//   const IS_DEV = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const IS_PROD = /^(www\.)?kvgarage\.com$/.test(location.hostname);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => (Number(v)||0).toFixed(2);
  const currSlug = (() => {
    const q = new URLSearchParams(location.search).get('slug');
    if (q) return q;
    const seg = location.pathname.replace(/\/+$/,'').split('/').pop();
    return seg === 'product' ? '' : seg;
  })();
  const productUrl = p => IS_PROD
    ? `/products/${encodeURIComponent(p.slug || p.id)}/`
    : `/product/?slug=${encodeURIComponent(p.slug || p.id)}`;

  const card = p => `
    <article class="rel-card">
      <a class="rel-card__img" href="${esc(productUrl(p))}">
        <img src="${esc(p.image || '/images/placeholder.jpg')}"
             alt="${esc(p.imageAlt || p.title || p.name || p.slug || 'Product')}" loading="lazy">
      </a>
      <h3 class="rel-card__title"><a href="${esc(productUrl(p))}">${esc(p.title || p.name || p.slug)}</a></h3>
      <div class="rel-card__price">$${money(p.price ?? p.base_price ?? 0)}</div>
      <a class="rel-card__cta" href="${esc(productUrl(p))}">Add to cart</a>
    </article>`;

  function pickRelated(list, me, limit=20){
    const myId = me.slug || me.id;
    const cat  = me.category || (Array.isArray(me.categories) ? me.categories[0] : null);
    const sub  = me.subcategory || null;
    const myTags = new Set((me.tags||[]).map(String));
    const pool = list.filter(x => x && (x.slug||x.id) !== myId);

    const score = x => {
      let s = 0;
      if (cat && (x.category === cat || (Array.isArray(x.categories) && x.categories.includes(cat)))) s += 3;
      if (sub && x.subcategory === sub) s += 2;
      if (myTags.size && Array.isArray(x.tags)) s += x.tags.filter(t => myTags.has(String(t))).length;
      return s;
    };

    pool.sort((a,b) => score(b) - score(a));
    const top = pool.filter(x => score(x) > 0).slice(0, limit);
    if (top.length < limit) {
      const rest = pool.filter(x => !top.includes(x));
      for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [rest[i],rest[j]]=[rest[j],rest[i]]; }
      top.push(...rest.slice(0, limit - top.length));
    }
    return top.slice(0, limit);
  }

  function updateButtons(){
    const max = scroller.scrollWidth - scroller.clientWidth - 1;
    btnPrev.disabled = scroller.scrollLeft <= 0;
    btnNext.disabled = scroller.scrollLeft >= max;
  }

  function stepWidth(){ return scroller.clientWidth; } // one full “view” per click

  btnPrev.addEventListener('click', () => scroller.scrollBy({ left: -stepWidth(), behavior: 'smooth' }));
  btnNext.addEventListener('click', () => scroller.scrollBy({ left:  stepWidth(), behavior: 'smooth' }));
  scroller.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);

  (async function init(){
    try{
      const res = await fetch(`${DATA_URL}${DATA_URL.includes('?')?'&':'?'}cb=${Date.now()}`, {cache:'no-store'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
      const me = list.find(x => x && (x.slug === currSlug || x.id === currSlug));
      if (!me) { root.style.display = 'none'; return; }
      const rel = pickRelated(list, me, 20);
      if (!rel.length) { root.style.display = 'none'; return; }
      track.innerHTML = rel.map(card).join('');
      requestAnimationFrame(updateButtons);
    } catch (e) {
      console.error('Related products failed:', e);
      root.style.display = 'none';
    }
  })();
})();
