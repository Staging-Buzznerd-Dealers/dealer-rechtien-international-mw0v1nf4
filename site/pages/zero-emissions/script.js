/* Zero emissions page: the two testimonial videos have no video link yet, so their "Watch video"
   buttons are marked disabled instead of being dead links; once a URL is set on a button it works
   as a normal link and opens in a new tab. */
(function () {
  document.querySelectorAll('[data-bz-node^="video-"][data-bz-node$="-btn"] a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#') {
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('tabindex', '-1');
      a.addEventListener('click', function (e) { e.preventDefault(); });
    } else {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
  });
})();
