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

/* S13 band video: hide the orange play badge while it plays. */
(function () {
  var box = document.querySelector('[data-bz-node="s13-video"] .bz-video--file');
  var v = box && box.querySelector('video');
  if (!v) return;
  function sync() { box.classList.toggle('is-playing', !v.paused && !v.ended); }
  ['play', 'playing', 'pause', 'ended'].forEach(function (e) { v.addEventListener(e, sync); });
  sync();
})();
