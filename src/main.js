// Scroll reveal: add --visible class when sections enter viewport
(function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    document.querySelectorAll('.section, .trust-bar').forEach(function (el) {
      el.classList.add(el.classList.contains('trust-bar') ? 'trust-bar--visible' : 'section--visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var cls = entry.target.classList.contains('trust-bar') ? 'trust-bar--visible' : 'section--visible';
          entry.target.classList.add(cls);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.section, .trust-bar').forEach(function (el) {
    observer.observe(el);
  });
})();
