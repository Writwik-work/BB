// Generic <product-form> handler
// - Intercepts Add to Cart submits
// - POSTs to /cart/add.js (AJAX)
// - Then tries VERY HARD to open your side cart drawer
//   1) Update <cart-drawer> / <cart-notification> / .cart-drawer markup if present
//   2) Fallback: click the cart icon / cart toggle button
//   3) Last resort: redirect to /cart

(function () {
  if (window.customElements && customElements.get('product-form')) {
    // Already defined (safety)
    return;
  }

  function findCartDrawer() {
    // Try various common patterns
    return (
      document.querySelector('cart-drawer') ||
      document.querySelector('cart-notification') ||
      document.querySelector('[data-cart-drawer]') ||
      document.querySelector('#CartDrawer') ||
      document.querySelector('.cart-drawer')
    );
  }

  function findCartOpener() {
    // Things that usually open the cart drawer
    return (
      document.querySelector('[data-cart-toggle]') ||
      document.querySelector('[data-drawer-toggle="cart"]') ||
      document.querySelector('[data-drawer-target="CartDrawer"]') ||
      document.querySelector('.js-mini-cart-toggle') ||
      document.querySelector('.header__icon--cart, .site-header__icon--cart') ||
      document.querySelector('a[href="/cart"]')
    );
  }

  class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.onSubmitHandler = this.onSubmitHandler.bind(this);
    }

    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;

      this.submitButton = this.form.querySelector('[type="submit"][name="add"]');
      this.form.addEventListener('submit', this.onSubmitHandler);
    }

    disconnectedCallback() {
      if (this.form) {
        this.form.removeEventListener('submit', this.onSubmitHandler);
      }
    }

    setLoading(isLoading) {
      if (!this.submitButton) return;
      this.submitButton.disabled = isLoading;

      const spinner = this.submitButton.querySelector('.loading-overlay__spinner');
      if (spinner) {
        spinner.classList.toggle('hidden', !isLoading);
      }
      this.submitButton.classList.toggle('is-loading', isLoading);
    }

    onSubmitHandler(event) {
      event.preventDefault();
      if (!this.form) return;

      const idInput = this.form.querySelector('[name="id"]');
      if (!idInput || !idInput.value) {
        console.warn('product-form: missing variant id');
        return;
      }

      this.setLoading(true);

      const formData = new FormData(this.form);

      const addUrl =
        (window.Shopify &&
          Shopify.routes &&
          Shopify.routes.root &&
          Shopify.routes.root + 'cart/add.js') ||
        '/cart/add.js';

      fetch(addUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((json) => {
              throw json;
            });
          }
          return response.json();
        })
        .then((json) => {
          this.handleSuccess(json);
        })
        .catch((error) => {
          console.error('Error adding to cart', error);
          window.alert(
            (error && (error.message || error.description)) ||
              'There was an error adding this item to the cart.'
          );
        })
        .finally(() => {
          this.setLoading(false);
        });
    }

    handleSuccess(itemJson) {
      const drawer = findCartDrawer();

      // 1) If we found a drawer element, try to refresh its contents + open it
      if (drawer) {
        const sectionId =
          drawer.getAttribute('data-section-id') ||
          drawer.getAttribute('data-section') ||
          'cart-drawer';

        const url = '/?section_id=' + encodeURIComponent(sectionId);

        fetch(url)
          .then((resp) => resp.text())
          .then((html) => {
            if (typeof drawer.renderContents === 'function') {
              drawer.renderContents(html);
            } else {
              // Generic: replace drawer inner HTML
              drawer.innerHTML = html;
            }

            if (typeof drawer.open === 'function') {
              drawer.open();
            } else {
              drawer.classList.add('is-open', 'active', 'open');
            }
          })
          .catch((err) => {
            console.warn('Could not refresh cart drawer HTML:', err);
            this.openDrawerFallback();
          });

        return;
      }

      // 2) Fallback – simulate clicking cart icon / toggle
      this.openDrawerFallback();
    }

    openDrawerFallback() {
      const opener = findCartOpener();
      if (opener) {
        // Try to prevent double navigation: many themes use JS preventDefault on click
        const evt = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        opener.dispatchEvent(evt);

        // Give drawer JS a moment; do NOT redirect immediately
        // (If your theme relies on this event to open the drawer, it'll show)
        return;
      }

      // 3) Last resort: just go to cart page
      window.location.href = '/cart';
    }
  }

  if (window.customElements) {
    customElements.define('product-form', ProductForm);
  } else {
    console.warn('Custom elements not supported; product-form will submit normally.');
  }
})();
