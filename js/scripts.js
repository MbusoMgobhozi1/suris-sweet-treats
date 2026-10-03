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

  /* set minimum delivery date to tomorrow */
  var dateInput = document.getElementById('of-date');
  if (dateInput) {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
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

      try {
        var response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            name: name,
            phone: phone,
            product: product,
            deliveryDate: deliveryDate,
            area: area,
            notes: notes,
            customDescription: customDesc,
            key: 'suri2026ct'
          })
        });

        var result = await response.json();

        if (result.message === 'fully_booked') {
          form.hidden = true;
          bookedEl.hidden = false;
        } else if (result.success) {
          document.getElementById('of-success-name').textContent = name;
          form.hidden = true;
          successEl.hidden = false;
        } else {
          showError('Something went wrong. Please try again or contact us directly.');
          setLoading(false);
        }
      } catch (err) {
        showError('Could not connect. Please check your internet and try again.');
        setLoading(false);
      }
    });
  }

});
