(function () {
  // Small helpers
  function qs(root, sel) { return root.querySelector(sel); }
  function qsa(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  function parseTags(str) {
    if (!str) return [];
    return str
      .split(',')
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(Boolean);
  }

  // ---------- CARD SLIDER ----------
  function initCardSlider(card) {
    var slider = qs(card, '[data-nx-slider]');
    if (!slider) return;

    var track    = qs(slider, '[data-nx-slides]');
    var slides   = qsa(slider, '[data-nx-slide]');
    var prev     = qs(slider, '[data-nx-prev]');
    var next     = qs(slider, '[data-nx-next]');
    var dotsWrap = qs(slider, '[data-nx-dots]');

    if (!track || slides.length <= 1) {
      if (prev) prev.style.display = 'none';
      if (next) next.style.display = 'none';
      if (dotsWrap) dotsWrap.style.display = 'none';
      return;
    }

    var index = 0;

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (var i = 0; i < slides.length; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nx-bb-sg__dot' + (i === index ? ' is-active' : '');
        btn.setAttribute('aria-label', 'Go to image ' + (i + 1));
        (function (targetIndex) {
          btn.addEventListener('click', function () {
            index = targetIndex;
            update();
          });
        })(i);
        dotsWrap.appendChild(btn);
      }
    }

    function update() {
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      if (dotsWrap) {
        var dots = qsa(dotsWrap, '.nx-bb-sg__dot');
        dots.forEach(function (d, i) {
          if (i === index) d.classList.add('is-active');
          else d.classList.remove('is-active');
        });
      }
    }

    function go(delta) {
      index += delta;
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      update();
    }

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    // basic swipe
    var startX = 0;
    var dragging = false;

    slider.addEventListener('pointerdown', function (e) {
      dragging = true;
      startX = e.clientX;
      slider.setPointerCapture(e.pointerId);
    });

    slider.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      var diff = e.clientX - startX;
      if (Math.abs(diff) > 35) {
        go(diff < 0 ? 1 : -1);
      }
    });

    renderDots();
    update();
  }

  // ---------- MAIN GRID LOGIC ----------
  function initGrid(section) {
    if (!section || section.__nxGridInitialized) return;
    section.__nxGridInitialized = true;

    var initialCount = parseInt(section.getAttribute('data-initial') || '', 10);
    var moreCount    = parseInt(section.getAttribute('data-more') || '', 10);

    if (!Number.isFinite(initialCount)) initialCount = 9;
    if (!Number.isFinite(moreCount))    moreCount    = 6;

    var toggle     = qs(section, '[data-nx-filters-toggle]');
    var panel      = qs(section, '[data-nx-filters-panel]');
    var chipsWrap  = qs(section, '[data-nx-chips]');
    var clearBtn   = qs(section, '[data-nx-clear]');
    var sortSel    = qs(section, '[data-nx-sort]');
    var list       = qs(section, '[data-nx-grid-list]');
    var countEl    = qs(section, '[data-nx-count]');
    var activeEl   = qs(section, '[data-nx-active-filters]');
    var loader     = qs(section, '[data-nx-loader]');

    if (!list) return;

    var allProductItems  = qsa(section, '[data-nx-item][data-type="product"]');
    var testimonialItems = qsa(section, '[data-nx-item][data-type="testimonial"]');

    var activeFilters = [];
    var visibleLimit  = initialCount;

    // start closed
    if (panel) {
      panel.hidden = true;
      panel.classList.remove('is-open');
    }
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }

    function getNum(el, attr, defVal) {
      var raw = el.getAttribute(attr);
      if (attr === 'data-new' || attr === 'data-featured') {
        return raw === '1' ? 1 : 0;
      }
      var n = parseFloat(raw);
      return Number.isFinite(n) ? n : defVal;
    }

    function getFilteredProducts() {
      return allProductItems.filter(function (item) {
        var tags = parseTags(item.getAttribute('data-tags'));
        if (!activeFilters.length) return true;
        return activeFilters.some(function (f) {
          return tags.indexOf(f) !== -1;
        });
      });
    }

    function sortProducts(arr) {
      var sorted = arr.slice();
      if (!sortSel) return sorted;

      var key = sortSel.value;

      sorted.sort(function (a, b) {
        if (key === 'best')        return getNum(a, 'data-best',   9999) - getNum(b, 'data-best',   9999);
        if (key === 'new')         return getNum(b, 'data-new',    0)    - getNum(a, 'data-new',    0);
        if (key === 'price_asc')   return getNum(a, 'data-price',  0)    - getNum(b, 'data-price',  0);
        if (key === 'price_desc')  return getNum(b, 'data-price',  0)    - getNum(a, 'data-price',  0);
        if (key === 'rating_desc') return getNum(b, 'data-rating', 0)    - getNum(a, 'data-rating', 0);
        if (key === 'featured')    return getNum(b, 'data-featured', 0)  - getNum(a, 'data-featured', 0);
        return 0;
      });

      return sorted;
    }

    function setChipStates() {
      if (!chipsWrap) return;
      qsa(chipsWrap, '[data-nx-filter-chip]').forEach(function (btn) {
        var v = (btn.getAttribute('data-filter-value') || '').toLowerCase();
        if (activeFilters.indexOf(v) !== -1) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });
    }

    function renderActiveFilters() {
      if (!activeEl) return;
      if (!activeFilters.length) {
        activeEl.textContent = '';
        return;
      }
      activeEl.textContent = 'Active filters: ' + activeFilters.join(', ');
    }

    function updateCount(totalFiltered, shown) {
      if (!countEl) return;
      countEl.textContent = shown + ' of ' + totalFiltered + ' products';
    }

    function hideAllProducts() {
      allProductItems.forEach(function (it) {
        it.style.display = 'none';
      });
    }

    function apply() {
      var filtered = getFilteredProducts();
      var sorted   = sortProducts(filtered);

      hideAllProducts();

      testimonialItems.forEach(function (t) {
        t.style.display = '';
      });

      var shown = 0;

      sorted.forEach(function (item, idx) {
        if (idx < visibleLimit) {
          item.style.display = '';
          shown++;
        } else {
          item.style.display = 'none';
        }
      });

      // reorder DOM to match sorting
      sorted.forEach(function (node) {
        list.appendChild(node);
      });

      setChipStates();
      renderActiveFilters();
      updateCount(filtered.length, shown);
    }

    function canLoadMore() {
      return visibleLimit < getFilteredProducts().length;
    }

    function loadMore() {
      if (!canLoadMore()) return;
      visibleLimit += moreCount;
      apply();
    }

    // --- EVENTS ---

    // FILTERS TOGGLE (fixed logic)
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var isHidden = panel.hidden || panel.hasAttribute('hidden');

        if (isHidden) {
          panel.hidden = false;
          panel.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
        } else {
          panel.hidden = true;
          panel.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // FILTER CHIPS
    if (chipsWrap) {
      chipsWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-nx-filter-chip]');
        if (!btn) return;

        var value = (btn.getAttribute('data-filter-value') || '').toLowerCase();
        if (!value) return;

        var idx = activeFilters.indexOf(value);
        if (idx === -1) {
          activeFilters.push(value);
        } else {
          activeFilters.splice(idx, 1);
        }

        visibleLimit = initialCount;
        apply();
      });
    }

    // CLEAR ALL
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        activeFilters = [];
        visibleLimit = initialCount;
        apply();
      });
    }

    // SORT
    if (sortSel) {
      sortSel.addEventListener('change', function () {
        visibleLimit = initialCount;
        apply();
      });
    }

    // INFINITE SCROLL
    function onScroll() {
      if (!canLoadMore()) return;
      var rect = section.getBoundingClientRect();
      var nearBottom = rect.bottom - window.innerHeight < 220;
      if (!nearBottom) return;

      if (loader) loader.hidden = false;

      setTimeout(function () {
        loadMore();
        if (loader) loader.hidden = !canLoadMore();
      }, 120);
    }

    window.addEventListener('scroll', onScroll);

    // init sliders
    allProductItems.forEach(function (card) {
      initCardSlider(card);
    });

    // initial render
    apply();
    if (loader) loader.hidden = true;
  }

  function initAllGrids() {
    var sections = document.querySelectorAll('[data-nx-grid]');
    sections.forEach(initGrid);
  }

  // normal load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllGrids);
  } else {
    initAllGrids();
  }

  // Shopify theme editor reload support
  document.addEventListener('shopify:section:load', function (event) {
    var section = event.target.querySelector('[data-nx-grid]');
    if (section) initGrid(section);
  });
})();
