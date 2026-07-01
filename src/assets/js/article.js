/**
 * SpaceSmart Guide - Article JavaScript
 * Handles: Article-specific features (comparison table sort, product tracking, reading progress)
 */

(function() {
  'use strict';

  // ========================================
  // Comparison Table Sorting
  // ========================================
  function initTableSort() {
    const tables = document.querySelectorAll('.comparison-table');
    tables.forEach(table => {
      const headers = table.querySelectorAll('th');
      headers.forEach((header, colIndex) => {
        if (colIndex === headers.length - 1) return; // Skip CTA column

        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.title = 'Click to sort';

        header.addEventListener('click', () => {
          const isAsc = header.classList.toggle('sort-asc');
          header.classList.toggle('sort-desc', !isAsc);

          // Remove sort classes from other headers
          headers.forEach((h, i) => {
            if (i !== colIndex) {
              h.classList.remove('sort-asc', 'sort-desc');
            }
          });

          const tbody = table.querySelector('tbody');
          const rows = Array.from(tbody.querySelectorAll('tr'));

          rows.sort((a, b) => {
            const aText = a.cells[colIndex].textContent.trim();
            const bText = b.cells[colIndex].textContent.trim();

            // Try numeric comparison
            const aNum = parseFloat(aText.replace(/[$,]/g, ''));
            const bNum = parseFloat(bText.replace(/[$,]/g, ''));

            if (!isNaN(aNum) && !isNaN(bNum)) {
              return isAsc ? aNum - bNum : bNum - aNum;
            }

            // String comparison
            return isAsc
              ? aText.localeCompare(bText)
              : bText.localeCompare(aText);
          });

          rows.forEach(row => tbody.appendChild(row));
        });
      });
    });
  }

  // ========================================
  // Reading Progress Bar
  // ========================================
  function initReadingProgress() {
    const article = document.querySelector('.article-page');
    if (!article) return;

    const bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
      z-index: 9999;
      transform-origin: left;
      transform: scaleX(0);
      pointer-events: none;
    `;
    document.body.appendChild(bar);

    let ticking = false;
    function update() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const articleRect = article.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const articleHeight = articleRect.height;

          if (articleRect.top <= viewportHeight && articleRect.bottom >= 0) {
            const visibleStart = Math.max(0, -articleRect.top);
            const visibleEnd = Math.min(articleHeight, viewportHeight - articleRect.top);
            const progress = (visibleStart + visibleEnd / 2) / articleHeight;
            bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ========================================
  // Product Card Click Tracking
  // ========================================
  function initProductTracking() {
    document.querySelectorAll('.product-card-cta, .quick-pick-cta, .comparison-table .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productName = btn.closest('.product-card, .quick-pick-card, tr')?.querySelector('h3, .product-name, .quick-pick-title')?.textContent?.trim();
        const category = document.querySelector('.article-category')?.textContent?.trim() || 'unknown';

        // Send to analytics (GA4, etc.)
        if (typeof gtag === 'function') {
          gtag('event', 'affiliate_click', {
            product_name: productName,
            category: category,
            link_type: btn.classList.contains('quick-pick-cta') ? 'quick_pick' :
                       btn.classList.contains('product-card-cta') ? 'product_card' : 'comparison_table'
          });
        }

        // Console log for debugging
        console.log('[Affiliate Click]', { productName, category });
      });
    });
  }

  // ========================================
  // Lazy Load Images with IntersectionObserver
  // ========================================
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    const images = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.removeAttribute('loading');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '100px 0px', threshold: 0.01 });

    images.forEach(img => observer.observe(img));
  }

  // ========================================
  // Sticky Table Header for Comparison Tables
  // ========================================
  function initStickyTableHeaders() {
    const wrappers = document.querySelectorAll('.table-wrapper');
    wrappers.forEach(wrapper => {
      const table = wrapper.querySelector('table');
      if (!table) return;

      const thead = table.querySelector('thead');
      if (!thead) return;

      let ticking = false;
      function onScroll() {
        if (!ticking) {
          requestAnimationFrame(() => {
            const rect = wrapper.getBoundingClientRect();
            const headerHeight = thead.offsetHeight;

            if (rect.top < 0 && rect.bottom > headerHeight) {
              thead.style.position = 'sticky';
              thead.style.top = '0';
              thead.style.zIndex = '10';
            } else {
              thead.style.position = '';
              thead.style.top = '';
              thead.style.zIndex = '';
            }
            ticking = false;
          });
          ticking = true;
        }
      }

      wrapper.addEventListener('scroll', onScroll, { passive: true });
    });
  }

  // ========================================
  // Initialize All
  // ========================================
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initTableSort();
    initReadingProgress();
    initProductTracking();
    initLazyImages();
    initStickyTableHeaders();
  }

  init();
})();