document.addEventListener("DOMContentLoaded", function () {
  const root = document.querySelector("[data-faq-page]");
  if (!root) return;

  const sidebar = root.querySelector(".faq-page__sidebar");
  const categoryButtons = root.querySelectorAll("[data-faq-category]");
  const panels = root.querySelectorAll("[data-faq-category-panel]");
  const searchInput = root.querySelector(".faq-page__search-input");
  const noResults = root.querySelector(".faq-page__no-results");
  const filterBtns = root.querySelectorAll("[data-faq-filter-btn]");

  /* CATEGORY SWITCHER */
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.getAttribute("data-faq-category");

      categoryButtons.forEach((b) => {
        const li = b.closest(".faq-page__sidebar-item");
        if (b === btn) {
          li && li.classList.add("is-active");
          b.setAttribute("aria-selected", "true");
        } else {
          li && li.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        }
      });

      panels.forEach((panel) => {
        if (panel.getAttribute("data-faq-category-panel") === cat) {
          panel.classList.add("is-active");
        } else {
          panel.classList.remove("is-active");
        }
      });

      // close mobile panel after picking a category
      if (window.innerWidth <= 767.98 && sidebar) {
        sidebar.classList.remove("is-open");
      }
    });
  });

  /* ACCORDION */
  root.querySelectorAll(".faq-page__question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-page__item");
      const answer = item.querySelector(".faq-page__answer");
      const isOpen = item.classList.contains("is-open");

      if (isOpen) {
        item.classList.remove("is-open");
        answer.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("is-open");
        answer.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* SEARCH */
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      panels.forEach((panel) => {
        let panelVisible = false;
        const panelItems = panel.querySelectorAll(".faq-page__item");

        panelItems.forEach((item) => {
          const text = (item.getAttribute("data-faq-text") || "").toLowerCase();
          if (!term || text.indexOf(term) !== -1) {
            item.style.display = "";
            panelVisible = true;
            visibleCount++;
          } else {
            item.style.display = "none";
          }
        });

        panel.style.display = panel.classList.contains("is-active")
          ? ""
          : "none";
        if (panelVisible && panel.classList.contains("is-active")) {
          panel.style.display = "";
        }
      });

      if (noResults) {
        noResults.hidden = !term || visibleCount > 0;
      }
    });
  }

  /* MOBILE FILTER TOGGLE (outer + inner buttons) */
  if (filterBtns.length && sidebar) {
    const toggleFilter = () => {
      sidebar.classList.toggle("is-open");
    };

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", toggleFilter);
    });
  }
});
