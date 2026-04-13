(() => {
  'use strict';

  const money = (cents, currency = 'USD') => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((cents || 0) / 100);
    } catch (e) {
      return `$${((cents || 0) / 100).toFixed(2)}`;
    }
  };

  const init = (section) => {
    if (!section || section.dataset.nxInit === 'true') return;
    section.dataset.nxInit = 'true';

    const maxItems = parseInt(section.querySelector('[data-slots]')?.children?.length || '3', 10);
    const discountPercent = parseInt(section.querySelector('[data-sidebar]')?.closest('.nx-bb-bundle-builder')?.querySelector('[data-section-id]') ? section.getAttribute('data-discount') : '0', 10);

    const picks = []; // {productId, variantId, title, img, priceCents}
    const btnAdd = section.querySelector('[data-add-to-cart]');
    const totalEl = section.querySelector('[data-total]');
    const slots = [...section.querySelectorAll('[data-slot]')];

    const getCurrency = () => {
      // fallback: try Shopify global if present
      if (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) return window.Shopify.currency.active;
      return 'USD';
    };

    const readVariantFromCard = (card) => {
      const select = card.querySelector('[data-variant-select]');
      const variantId = select ? select.value : card.getAttribute('data-default-variant-id');
      let price = 0;
      let img = card.querySelector('img')?.getAttribute('src') || '';
      let title = card.querySelector('.nxbb-bundle__title')?.textContent?.trim() || 'Item';

      if (select) {
        const opt = select.options[select.selectedIndex];
        price = parseInt(opt?.dataset?.price || '0', 10);
      } else {
        // fallback: try parse from current price text (not reliable) -> keep 0
      }

      return { variantId, priceCents: price, img, title };
    };

    const render = () => {
      // fill slots
      slots.forEach((slot, idx) => {
        const item = picks[idx];
        const media = slot.querySelector('[data-slot-media]');
        const name = slot.querySelector('[data-slot-name]');
        const price = slot.querySelector('[data-slot-price]');
        const remove = slot.querySelector('[data-remove]');

        if (!media || !name || !price || !remove) return;

        if (item) {
          media.innerHTML = item.img ? `<img src="${item.img}" alt="">` : '';
          name.textContent = item.title;
          price.textContent = money(item.priceCents, getCurrency());
          remove.hidden = false;
        } else {
          media.innerHTML = '';
          name.textContent = `Choose item ${idx + 1}`;
          price.textContent = '';
          remove.hidden = true;
        }
      });

      // totals
      const sum = picks.reduce((acc, i) => acc + (i.priceCents || 0), 0);
      const disc = parseInt(section.getAttribute('data-discount-percent') || '0', 10);
      const final = disc > 0 ? Math.round(sum * (100 - disc) / 100) : sum;

      totalEl.textContent = picks.length ? money(final, getCurrency()) : '—';
      btnAdd.disabled = picks.length === 0;
    };

    // remove handlers
    section.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]');
      if (!removeBtn) return;

      const slot = removeBtn.closest('[data-slot]');
      const idx = slots.indexOf(slot);
      if (idx >= 0) {
        picks.splice(idx, 1);
        render();
      }
    });

    // variant select updates price UI
    section.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-variant-select]');
      if (!sel) return;

      const card = sel.closest('[data-product-card]');
      const opt = sel.options[sel.selectedIndex];

      const priceCurrent = card.querySelector('[data-price-current]');
      const priceCompare = card.querySelector('[data-price-compare]');

      const p = parseInt(opt?.dataset?.price || '0', 10);
      const c = parseInt(opt?.dataset?.compare || '0', 10);
      const cur = getCurrency();

      if (priceCurrent) priceCurrent.textContent = money(p, cur);
      if (priceCompare) {
        if (c && c > p) {
          priceCompare.textContent = money(c, cur);
          priceCompare.style.display = '';
        } else {
          priceCompare.style.display = 'none';
        }
      }
    });

    // pick handlers
    section.addEventListener('click', (e) => {
      const pickBtn = e.target.closest('[data-pick]');
      if (!pickBtn) return;

      const card = pickBtn.closest('[data-product-card]');
      if (!card) return;

      const productId = card.getAttribute('data-product-id');
      const { variantId, priceCents, img, title } = readVariantFromCard(card);

      // already selected -> ignore
      if (picks.some(p => String(p.variantId) === String(variantId))) return;

      // if full -> replace last
      if (picks.length >= maxItems) {
        picks.pop();
      }

      picks.push({ productId, variantId, title, img, priceCents });
      render();
    });

    // add to cart
    btnAdd?.addEventListener('click', async () => {
      if (!picks.length) return;

      btnAdd.disabled = true;
      btnAdd.classList.add('is-loading');

      const disc = parseInt(section.getAttribute('data-discount-percent') || '0', 10);

      try {
        // add multiple variants
        const items = picks.map(i => ({ id: Number(i.variantId), quantity: 1 }));

        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });

        // optional: store discount as cart attribute (if your backend applies it)
        if (disc > 0) {
          await fetch('/cart/update.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attributes: { nx_bb_bundle_discount_percent: String(disc) } })
          });
        }

        // Refresh cart drawer if theme supports it
        document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));

        // fallback: redirect cart
        window.location.href = '/cart';
      } catch (err) {
        console.error(err);
        btnAdd.disabled = false;
      } finally {
        btnAdd.classList.remove('is-loading');
      }
    });

    // store discount percent on section
    section.setAttribute('data-discount-percent', section.querySelector('.nx-bb-bundle-builder') ? '0' : '0');
    // Better: pass discount from liquid via data attr
    section.setAttribute('data-discount-percent', String(
      parseInt(section.getAttribute('data-discount-percent') || '0', 10)
    ));

    render();
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nx-bb-bundle-builder').forEach((el) => {
      // pass discount percent from schema -> we’ll attach from liquid below if you want
      init(el);
    });
  });
})();
