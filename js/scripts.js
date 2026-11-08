document.addEventListener('DOMContentLoaded', function () {

  /* ── CUSTOM CURSOR ── */
  const dot  = document.getElementById('js-cursor');
  const ring = document.getElementById('js-ring');

  if (dot && ring && window.matchMedia('(pointer:fine)').matches) {
    let mx = 0, my = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left  = mx + 'px';
      dot.style.top   = my + 'px';
      ring.style.left = mx + 'px';
      ring.style.top  = my + 'px';
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest('a, button, .tc')) document.body.setAttribute('data-hover', '');
      else document.body.removeAttribute('data-hover');
    });
  }

  /* ── HEADER SCROLL ── */
  var header = document.querySelector('.site-header');
  window.addEventListener('scroll', function () {
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  /* ── SCROLL REVEAL ── */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ════════════════════════════════════════════════════════
     ORDERING — products, customise modal, basket, checkout
     ════════════════════════════════════════════════════════ */
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-RZq6mT4HgIsPS902uPVNfRJ6CZ5-V5BSiveF0hgQ3nbMax8tPHkKW1TE4FkIqAA4/exec';
  var WA_NUMBER  = '27618205270';

  /* ---- prices & options: edit here ---- */
  var CREAM_CHEESE_EXTRA = 70;
  var MAX_QTY = 20;
  var MAX_LINES = 10;
  var MAX_URL = 6000;

  /* icings every cake can have; 'extra' is added to the price */
  var ICINGS = [
    { value: 'buttercream',  label: 'Buttercream',  extra: 0 },
    { value: 'cream-cheese', label: 'Cream Cheese', extra: CREAM_CHEESE_EXTRA },
    { value: 'zesty-cream',  label: 'Zesty Cream',  extra: 0 },
    { value: 'chocolate',    label: 'Chocolate',    extra: 0 }
  ];
  var CAKES = [
    { id: 'chocolate',  name: 'Chocolate',  price: 350, img: 'images/chocolate-cake.png' },
    { id: 'red-velvet', name: 'Red Velvet', price: 400, img: 'images/red-velvet-cake.png' },
    { id: 'lemon',      name: 'Lemon',      price: 250, img: 'images/lemon-cake.png', defaultIcing: 'zesty-cream' },
    { id: 'caramel',    name: 'Caramel',    price: 250, img: 'images/caramel-cake.png' }
  ];
  function defaultIcing(cake) { return cake.defaultIcing || 'buttercream'; }
  function icingById(id) { return ICINGS.filter(function (i) { return i.value === id; })[0]; }

  var PRODUCTS = {
    'cake-chocolate':   { kind: 'cake', cake: 'chocolate' },
    'cake-red-velvet':  { kind: 'cake', cake: 'red-velvet' },
    'cake-lemon':       { kind: 'cake', cake: 'lemon' },
    'cake-caramel':     { kind: 'cake', cake: 'caramel' },
    'cupcakes':         { kind: 'options', title: 'Cupcakes (box of 6)', short: 'Cupcakes (6)', price: 70,
                          img: 'images/caramel-cupcakes.png', optLabel: 'Flavour',
                          options: ['Chocolate', 'Caramel', 'Vanilla'] },
    'crumble-cup':      { kind: 'simple', title: 'Cake Crumble Cup', short: 'Cake Crumble Cup', price: 70, img: 'images/cake-crum-cup.jpg' },
    'milk-tart':        { kind: 'simple', title: 'Milk Tart', short: 'Milk Tart', price: 200, img: 'images/milk-tart.png' },
    'birthday-cake':    { kind: 'quote', title: 'Birthday Cake', short: 'Birthday Cake', img: 'images/chocolate-cake-2.png' },
    'custom-cake':      { kind: 'quote', title: 'Custom Cake', short: 'Custom Cake', img: 'images/chocolate-cake-2.png' }
  };

  function $(id) { return document.getElementById(id); }
  function money(n) { return 'R' + n; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function cakeById(id) { return CAKES.filter(function (c) { return c.id === id; })[0]; }

  /* ---- basket state ---- */
  var STORE_KEY = 'suri-basket-v1';
  var basket = [];
  var orderDone = false;

  function loadBasket() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (i) {
        return i && typeof i.title === 'string' && typeof i.qty === 'number' && i.qty >= 1 && i.qty <= MAX_QTY &&
          (i.unit === null || typeof i.unit === 'number') && typeof i.img === 'string' && i.img.indexOf('images/') === 0 &&
          Array.isArray(i.details);
      }).slice(0, MAX_LINES);
    } catch (e) { return []; }
  }
  function saveBasket() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(basket)); } catch (e) {}
  }

  function lineTotal(i) { return i.unit === null ? 0 : i.unit * i.qty; }
  function basketTotal() { return basket.reduce(function (s, i) { return s + lineTotal(i); }, 0); }
  function hasQuote() { return basket.some(function (i) { return i.unit === null; }); }
  function itemCount() { return basket.reduce(function (s, i) { return s + i.qty; }, 0); }
  function lineText(i) {
    return i.qty + 'x ' + i.title + (i.details.length ? ' (' + i.details.join(', ') + ')' : '');
  }

  function addToBasket(item) {
    item.key = [item.title, item.details.join('|'), item.notes, item.desc, item.unit].join('~');
    var existing = basket.filter(function (b) { return b.key === item.key; })[0];
    if (existing) {
      existing.qty = Math.min(MAX_QTY, existing.qty + item.qty);
    } else {
      if (basket.length >= MAX_LINES) return false;
      basket.push(item);
    }
    saveBasket();
    renderBasket();
    return true;
  }

  /* ---- drawer ---- */
  var bk = $('bk');
  function openBasket() { bk.classList.add('open'); bk.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll'); }
  function closeBasket() { bk.classList.remove('open'); bk.setAttribute('aria-hidden', 'true'); if (!pm.classList.contains('open')) document.body.classList.remove('no-scroll'); }

  function stepper(item) {
    var wrap = el('div', 'qty');
    var minus = el('button', 'qty-b', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Decrease quantity');
    var num = el('span', 'qty-n', String(item.qty));
    var plus = el('button', 'qty-b', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Increase quantity');
    minus.addEventListener('click', function () {
      item.qty = Math.max(1, item.qty - 1); saveBasket(); renderBasket();
    });
    plus.addEventListener('click', function () {
      item.qty = Math.min(MAX_QTY, item.qty + 1); saveBasket(); renderBasket();
    });
    wrap.appendChild(minus); wrap.appendChild(num); wrap.appendChild(plus);
    return wrap;
  }

  function renderBasket() {
    var n = itemCount();
    $('js-basket-count').textContent = n;
    $('bk-count').textContent = n ? '(' + n + ')' : '';
    var list = $('bk-list');
    list.textContent = '';
    basket.forEach(function (item, idx) {
      var li = el('li', 'bk-item');
      var img = el('img'); img.src = item.img; img.alt = '';
      li.appendChild(img);
      var info = el('div', 'bk-info');
      var top = el('div', 'bk-top');
      top.appendChild(el('span', 'bk-name', item.title));
      var del = el('button', 'bk-del', '✕'); del.type = 'button'; del.setAttribute('aria-label', 'Remove ' + item.title);
      del.addEventListener('click', function () { basket.splice(idx, 1); saveBasket(); renderBasket(); });
      top.appendChild(del);
      info.appendChild(top);
      if (item.details.length) info.appendChild(el('span', 'bk-det', item.details.join(' • ')));
      if (item.notes) info.appendChild(el('span', 'bk-det bk-note', '“' + item.notes + '”'));
      if (item.desc) info.appendChild(el('span', 'bk-det bk-note', '“' + item.desc + '”'));
      var bot = el('div', 'bk-bot');
      bot.appendChild(stepper(item));
      bot.appendChild(el('span', 'bk-price', item.unit === null ? 'Quote' : money(lineTotal(item))));
      info.appendChild(bot);
      li.appendChild(info);
      list.appendChild(li);
    });
    var empty = basket.length === 0;
    $('bk-empty').hidden = !empty;
    $('bk-foot').hidden = empty;
    $('bk-subtotal').textContent = money(basketTotal());
    $('bk-quote').hidden = !hasQuote();
    renderCheckout();
  }

  /* ---- checkout summary ---- */
  function renderCheckout() {
    var list = $('of-summary-list');
    list.textContent = '';
    basket.forEach(function (item) {
      var li = el('li');
      li.appendChild(el('span', '', lineText(item)));
      li.appendChild(el('span', '', item.unit === null ? 'Quote' : money(lineTotal(item))));
      list.appendChild(li);
    });
    $('of-summary-total').textContent = money(basketTotal()) + (hasQuote() ? ' + quote' : '');
    $('of-summary-note').hidden = !hasQuote();
    var empty = basket.length === 0;
    $('of-empty').hidden = !empty || orderDone;
    if (!orderDone && bookedEl.hidden) form.hidden = empty;
    refreshSubmit();
  }

  /* ---- customise modal ---- */
  var pm = $('pm');
  var st = null; /* current selection */

  function openModal(id) {
    var def = PRODUCTS[id];
    if (!def) return;
    st = { id: id, def: def, qty: 1, notes: '', desc: '', icing: 'buttercream',
           cake: def.kind === 'cake' ? def.cake : null, option: def.options ? def.options[0] : null };
    if (st.cake) st.icing = defaultIcing(cakeById(st.cake));
    buildModal();
    pm.classList.add('open'); pm.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    var first = $('pm-opts').querySelector('button, textarea');
    if (first) first.focus();
  }
  function closeModal() {
    pm.classList.remove('open'); pm.setAttribute('aria-hidden', 'true');
    if (!bk.classList.contains('open')) document.body.classList.remove('no-scroll');
    st = null;
  }

  function chipGroup(label, step, choices, selected, onPick) {
    var g = el('div', 'pm-group');
    g.appendChild(el('h4', 'pm-gl', step + '. ' + label));
    var row = el('div', 'chips');
    row.setAttribute('role', 'radiogroup');
    choices.forEach(function (c) {
      var b = el('button', 'chip' + (c.value === selected ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', c.value === selected ? 'true' : 'false');
      b.appendChild(el('span', '', c.label));
      if (c.sub) b.appendChild(el('small', '', c.sub));
      b.addEventListener('click', function () { onPick(c.value); });
      row.appendChild(b);
    });
    g.appendChild(row);
    return g;
  }

  function qtyGroup(step, label) {
    var g = el('div', 'pm-group');
    g.appendChild(el('h4', 'pm-gl', step + '. ' + label));
    var wrap = el('div', 'qty qty--lg');
    var minus = el('button', 'qty-b', '−'); minus.type = 'button'; minus.setAttribute('aria-label', 'Decrease quantity');
    var num = el('span', 'qty-n', String(st.qty)); num.id = 'pm-qty';
    var plus = el('button', 'qty-b', '+'); plus.type = 'button'; plus.setAttribute('aria-label', 'Increase quantity');
    minus.addEventListener('click', function () { st.qty = Math.max(1, st.qty - 1); num.textContent = st.qty; updateSummary(); });
    plus.addEventListener('click', function () { st.qty = Math.min(MAX_QTY, st.qty + 1); num.textContent = st.qty; updateSummary(); });
    wrap.appendChild(minus); wrap.appendChild(num); wrap.appendChild(plus);
    g.appendChild(wrap);
    return g;
  }

  function textGroup(step, label, ph, key, required) {
    var g = el('div', 'pm-group');
    var h = el('h4', 'pm-gl', step + '. ' + label);
    if (!required) h.appendChild(el('span', 'of-opt', ' (optional)'));
    g.appendChild(h);
    var ta = el('textarea', 'of-input of-textarea');
    ta.rows = 3; ta.placeholder = ph; ta.maxLength = 400;
    ta.value = st[key];
    ta.addEventListener('input', function () { st[key] = ta.value; ta.classList.remove('of-invalid'); updateSummary(); });
    ta.id = 'pm-' + key;
    g.appendChild(ta);
    return g;
  }

  function buildModal() {
    var def = st.def, opts = $('pm-opts');
    opts.textContent = '';
    var n = 1;
    if (def.kind === 'cake') {
      opts.appendChild(chipGroup('Flavour', n++, CAKES.map(function (c) {
        return { value: c.id, label: c.name, sub: money(c.price) };
      }), st.cake, function (v) { st.cake = v; st.icing = defaultIcing(cakeById(v)); buildModal(); }));
      opts.appendChild(chipGroup('Icing', n++, ICINGS.map(function (i) {
        return { value: i.value, label: i.label, sub: i.extra ? '+' + money(i.extra) : 'included' };
      }), st.icing, function (v) { st.icing = v; buildModal(); }));
      opts.appendChild(qtyGroup(n++, 'Quantity'));
      opts.appendChild(textGroup(n++, 'Special requests', 'e.g. Happy Birthday message, pink decorations…', 'notes', false));
    } else if (def.kind === 'options') {
      opts.appendChild(chipGroup(def.optLabel, n++, def.options.map(function (o) {
        return { value: o, label: o };
      }), st.option, function (v) { st.option = v; buildModal(); }));
      opts.appendChild(qtyGroup(n++, 'Quantity (boxes)'));
      opts.appendChild(textGroup(n++, 'Special requests', 'e.g. colours, a message on the box…', 'notes', false));
    } else if (def.kind === 'simple') {
      opts.appendChild(qtyGroup(n++, 'Quantity'));
      opts.appendChild(textGroup(n++, 'Special requests', 'Anything we should know?', 'notes', false));
    } else {
      opts.appendChild(textGroup(n++, 'Describe your cake', 'Tell us what you have in mind — flavours, size, occasion, colours, any special details…', 'desc', true));
      var p = el('p', 'pm-hint', 'We’ll review your cake and confirm the price on WhatsApp. Have inspiration photos? You can send them after ordering.');
      opts.appendChild(p);
    }
    updateSummary();
  }

  function currentItem() {
    var def = st.def, item;
    if (def.kind === 'cake') {
      var c = cakeById(st.cake);
      var ic = icingById(st.icing);
      item = { id: st.id, title: c.name + ' Cake', img: c.img, unit: c.price + ic.extra, qty: st.qty,
               details: [ic.label + ' Icing'], notes: st.notes.trim(), desc: '',
               product: 'Cake', option: c.name, icing: ic.label };
    } else if (def.kind === 'options') {
      item = { id: st.id, title: def.short, img: def.img, unit: def.price, qty: st.qty,
               details: [st.option], notes: st.notes.trim(), desc: '',
               product: def.title, option: st.option, icing: '' };
    } else if (def.kind === 'simple') {
      item = { id: st.id, title: def.short, img: def.img, unit: def.price, qty: st.qty, details: [], notes: st.notes.trim(), desc: '',
               product: def.title, option: '', icing: '' };
    } else {
      item = { id: st.id, title: def.short, img: def.img, unit: null, qty: 1, details: ['Quote'], notes: '', desc: st.desc.trim(),
               product: def.title, option: '', icing: '' };
    }
    return item;
  }

  function updateSummary() {
    if (!st) return;
    var item = currentItem();
    $('pm-title').textContent = st.def.kind === 'cake' ? 'Customise Your Cake' : (st.def.kind === 'quote' ? 'Tell Us About Your Cake' : 'Customise ' + st.def.short);
    $('pm-img').src = item.img;
    $('pm-img').alt = item.title;
    $('pm-sel-txt').textContent = item.unit === null
      ? item.title + ' • price on request'
      : [item.title].concat(item.details).concat([item.qty + (item.qty > 1 ? ' items' : ' item')]).join(' • ');
    $('pm-total').textContent = item.unit === null ? 'Quote' : money(item.unit * item.qty);
  }

  $('pm-add').addEventListener('click', function () {
    var item = currentItem();
    if (item.unit === null && !item.desc) {
      $('pm-desc').classList.add('of-invalid');
      $('pm-desc').focus();
      return;
    }
    if (!addToBasket(item)) {
      $('pm-sel-txt').textContent = 'Your basket is full — please check out first, or message us on WhatsApp.';
      return;
    }
    closeModal();
    openBasket();
  });

  /* ---- wiring ---- */
  document.querySelectorAll('.tc-link, .tc-link-btn').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('data-product');
      if (!PRODUCTS[id]) return;
      e.preventDefault();
      openModal(id);
    });
  });
  document.querySelectorAll('[data-close-pm]').forEach(function (n) { n.addEventListener('click', closeModal); });
  document.querySelectorAll('[data-close-bk]').forEach(function (n) { n.addEventListener('click', closeBasket); });
  $('js-basket-open').addEventListener('click', openBasket);
  $('of-edit-basket').addEventListener('click', openBasket);
  $('bk-checkout').addEventListener('click', function () {
    closeBasket();
    var target = $('order');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (pm.classList.contains('open')) closeModal();
    else if (bk.classList.contains('open')) closeBasket();
  });

  /* ── ORDER FORM ── */
  var form      = $('order-form');
  var submitBtn = $('of-submit');
  var submitTxt = $('of-submit-text');
  var errorEl   = $('of-error');
  var successEl = $('of-success');
  var bookedEl  = $('of-booked');
  var loading = false, farArea = false;

  function refreshSubmit() {
    submitBtn.disabled = loading || farArea || basket.length === 0;
  }

  /* "choose another date" — return to form from the fully-booked state */
  $('of-choose-another').addEventListener('click', function () {
    bookedEl.hidden = true;
    form.hidden = false;
    setLoading(false);
    var dateField = $('of-date');
    dateField.value = '';
    dateField.focus();
  });

  /* outside the 25 km delivery radius: block the order and point them to WhatsApp */
  var areaSelect = $('of-area');
  var farNote    = $('of-far');
  areaSelect.addEventListener('change', function () {
    farArea = areaSelect.value === 'OUTSIDE';
    farNote.hidden = !farArea;
    refreshSubmit();
    if (farArea) {
      var msg = 'Hi Suri\'s Sweet Treats, I\'m outside your delivery area. Could we arrange collection or a halfway spot to meet?';
      $('of-far-wa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    }
  });

  /* minimum delivery date: 3 days from today */
  var dateInput = $('of-date');
  var minDate = new Date();
  minDate.setDate(minDate.getDate() + 3);
  dateInput.min = minDate.toISOString().split('T')[0];

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }
  function clearError() {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    document.querySelectorAll('.of-invalid').forEach(function (n) { n.classList.remove('of-invalid'); });
  }
  function setLoading(v) {
    loading = v;
    refreshSubmit();
    if (v) submitTxt.textContent = 'PLACING ORDER…';
    else submitTxt.innerHTML = 'PLACE ORDER <span>→</span>';
  }

  /* ── PAYMENT DETAILS ── */
  function showPayment(name, summary, deliveryDate, total, quote, orderId) {
    var msg = 'Hi Suri\'s Sweet Treats, I\'ve just ordered ' + summary + ' for ' + deliveryDate +
      ' (name: ' + name + (orderId ? ', order ' + orderId : '') + '). Here are my ideas and inspiration photos:';
    $('of-wa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    $('of-pay').hidden = quote;
    $('of-pay-note').hidden = quote;
    $('of-pay-intro').hidden = quote;
    $('of-custom-intro').hidden = !quote;
    if (quote) return;
    $('of-pay-amount').textContent = money(total);
    $('of-pay-ref').textContent = orderId ? orderId + '-' + name : name + '-' + deliveryDate;
  }

  document.querySelectorAll('.of-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.id === 'of-copy-ref' ? $('of-pay-ref').textContent : btn.getAttribute('data-copy');
      var done = function () {
        btn.textContent = 'COPIED';
        setTimeout(function () { btn.textContent = 'COPY'; }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    var name         = $('of-name').value.trim();
    var phone        = $('of-phone').value.trim();
    var deliveryDate = $('of-date').value;
    var area         = $('of-area').value;
    var extra        = $('of-notes').value.trim();

    var invalid = false;
    if (!name)         { $('of-name').classList.add('of-invalid');  invalid = true; }
    if (!phone)        { $('of-phone').classList.add('of-invalid'); invalid = true; }
    if (!deliveryDate) { $('of-date').classList.add('of-invalid');  invalid = true; }
    if (!area || area === 'OUTSIDE') { $('of-area').classList.add('of-invalid'); invalid = true; }
    if (invalid) { showError('Please fill in all required fields.'); return; }
    if (!basket.length) { showError('Your basket is empty.'); return; }

    /* the sheet gets one row per basket item, all sharing an Order ID */
    var total   = basketTotal();
    var quote   = hasQuote();
    var summary = basket.map(lineText).join(' + ');
    var items = basket.map(function (i) {
      return { p: i.product || i.title, o: i.option || '', i: i.icing || '', q: i.qty,
               t: i.unit === null ? null : lineTotal(i), n: i.notes, d: i.desc };
    });

    var url = new URL(SCRIPT_URL);
    var cbName = 'jsonpCb_' + Date.now();
    url.searchParams.set('callback', cbName);
    url.searchParams.set('key', 'suri2026ct');
    url.searchParams.set('name', name);
    url.searchParams.set('phone', phone);
    url.searchParams.set('deliveryDate', deliveryDate);
    url.searchParams.set('area', area);
    url.searchParams.set('notes', extra);
    url.searchParams.set('total', total);
    url.searchParams.set('items', JSON.stringify(items));

    if (url.toString().length > MAX_URL) {
      showError('Your order is too long to send. Please shorten the special requests or message us on WhatsApp.');
      return;
    }

    setLoading(true);

    var script = document.createElement('script');

    /* Apps Script can be slow. On timeout keep listening (callback stays registered)
       so a late reply still shows the result, and keep the button disabled so the
       customer doesn't resubmit and create a duplicate order. */
    var timer = setTimeout(function () {
      showError('This is taking longer than usual. Please wait — don\'t resubmit. If nothing happens in a minute, contact us on WhatsApp.');
    }, 30000);

    function cleanup() {
      clearTimeout(timer);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cbName] = function (result) {
      cleanup();
      clearError();
      if (result.message === 'too_soon') {
        showError('Please select a delivery date at least 3 days from today.');
        setLoading(false);
      } else if (result.message === 'fully_booked') {
        form.hidden = true;
        bookedEl.hidden = false;
      } else if (result.success) {
        $('of-success-name').textContent = name;
        showPayment(name, summary, deliveryDate, total, quote, result.orderId);
        orderDone = true;
        basket = [];
        saveBasket();
        renderBasket();
        form.hidden = true;
        successEl.hidden = false;
      } else {
        showError('Something went wrong. Please try again or contact us directly.');
        setLoading(false);
      }
    };

    script.src = url.toString();
    script.onerror = function () {
      cleanup();
      showError('Could not connect. Please check your internet and try again.');
      setLoading(false);
    };
    document.head.appendChild(script);
  });

  basket = loadBasket();
  renderBasket();

});
