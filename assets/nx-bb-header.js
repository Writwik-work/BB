(function () {
  'use strict';

  function initHeader(root) {
    if (!root) return;

    // -------------------------
    // Mobile menu (your existing)
    // -------------------------
    var toggle = root.querySelector('[data-nx-menu-toggle]');
    var menu = root.querySelector('[data-nx-mobile-menu]');
    var overlay = root.querySelector('[data-nx-mobile-overlay]');
    var closeBtn = root.querySelector('[data-nx-mobile-close]');

    function openMenu() {
      if (!menu) return;
      menu.classList.add('is-open');
      document.documentElement.classList.add('nx-mobile-menu-open');
    }

    function closeMenu() {
      if (!menu) return;
      menu.classList.remove('is-open');
      document.documentElement.classList.remove('nx-mobile-menu-open');
    }

    if (toggle) toggle.addEventListener('click', openMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // -------------------------
    // Desktop mega menu (NEW)
    // -------------------------
    var items = root.querySelectorAll('[data-nx-mega-item]');

    function closeAll() {
      for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('is-open');
        var trigger = items[i].querySelector('.nx-bb-nav-link');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    }

    function openItem(item) {
      if (!item) return;
      closeAll();
      item.classList.add('is-open');
      var trigger = item.querySelector('.nx-bb-nav-link');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    function isDesktop() {
      return window.matchMedia('(min-width: 768px)').matches;
    }

    for (var j = 0; j < items.length; j++) {
      (function (item) {
        var link = item.querySelector('.nx-bb-nav-link');
        var panel = item.querySelector('[data-nx-mega-panel]');
        if (!link || !panel) return;

        link.setAttribute('aria-haspopup', 'true');
        link.setAttribute('aria-expanded', 'false');

        // Hover open/close
        item.addEventListener('mouseenter', function () {
          if (!isDesktop()) return;
          openItem(item);
        });

        item.addEventListener('mouseleave', function () {
          if (!isDesktop()) return;
          item.classList.remove('is-open');
          link.setAttribute('aria-expanded', 'false');
        });

        // Keyboard accessibility
        link.addEventListener('focus', function () {
          if (!isDesktop()) return;
          openItem(item);
        });

        panel.addEventListener('focusin', function () {
          if (!isDesktop()) return;
          openItem(item);
        });
      })(items[j]);
    }

    // Close on ESC
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    // Close if click outside (desktop)
    document.addEventListener('click', function (e) {
      if (!isDesktop()) return;
      if (!root.contains(e.target)) closeAll();
    });

    // Close when resizing to mobile
    window.addEventListener('resize', function () {
      closeAll();
    });
  }

  function boot() {
    var roots = document.querySelectorAll('[data-nx-bb-header]');
    for (var i = 0; i < roots.length; i++) initHeader(roots[i]);
  }

  document.addEventListener('DOMContentLoaded', boot);
  document.addEventListener('shopify:section:load', function (evt) {
    if (!evt || !evt.target) return;
    if (evt.target.matches('[data-nx-bb-header]')) initHeader(evt.target);
  });
})();
