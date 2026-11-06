/* Mobile Service page: opens the first FAQ question, as the other pages do. The FAQ
   widget renders native <details>, so every answer works with no script. */
(function () {
  var first = document.querySelector('[data-bz-node="faq-list"] details');
  if (first) first.open = true;
})();
