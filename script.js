(function () {
  'use strict';

  var root = document.documentElement;

  // --- Theme: light / dark (persists in localStorage) ---
  var themeToggle = document.querySelector('.theme-toggle');
  var THEME_KEY = 'theme';

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setThemeLabels() {
    if (!themeToggle) return;
    var dark = currentTheme() === 'dark';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
  }

  function applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
    setThemeLabels();
  }

  if (themeToggle) {
    setThemeLabels();
    themeToggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // --- Year in footer ---
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- Header scroll state ---
  var header = document.querySelector('.header');
  if (header) {
    function onScroll() {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- Mobile nav toggle ---
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        if (nav) nav.classList.remove('open');
      }
    });
  });

  // --- Project cards: click handler + scroll-in animation ---
  var projectCards = document.querySelectorAll('.project');

  projectCards.forEach(function (project) {
    project.addEventListener('click', function (e) {
      // Don't treat inner links as card clicks.
      if (e.target && e.target.closest && e.target.closest('a')) return;
      var id = this.getAttribute('data-video');
      // Example: open a video modal or link
      // window.location.href = '/project/' + id;
      console.log('Project clicked:', id);
    });
  });

  if (projectCards.length) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('enter');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      projectCards.forEach(function (card) {
        observer.observe(card);
      });
    } else {
      // If reduced motion is enabled (or IntersectionObserver isn't supported), skip the animation.
      // Cards remain fully visible.
    }
  }

  // --- Hero heading: typing effect ---
  var typingTextEl = document.querySelector('.hero-typing-text');
  var typingCursorEl = document.querySelector('.hero-typing-cursor');
  if (typingTextEl) {
    var phrases = ['Video editor', 'Story teller', 'Creator'];
    var motionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    function runTyping() {
      if (motionQuery && motionQuery.matches) {
        typingTextEl.textContent = phrases.join(' · ');
        if (typingCursorEl) typingCursorEl.style.visibility = 'hidden';
        return;
      }

      if (typingCursorEl) typingCursorEl.style.visibility = '';

      var phraseIndex = 0;
      var charIndex = 0;
      var deleting = false;
      var typeDelay = 85;
      var deleteDelay = 45;
      var pauseFull = 2200;
      var pauseNext = 380;
      var timeoutId;

      function step() {
        var full = phrases[phraseIndex];
        if (!deleting) {
          charIndex += 1;
          typingTextEl.textContent = full.slice(0, charIndex);
          if (charIndex >= full.length) {
            deleting = true;
            timeoutId = setTimeout(step, pauseFull);
            return;
          }
          timeoutId = setTimeout(step, typeDelay + Math.random() * 50);
        } else {
          charIndex -= 1;
          typingTextEl.textContent = full.slice(0, Math.max(0, charIndex));
          if (charIndex <= 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            timeoutId = setTimeout(step, pauseNext);
            return;
          }
          timeoutId = setTimeout(step, deleteDelay);
        }
      }

      step();
    }

    runTyping();
  }

  // --- Contact section: fade-in when scrolled into view ---
  var contactSection = document.getElementById('contact');
  var contactMotionReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (contactSection && !contactMotionReduced && 'IntersectionObserver' in window) {
    contactSection.classList.add('js-contact-reveal');
    var contactRevealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });
    contactRevealObserver.observe(contactSection);
  }

  // --- Contact form validation ---
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var messageInput = document.getElementById('contact-message');
    var nameError = document.getElementById('contact-name-error');
    var emailError = document.getElementById('contact-email-error');
    var messageError = document.getElementById('contact-message-error');

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setFieldState(input, errorEl, message) {
      if (!input || !errorEl) return;
      if (message) {
        errorEl.textContent = message;
        input.setAttribute('aria-invalid', 'true');
      } else {
        errorEl.textContent = '';
        input.removeAttribute('aria-invalid');
      }
    }

    function validateEmail(value) {
      return emailPattern.test(value);
    }

    function clearAllErrors() {
      setFieldState(nameInput, nameError, '');
      setFieldState(emailInput, emailError, '');
      setFieldState(messageInput, messageError, '');
    }

    function attachClearOnInput(input, errorEl) {
      if (!input || !errorEl) return;
      input.addEventListener('input', function () {
        if (errorEl.textContent) {
          setFieldState(input, errorEl, '');
        }
      });
    }

    attachClearOnInput(nameInput, nameError);
    attachClearOnInput(emailInput, emailError);
    attachClearOnInput(messageInput, messageError);

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors();

      var nameVal = nameInput ? nameInput.value.trim() : '';
      var emailVal = emailInput ? emailInput.value.trim() : '';
      var messageVal = messageInput ? messageInput.value.trim() : '';
      var ok = true;

      if (!nameVal) {
        setFieldState(nameInput, nameError, 'Please enter your name.');
        ok = false;
      }

      if (!emailVal) {
        setFieldState(emailInput, emailError, 'Please enter your email address.');
        ok = false;
      } else if (!validateEmail(emailVal)) {
        setFieldState(emailInput, emailError, 'Please enter a valid email address.');
        ok = false;
      }

      if (!messageVal) {
        setFieldState(messageInput, messageError, 'Please enter a message.');
        ok = false;
      }

      if (!ok) {
        if (!nameVal && nameInput) {
          nameInput.focus();
        } else if (emailInput && (!emailVal || !validateEmail(emailVal))) {
          emailInput.focus();
        } else if (!messageVal && messageInput) {
          messageInput.focus();
        }
        return;
      }

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: {
          Accept: 'application/json'
        }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Failed request');
          return res.json();
        })
        .then(function () {
          alert('Thank you for your messages.');
          contactForm.reset();
          clearAllErrors();
        })
        .catch(function () {
          alert('Could not send your message right now. Please try again.');
        });
    });
  }
})();
