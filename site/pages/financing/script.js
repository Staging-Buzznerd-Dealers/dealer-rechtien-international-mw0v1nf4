/* Financing page: opens the first FAQ question, as the design does (the FAQ widget
   renders native <details>, so every answer works with no script). A credit
   application with no file linked yet is marked disabled instead of being a dead
   link; once a URL is set it opens in a new tab. */
(function () {
  var first = document.querySelector('[data-bz-node="faq-list"] details');
  if (first) first.open = true;
  document.querySelectorAll('[data-bz-node^="apply-dact"] a').forEach(function (a) {
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
