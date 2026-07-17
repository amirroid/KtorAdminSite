(function () {
  'use strict';

  // ─── Mobile Menu ───
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const navOverlay = document.getElementById('navOverlay');

  function openMenu() {
    menuBtn.classList.add('active');
    mobileMenu.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuBtn.classList.remove('active');
    mobileMenu.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });

  navOverlay.addEventListener('click', closeMenu);

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ─── Active Nav State ───
  const navLinkEls = document.querySelectorAll('.nav-links a[data-section]');
  const sections = [];
  navLinkEls.forEach(link => {
    const id = link.getAttribute('data-section');
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, link });
  });

  function updateActiveNav() {
    const navH = 80;
    let current = null;
    for (let i = sections.length - 1; i >= 0; i--) {
      const rect = sections[i].el.getBoundingClientRect();
      if (rect.top <= navH + 100) {
        current = sections[i];
        break;
      }
    }
    navLinkEls.forEach(l => l.classList.remove('active'));
    if (current) current.link.classList.add('active');
  }

  // ─── Nav Scroll State ───
  const nav = document.querySelector('nav');
  function updateNavScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }

  // ─── Unified scroll handler (RAF-throttled) ───
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveNav();
        updateNavScroll();
        updateProgressAnimations();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateActiveNav();
  updateNavScroll();

  // ─── Reveal on Scroll (fade-up) ───
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.anim-fade-up').forEach(el => revealObserver.observe(el));

  // ─── Grid Stagger Reveal ───
  const gridObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        gridObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.features-grid, .orm-grid, .ext-grid, .security-grid')
    .forEach(el => gridObserver.observe(el));

  // ─── Progress-based scroll animations ───
  // Elements with [data-progress] get their --progress CSS variable set
  // based on how far through the viewport they've scrolled.
  // --progress goes from 0 (just entering bottom) to 1 (fully past top).
  const progressEls = document.querySelectorAll('[data-progress]');

  function updateProgressAnimations() {
    const vh = window.innerHeight;
    progressEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      // progress 0 = element bottom at viewport bottom
      // progress 1 = element top at viewport top
      const raw = 1 - (rect.top / vh);
      const progress = Math.max(0, Math.min(1, raw));
      el.style.setProperty('--progress', progress.toFixed(4));

      // Also apply data-transform for parallax/translate effects
      const mode = el.getAttribute('data-progress');
      if (mode === 'parallax') {
        const offset = (0.5 - progress) * 40;
        el.style.transform = `translateY(${offset}px)`;
      } else if (mode === 'fade-scale') {
        const scale = 0.95 + progress * 0.05;
        el.style.opacity = Math.min(1, progress * 2);
        el.style.transform = `scale(${scale})`;
      } else if (mode === 'slide-left') {
        const x = (1 - progress) * -30;
        el.style.transform = `translateX(${x}px)`;
        el.style.opacity = Math.min(1, progress * 2.5);
      } else if (mode === 'slide-right') {
        const x = (1 - progress) * 30;
        el.style.transform = `translateX(${x}px)`;
        el.style.opacity = Math.min(1, progress * 2.5);
      } else if (mode === 'reveal-up') {
        const y = (1 - progress) * 40;
        el.style.transform = `translateY(${y}px)`;
        el.style.opacity = Math.min(1, progress * 2.2);
      } else if (mode === 'rotate-in') {
        const rot = (1 - progress) * -8;
        const y = (1 - progress) * 20;
        el.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
        el.style.opacity = Math.min(1, progress * 2);
      }
    });
  }

  updateProgressAnimations();

  // ─── Chart bar animation (viewport entrance, one-shot) ───
  const chartBars = document.getElementById('chartBars');
  if (chartBars) {
    const bars = chartBars.querySelectorAll('.chart-bar');
    const barHeights = Array.from(bars).map(b => b.style.height);
    bars.forEach(b => { b.style.height = '0%'; });

    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          bars.forEach((bar, i) => {
            setTimeout(() => {
              bar.style.transition = 'height 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
              bar.style.height = barHeights[i];
            }, i * 50);
          });
          chartObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    chartObserver.observe(chartBars);
  }

  // ─── Fetch GitHub Stars ───
  async function fetchStars() {
    try {
      const res = await fetch('https://api.github.com/repos/amirroid/KtorAdmin');
      if (res.ok) {
        const data = await res.json();
        const count = data.stargazers_count;
        const formatted = count >= 1000
          ? (count / 1000).toFixed(1) + 'k'
          : count.toLocaleString();
        const desktopEl = document.getElementById('starCountNum');
        const mobileEl = document.getElementById('mobileStarCountNum');
        if (desktopEl) desktopEl.textContent = formatted;
        if (mobileEl) mobileEl.textContent = formatted;
      }
    } catch (e) { /* silent */ }
  }
  fetchStars();

  // ─── Initialize SVG particle paths ───
  document.querySelectorAll('.cta-particle[data-path]').forEach(particle => {
    const d = particle.getAttribute('data-path');
    particle.style.offsetPath = `path('${d}')`;
  });

  // ─── Smooth anchor offset for fixed nav ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();
