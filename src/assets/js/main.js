/**
 * SpaceSmart Guide - Main JavaScript
 * Handles: Mobile menu, FAQ accordion, Back to top, Search, Newsletter
 */

(function() {
  'use strict';

  // ========================================
  // Mobile Menu Toggle
  // ========================================
  function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close on link click
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Open menu');
      });
    });

    // Close on escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  // ========================================
  // FAQ Accordion
  // ========================================
  function initFaqAccordion() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen);
      });
    });
  }

  // ========================================
  // Back to Top Button
  // ========================================
  function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          btn.hidden = window.scrollY < 300;
          btn.classList.toggle('visible', window.scrollY >= 300);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========================================
  // Newsletter Form (placeholder)
  // ========================================
  function initNewsletterForms() {
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button[type="submit"]');
        const email = input?.value?.trim();

        if (!email || !email.includes('@')) {
          input?.focus();
          return;
        }

        const originalText = btn.textContent;
        btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Subscribing...';

        try {
          // Replace with your actual endpoint
          // const res = await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
          await new Promise(r => setTimeout(r, 800)); // Simulated
          btn.textContent = 'Subscribed!';
          btn.style.background = 'var(--color-success)';
          input.value = '';
        } catch {
          btn.textContent = 'Error — try again';
          btn.style.background = 'var(--color-error)';
        }

        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = originalText;
          btn.style.background = '';
        }, 3000);
      });
    });
  }

  // ========================================
  // Skip Link Focus Fix
  // ========================================
  function initSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) return;

    skipLink.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(skipLink.getAttribute('href'));
      if (target) {
        target.focus({ preventScroll: true });
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
      }
    });
  }

  // ========================================
  // Copy Code Blocks (if any)
  // ========================================
  function initCodeCopy() {
    document.querySelectorAll('pre code').forEach(block => {
      if (block.parentElement.querySelector('.copy-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.style.cssText = 'position:absolute;top:8px;right:8px;padding:4px 8px;font-size:0.75rem;background:var(--color-background);border:1px solid var(--color-border);border-radius:4px;cursor:pointer;';
      block.parentElement.style.position = 'relative';
      block.parentElement.appendChild(btn);

      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(block.textContent);
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 2000);
        } catch {
          btn.textContent = 'Failed';
          setTimeout(() => btn.textContent = 'Copy', 2000);
        }
      });
    });
  }

  // ========================================
  // Smooth Anchor Scrolling
  // ========================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const targetId = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          target.focus({ preventScroll: true });
        }
      });
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

    initMobileMenu();
    initFaqAccordion();
    initBackToTop();
    initNewsletterForms();
    initSkipLink();
    initCodeCopy();
    initSmoothScroll();
  }

  init();
})();