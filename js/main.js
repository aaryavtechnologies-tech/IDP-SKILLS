/**
 * IDP Landing Page - Main JavaScript
 * Handles navigation, count-up animations, FAQ accordions,
 * native dialog modal logic, and scroll reveal effects.
 */

(function () {
  'use strict';

  // Mark JS enabled
  document.documentElement.classList.add('js-enhanced');

  document.addEventListener('DOMContentLoaded', initApp);

  function initApp() {
    initHeaderScroll();
    initMobileNav();
    initCounterAnimations();
    initFaqAccordion();
    initConsultationModal();
    initScrollReveal();
  }

  /**
   * 1. Header scroll effect
   */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  /**
   * 2. Mobile Drawer Navigation
   */
  function initMobileNav() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const drawer = document.getElementById('mobile-menu-drawer');
    if (!toggleBtn || !drawer) return;

    function openMenu() {
      drawer.classList.add('is-active');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      drawer.classList.remove('is-active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('is-active');
      if (isOpen) closeMenu();
      else openMenu();
    });

    // Close on link click
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });

    // Close on outside tap
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
        closeMenu();
      }
    });
  }

  /**
   * 3. Number Counter Animations (Verified numbers only)
   */
  function initCounterAnimations() {
    const statCards = document.querySelectorAll('.stat-card');
    if (!statCards.length) return;

    let animated = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateAllCounters();
          observer.disconnect();
        }
      });
    }, { threshold: 0.15 });

    statCards.forEach(c => observer.observe(c));

    function animateAllCounters() {
      const counters = document.querySelectorAll('[data-counter-target]');
      counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-counter-target'));
        const isDecimal = target % 1 !== 0;
        const duration = 1600; // ms
        const startTime = performance.now();

        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease Out Quart
          const easeProgress = 1 - Math.pow(1 - progress, 4);
          const currentVal = target * easeProgress;

          if (isDecimal) {
            counter.textContent = currentVal.toFixed(1);
          } else {
            counter.textContent = Math.floor(currentVal).toLocaleString('en-IN');
          }

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            if (isDecimal) {
              counter.textContent = target.toFixed(1);
            } else {
              counter.textContent = target.toLocaleString('en-IN');
            }
          }
        }

        requestAnimationFrame(update);
      });
    }
  }

  /**
   * 4. FAQ Accordion
   */
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
      const btn = item.querySelector('.faq-question-btn');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close other items (clean accordion behavior)
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('is-open');
            const otherBtn = other.querySelector('.faq-question-btn');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /**
   * 5. Consultation Modal (<dialog>) with WhatsApp Integration
   */
  function initConsultationModal() {
    const dialog = document.getElementById('consultation-dialog');
    const openBtns = document.querySelectorAll('.open-consultation-btn');
    const closeBtn = document.getElementById('close-dialog-btn');
    const form = document.getElementById('consultation-form');

    if (!dialog) return;

    // Open handlers
    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      });
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dialog.close();
      });
    }

    // Modern Web Guidance: fallback for light-dismiss if closedby="any" not supported natively
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e, d) => {
        const r = d.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) {
          dialog.close();
        }
      });
    }

    // Form submission -> WhatsApp redirect
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('consult-name')?.value.trim() || 'Guest';
        const phone = document.getElementById('consult-phone')?.value.trim() || '';
        const role = document.getElementById('consult-role')?.value || 'Learner';
        const slot = document.getElementById('consult-slot')?.value || 'Flexible';

        const mentorPhone = '919005747128';
        const textMessage = `Hello Gulshad Sir,
My name is ${name}.
I am a ${role} interested in the IDP Affiliate System.
Phone: ${phone}
Preferred Consultation Time: ${slot}
Please guide me with the 1-on-1 mentorship roadmap.`;

        const waUrl = `https://wa.me/${mentorPhone}?text=${encodeURIComponent(textMessage)}`;

        // Open WhatsApp in new tab
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        // Close dialog
        dialog.close();
        form.reset();
      });
    }
  }

  /**
   * 6. Progressive Scroll Reveal Animations
   */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.fade-up-init');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 100px 0px' });

    elements.forEach(el => observer.observe(el));

    // Fallback timer to ensure no content stays hidden under edge-case scroll states
    setTimeout(() => {
      elements.forEach(el => el.classList.add('is-visible'));
    }, 1200);
  }

})();
