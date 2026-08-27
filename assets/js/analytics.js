(function () {
  function track(name, data) {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, data);
    }
  }

  function slug(text) {
    return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Most specific wins. aria-label sits above the heading search because a
  // section without its own heading would otherwise borrow the first
  // heading inside it - on the playground that meant the gallery reported
  // itself under whatever the first card happened to be called, and the
  // label moved every time that card was renamed.
  function sectionLabel(section, index) {
    if (section.dataset.analyticsLabel) return section.dataset.analyticsLabel;
    if (section.id) return section.id;
    var aria = section.getAttribute('aria-label');
    if (aria && aria.trim()) return slug(aria);
    var heading = section.querySelector('h1, h2, h3');
    if (heading && heading.textContent.trim()) return slug(heading.textContent);
    return 'section-' + index;
  }

  function initSectionTracking() {
    if (!('IntersectionObserver' in window)) return;
    var sections = document.querySelectorAll('section');
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          track('section-view', { section: entry.target.dataset.analyticsLabel });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(function (section, index) {
      section.dataset.analyticsLabel = sectionLabel(section, index);
      observer.observe(section);
    });
  }

  function initScrollDepthTracking() {
    var milestones = [25, 50, 75, 100];
    var fired = {};
    var ticking = false;

    function checkScroll() {
      ticking = false;
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var percent = Math.min(100, Math.round(((scrollTop + doc.clientHeight) / doc.scrollHeight) * 100));

      milestones.forEach(function (m) {
        if (percent >= m && !fired[m]) {
          fired[m] = true;
          track('scroll-depth', { depth: m });
        }
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        setTimeout(checkScroll, 200);
      }
    }, { passive: true });

    checkScroll();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSectionTracking();
    initScrollDepthTracking();
  });
})();
