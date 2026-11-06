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

/* S13 band video: same click-to-play thumbnail as the brochure library. The
   native controls stay in the markup (works with no script); they are held back
   until the first press so the poster reads as a clean thumbnail with the play
   badge, then come in when playback starts. Enter / Space also start it. */
(function () {
  var box = document.querySelector('[data-bz-node="s13-video"] .bz-video--file');
  var v = box && box.querySelector('video');
  if (!v) return;
  var label = v.getAttribute('title') || 'video';
  v.controls = false;
  v.setAttribute('tabindex', '0');
  v.setAttribute('role', 'button');
  v.setAttribute('aria-label', 'Play ' + label);
  function sync() { box.classList.toggle('is-playing', !v.paused && !v.ended); }
  function start() {
    if (v.controls) return;
    v.controls = true;
    v.removeAttribute('role');
    v.removeAttribute('aria-label');
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  v.addEventListener('click', start);
  v.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
  });
  ['play', 'playing', 'pause', 'ended'].forEach(function (e) { v.addEventListener(e, sync); });
  sync();

  // Documents: disabled when no file is linked yet; otherwise View opens a new tab
  // and Download carries the download attribute.
  document.querySelectorAll('[data-bz-node^="s13-dact"] a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#') {
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('tabindex', '-1');
      a.addEventListener('click', function (e) { e.preventDefault(); });
    } else if (/^download/i.test(a.textContent.trim())) {
      a.setAttribute('download', '');
    } else {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
  });
})();
