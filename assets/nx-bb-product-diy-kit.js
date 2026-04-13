// nx-bb-product-diy-kit.js
// Handles AJAX add-to-cart + custom slide mini-cart drawer

(function () {
  function qsa(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  /* ------------------ MINI CART RENDERING ------------------ */

  function ensureMiniCartElements() {
    var overlay = document.querySelector('#nx-mini-cart-overlay');
    var drawer  = document.querySelector('#nx-mini-cart');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'nx-mini-cart-overlay';
      overlay.className = 'nx-mini-cart-overlay';
      overlay.setAttribute('data-nx-mini-cart-overlay', '');
      document.body.appendChild(overlay);
    }

    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.id = 'nx-mini-cart';
      drawer.className = 'nx-mini-cart';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-label', 'Cart');
      drawer.innerHTML = [
        '<div class="nx-mini-cart__header">',
        '  <div class="nx-mini-cart__title">Cart</div>',
        '  <button type="button" class="nx-mini-cart__close" aria-label="Close cart">&times;</button>',
        '</div>',
        '<div class="nx-mini-cart__body">',
        '  <div class="nx-mini-cart__products" data-nx-mini-cart-products></div>',
        '</div>',
        '<div class="nx-mini-cart__footer">',
        '  <div class="nx-mini-cart__subtotal-row">',
        '    <span>Subtotal</span>',
        '    <span class="nx-mini-cart__subtotal" data-nx-mini-cart-subtotal></span>',
        '  </div>',
        '  <p class="nx-mini-cart__note">Taxes and shipping calculated at checkout.</p>',
        '  <button type="button" class="nx-mini-cart__checkout" data-nx-mini-cart-checkout>Checkout</button>',
        '  <button type="button" class="nx-mini-cart__view-cart" data-nx-mini-cart-view>View cart</button>',
        '</div>'
      ].join('');
      document.body.appendChild(drawer);
    }

    // Attach close events
    overlay.onclick = closeMiniCart;
    drawer.querySelector('.nx-mini-cart__close').onclick = closeMiniCart;

    drawer.querySelector('[data-nx-mini-cart-checkout]').onclick = function () {
      window.location.href = '/checkout';
    };
    drawer.querySelector('[data-nx-mini-cart-view]').onclick = function () {
      window.location.href = '/cart';
    };

    // Quantity / remove events (event delegation)
    drawer.addEventListener('click', function (e) {
      var dec = e.target.closest('[data-nx-mini-cart-dec]');
      var inc = e.target.closest('[data-nx-mini-cart-inc]');
      var rem = e.target.closest('[data-nx-mini-cart-remove]');
      if (!dec && !inc && !rem) return;

      e.preventDefault();
      var line = e.target.closest('[data-nx-mini-cart-line]');
      if (!line) return;
      var lineIndex = parseInt(line.getAttribute('data-line'), 10);
      if (!lineIndex) return;

      var currentQty = parseInt(line.getAttribute('data-qty'), 10) || 1;
      var newQty = currentQty;

      if (dec) newQty = Math.max(0, currentQty - 1);
      if (inc) newQty = currentQty + 1;
      if (rem) newQty = 0;

      changeCartLine(lineIndex, newQty);
    });

    return { overlay: overlay, drawer: drawer };
  }

  function openMiniCart() {
    var els = ensureMiniCartElements();
    els.overlay.classList.add('is-visible');
    els.drawer.classList.add('is-open');
    document.documentElement.classList.add('nx-mini-cart-open');
  }

  function closeMiniCart() {
    var overlay = document.querySelector('#nx-mini-cart-overlay');
    var drawer  = document.querySelector('#nx-mini-cart');
    if (overlay) overlay.classList.remove('is-visible');
    if (drawer) drawer.classList.remove('is-open');
    document.documentElement.classList.remove('nx-mini-cart-open');
  }

  function renderMiniCart(cart) {
    var els = ensureMiniCartElements();
    var productsWrap = els.drawer.querySelector('[data-nx-mini-cart-products]');
    var subtotalEl   = els.drawer.querySelector('[data-nx-mini-cart-subtotal]');

    if (!cart || !cart.items || !cart.items.length) {
      productsWrap.innerHTML = '<p class="nx-mini-cart__empty">Your cart is currently empty.</p>';
      subtotalEl.textContent = formatMoney(0);
      return;
    }

    var html = '';
    cart.items.forEach(function (item, index) {
      html += [
        '<article class="nx-mini-cart-item" data-nx-mini-cart-line data-line="',
        (index + 1),
        '" data-qty="',
        item.quantity,
        '">',
        '  <div class="nx-mini-cart-item__media">',
        '    <img src="',
        item.image || '',
        '" alt="',
        escapeHtml(item.product_title),
        '" loading="lazy">',
        '  </div>',
        '  <div class="nx-mini-cart-item__info">',
        '    <div class="nx-mini-cart-item__title">', escapeHtml(item.product_title), '</div>',
        item.variant_title && item.variant_title !== 'Default Title'
          ? '<div class="nx-mini-cart-item__variant">' + escapeHtml(item.variant_title) + '</div>'
          : '',
        '    <div class="nx-mini-cart-item__meta">',
        '      <div class="nx-mini-cart-item__qty">',
        '        <button type="button" data-nx-mini-cart-dec>-</button>',
        '        <span>', item.quantity, '</span>',
        '        <button type="button" data-nx-mini-cart-inc>+</button>',
        '      </div>',
        '      <div class="nx-mini-cart-item__price">', formatMoney(item.final_line_price), '</div>',
        '    </div>',
        '    <button type="button" class="nx-mini-cart-item__remove" data-nx-mini-cart-remove>Remove</button>',
        '  </div>',
        '</article>'
      ].join('');
    });

    productsWrap.innerHTML = html;
    subtotalEl.textContent = formatMoney(cart.total_price);
  }

  function formatMoney(cents) {
    cents = parseInt(cents, 10) || 0;
    var dollars = (cents / 100).toFixed(2);
    return '$' + dollars; // adjust if you need multi-currency formatting
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fetchCartAndShow() {
    fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        renderMiniCart(cart);
        openMiniCart();
      })
      .catch(function (err) {
        console.error('Mini-cart cart.js error', err);
        // Worst case: go to full cart
        window.location.href = '/cart';
      });
  }

  function changeCartLine(lineIndex, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: lineIndex, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        renderMiniCart(cart);
      })
      .catch(function (err) {
        console.error('Mini-cart change.js error', err);
      });
  }

  /* ------------------ ADD-TO-CART HOOK ------------------ */

  function attachForm(form) {
    if (!form || form.__nxAttached) return;
    form.__nxAttached = true;

    var submitBtn = form.querySelector('[data-nx-add-to-cart]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var idInput = form.querySelector('[name="id"]');
      if (!idInput || !idInput.value) {
        console.warn('DIY kit: missing variant id');
        form.submit(); // hard fallback
        return;
      }

      var qtyInput = form.querySelector('[name="quantity"]');
      if (qtyInput && (!qtyInput.value || parseInt(qtyInput.value, 10) < 1)) {
        qtyInput.value = 1;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
      }

      var formData = new FormData(form);

      var addUrl =
        (window.Shopify &&
          Shopify.routes &&
          Shopify.routes.root &&
          Shopify.routes.root + 'cart/add.js') ||
        '/cart/add.js';

      fetch(addUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (json) {
              throw json;
            });
          }
          return response.json();
        })
        .then(function () {
          // After successful add, open our mini cart
          fetchCartAndShow();
        })
        .catch(function (error) {
          console.error('DIY kit add-to-cart error', error);
          alert(
            (error && (error.message || error.description)) ||
              'There was an error adding this item to the cart.'
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
          }
        });
    });
  }

  function initAll() {
    // Prefer our data attribute, but also grab by class as backup
    var forms = qsa(document, 'form[data-nx-diy-form], form.nx-bb-product-diy-kit__form');
    forms.forEach(attachForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // For Live Theme Editor section reload
  document.addEventListener('shopify:section:load', function (event) {
    var forms = qsa(event.target, 'form[data-nx-diy-form], form.nx-bb-product-diy-kit__form');
    forms.forEach(attachForm);
  });
})();
