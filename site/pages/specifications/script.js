/* Specifications page: opens the first FAQ question, as the design does.
   The FAQ widget renders native <details>, so every answer is readable and
   keyboard-operable with no script; this only sets the initial open state.
   There is no platform behaviour for "start with one item open". */
(function () {
  var first = document.querySelector('[data-bz-node="faq-list"] details');
  if (first) first.open = true;
})();

/* Banner video autoplays muted and loops (browsers only allow muted autoplay).
   For visitors who ask for reduced motion, hold it on the poster frame; the
   native controls are still there to start it. */
(function () {
  var v = document.querySelector('[data-bz-node="banner-video"] video');
  if (!v || !window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    v.removeAttribute('autoplay');
    v.pause();
  }
})();
