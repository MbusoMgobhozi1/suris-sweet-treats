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

    document.querySelectorAll('a, button, .tc').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.setAttribute('data-hover', ''); });
      el.addEventListener('mouseleave', function () { document.body.removeAttribute('data-hover'); });
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

  /* ── ORDER LINKS — pre-fill product from treat cards ── */
  document.querySelectorAll('.tc-link').forEach(function (link) {
    link.addEventListener('click', function () {
      var product = link.getAttribute('data-product') || '';
      if (!product) return;
      var select = document.getElementById('of-product');
      if (select) select.value = product;
    });
  });

  /* ── ORDER FORM ── */
  var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-RZq6mT4HgIsPS902uPVNfRJ6CZ5-V5BSiveF0hgQ3nbMax8tPHkKW1TE4FkIqAA4/exec';

  var form      = document.getElementById('order-form');
  var submitBtn = document.getElementById('of-submit');
  var submitTxt = document.getElementById('of-submit-text');
  var errorEl   = document.getElementById('of-error');
  var successEl = document.getElementById('of-success');
  var bookedEl  = document.getElementById('of-booked');

  /* show/hide custom cake description field */
  var productSelect  = document.getElementById('of-product');
  var customRow      = document.getElementById('of-custom-row');
  var customTextarea = document.getElementById('of-custom');
  if (productSelect) {
    productSelect.addEventListener('change', function () {
      var isCustom = productSelect.value === 'Custom Cake';
      customRow.hidden = !isCustom;
      if (customTextarea) customTextarea.required = isCustom;
    });
  }

  /* "choose another date" — return to form from the fully-booked state */
  var chooseAnotherBtn = document.getElementById('of-choose-another');
  if (chooseAnotherBtn) {
    chooseAnotherBtn.addEventListener('click', function () {
      bookedEl.hidden = true;
      form.hidden = false;
      setLoading(false);
      var dateField = document.getElementById('of-date');
      if (dateField) {
        dateField.value = '';
        dateField.focus();
      }
    });
  }

  /* set minimum delivery date to tomorrow */
  var dateInput = document.getElementById('of-date');
  if (dateInput) {
    var minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    dateInput.min = minDate.toISOString().split('T')[0];
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }

  function clearError() {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    document.querySelectorAll('.of-invalid').forEach(function (el) {
      el.classList.remove('of-invalid');
    });
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      submitTxt.textContent = 'PLACING ORDER…';
    } else {
      submitTxt.innerHTML = 'PLACE ORDER <span>→</span>';
    }
  }

  /* ── PAYMENT DETAILS ── */
  function showPayment(name, product) {
    var isCustom = product === 'Custom Cake';
    document.getElementById('of-pay').hidden = isCustom;
    document.getElementById('of-pay-note').hidden = isCustom;
    document.getElementById('of-pay-intro').hidden = isCustom;
    document.getElementById('of-custom-intro').hidden = !isCustom;
    if (isCustom) return;
    var option = document.querySelector('#of-product option[value="' + product + '"]');
    var match  = option && option.textContent.match(/R(\d+)/);
    document.getElementById('of-pay-amount').textContent =
      match ? 'R' + match[1] : 'To be confirmed';
    document.getElementById('of-pay-ref').textContent = name + '-' + product;
  }

  document.querySelectorAll('.of-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.id === 'of-copy-ref'
        ? document.getElementById('of-pay-ref').textContent
        : btn.getAttribute('data-copy');
      var done = function () {
        btn.textContent = 'COPIED';
        setTimeout(function () { btn.textContent = 'COPY'; }, 1500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
    });
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearError();

      var name         = form.querySelector('#of-name').value.trim();
      var phone        = form.querySelector('#of-phone').value.trim();
      var product      = form.querySelector('#of-product').value;
      var deliveryDate = form.querySelector('#of-date').value;
      var area         = form.querySelector('#of-area').value.trim();
      var notes        = form.querySelector('#of-notes').value.trim();
      var customDesc   = form.querySelector('#of-custom') ? form.querySelector('#of-custom').value.trim() : '';

      /* basic validation */
      var invalid = false;
      if (!name)         { form.querySelector('#of-name').classList.add('of-invalid');    invalid = true; }
      if (!phone)        { form.querySelector('#of-phone').classList.add('of-invalid');   invalid = true; }
      if (!product)      { form.querySelector('#of-product').classList.add('of-invalid'); invalid = true; }
      if (!deliveryDate) { form.querySelector('#of-date').classList.add('of-invalid');    invalid = true; }
      if (!area)         { form.querySelector('#of-area').classList.add('of-invalid');    invalid = true; }
      if (product === 'Custom Cake' && !customDesc) {
        form.querySelector('#of-custom').classList.add('of-invalid');
        invalid = true;
      }
      if (invalid) { showError('Please fill in all required fields.'); return; }

      if (SCRIPT_URL === 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        showError('Order system not connected yet. Please contact us directly.');
        return;
      }

      setLoading(true);

      var cbName = 'jsonpCb_' + Date.now();
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
          document.getElementById('of-success-name').textContent = name;
          showPayment(name, product);
          form.hidden = true;
          successEl.hidden = false;
        } else {
          showError('Something went wrong. Please try again or contact us directly.');
          setLoading(false);
        }
      };

      var url = new URL(SCRIPT_URL);
      url.searchParams.set('callback', cbName);
      url.searchParams.set('key', 'suri2026ct');
      url.searchParams.set('name', name);
      url.searchParams.set('phone', phone);
      url.searchParams.set('product', product);
      url.searchParams.set('deliveryDate', deliveryDate);
      url.searchParams.set('area', area);
      url.searchParams.set('notes', notes);
      url.searchParams.set('customDescription', customDesc);

      script.src = url.toString();
      script.onerror = function () {
        cleanup();
        showError('Could not connect. Please check your internet and try again.');
        setLoading(false);
      };
      document.head.appendChild(script);
    });
  }

});
