(function () {
  function initFreeShipping(scope) {
    var container = scope.querySelector('[data-nx-free-container]');
    if (!container) return;

    var progressEl = container.querySelector('[data-nx-free-progress]');
    var textEl     = container.querySelector('[data-nx-free-text]');
    if (!progressEl || !textEl) return;

    // Nothing fancy here – server already calculated values.
    // This is just a placeholder if later you want to adjust text dynamically.
  }

  function initCartSections() {
    document.querySelectorAll('[data-nx-cart-form]').forEach(function (form) {
      initFreeShipping(form.closest('.nx-bb-cart') || document);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartSections);
  } else {
    initCartSections();
  }

  // For Theme Editor reloads
  document.addEventListener('shopify:section:load', function (event) {
    if (event.target.querySelector('[data-nx-cart-form]')) {
      initCartSections();
    }
  });
})();
