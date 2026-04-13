(function () {
  function initFAQ(container) {
    const rows = container.querySelectorAll(".nx-bb-faq__row");
    if (!rows.length) return;

    rows.forEach((row) => {
      const btn = row.querySelector(".nx-bb-faq__trigger");
      const panel = row.querySelector(".nx-bb-faq__panel");
      if (!btn || !panel) return;

      // default closed
      btn.setAttribute("aria-expanded", "false");
      panel.hidden = true;

      btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";

        // close all
        rows.forEach((r) => {
          const b = r.querySelector(".nx-bb-faq__trigger");
          const p = r.querySelector(".nx-bb-faq__panel");
          if (!b || !p) return;
          b.setAttribute("aria-expanded", "false");
          p.hidden = true;
        });

        // open current
        if (!isOpen) {
          btn.setAttribute("aria-expanded", "true");
          panel.hidden = false;
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-nxbb-faq]").forEach((el) => initFAQ(el));
  });

  document.addEventListener("shopify:section:load", (e) => {
    const root = e.target.querySelector("[data-nxbb-faq]");
    if (root) initFAQ(root);
  });
})();
