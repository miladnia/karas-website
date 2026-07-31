(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var navLinks = nav ? nav.querySelectorAll('.nav__link') : [];
  var sections = Array.from(document.querySelectorAll('#hero, #synopsis, #videos, #crew, #gallery'));

  /* Smooth scroll for anchor links (respects reduced motion) */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });

      history.replaceState(null, '', targetId);
    });
  });

  /* Active nav link on scroll */
  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateScrollState() {
    if (!nav || !sections.length) return;

    var navHeight = nav.offsetHeight;
    var scrollPos = window.scrollY + navHeight + 2;
    var activeSection = sections[0];

    sections.forEach(function (section) {
      if (section.offsetTop - 200 <= scrollPos) {
        activeSection = section;
      }
    });

    setActiveLink(activeSection.id);
    nav.classList.toggle('is-scrolled', window.scrollY > 50);
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(function () {
        updateScrollState();
        scrollTicking = false;
      });
    }
  }, { passive: true });

  updateScrollState();

  /* Reusable EN / FA language toggle */
  var langChoices = {};
  var LANG_FADE_MS = prefersReducedMotion ? 0 : 350;

  function applyLangToContent(contentEl, lang) {
    contentEl.classList.remove('lang-content--en', 'lang-content--fa');
    contentEl.classList.add(lang === 'fa' ? 'lang-content--fa' : 'lang-content--en');
    contentEl.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    contentEl.querySelectorAll('[data-lang]').forEach(function (node) {
      var nodeLang = node.getAttribute('data-lang');
      var visible = nodeLang === lang;
      node.hidden = !visible;
    });
  }

  function updateLangToggleUI(blockEl, lang) {
    blockEl.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      var isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function setLangBlockLanguage(blockEl, lang, options) {
    var opts = options || {};
    var blockId = blockEl.getAttribute('data-lang-block') || 'default';
    var contentEl = blockEl.querySelector('[data-lang-content]');
    if (!contentEl || (lang !== 'en' && lang !== 'fa')) return;

    var previousLang = langChoices[blockId] || 'en';
    if (!opts.force && previousLang === lang) return;

    function finishSwitch() {
      applyLangToContent(contentEl, lang);
      langChoices[blockId] = lang;
      updateLangToggleUI(blockEl, lang);
      contentEl.classList.remove('is-fading');
    }

    if (LANG_FADE_MS === 0 || opts.skipFade) {
      finishSwitch();
      return;
    }

    contentEl.classList.add('is-fading');
    window.setTimeout(finishSwitch, LANG_FADE_MS);
  }

  function initLangBlock(blockEl) {
    var blockId = blockEl.getAttribute('data-lang-block') || 'default';
    if (langChoices[blockId] === undefined) {
      langChoices[blockId] = 'en';
    }

    setLangBlockLanguage(blockEl, langChoices[blockId], { force: true, skipFade: true });

    blockEl.querySelectorAll('.lang-toggle__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLangBlockLanguage(blockEl, btn.getAttribute('data-lang'));
      });
    });
  }

  document.querySelectorAll('[data-lang-block]').forEach(initLangBlock);

  /* Lightbox */
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  var lightboxImg = lightbox.querySelector('.lightbox__img');
  var closeBtn = lightbox.querySelector('.lightbox__close');
  var prevBtn = lightbox.querySelector('.lightbox__nav--prev');
  var nextBtn = lightbox.querySelector('.lightbox__nav--next');
  var galleryItems = Array.from(document.querySelectorAll('.gallery-item[data-lightbox]'));
  var currentIndex = 0;
  var lastFocused = null;

  function openLightbox(index) {
    if (!galleryItems.length) return;

    currentIndex = index;
    lastFocused = document.activeElement;

    var src = galleryItems[currentIndex].getAttribute('data-lightbox');
    var alt = galleryItems[currentIndex].querySelector('img').alt;

    lightboxImg.src = src;
    lightboxImg.alt = alt;

    lightbox.removeAttribute('hidden');
    lightbox.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      lightbox.classList.add('is-open');
    });

    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    lightbox.addEventListener('transitionend', function onClose() {
      lightbox.removeEventListener('transitionend', onClose);
      if (!lightbox.classList.contains('is-open')) {
        lightbox.setAttribute('hidden', '');
        lightboxImg.src = '';
      }
    });

    if (lastFocused) lastFocused.focus();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].getAttribute('data-lightbox');
    lightboxImg.alt = galleryItems[currentIndex].querySelector('img').alt;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].getAttribute('data-lightbox');
    lightboxImg.alt = galleryItems[currentIndex].querySelector('img').alt;
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener('click', function () {
      openLightbox(index);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
})();
