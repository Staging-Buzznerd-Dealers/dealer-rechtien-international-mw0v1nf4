/* Specifications page: opens the first FAQ question, as the design does.
   The FAQ widget renders native <details>, so every answer is readable and
   keyboard-operable with no script; this only sets the initial open state.
   There is no platform behaviour for "start with one item open". */
(function () {
  var first = document.querySelector('[data-bz-node="faq-list"] details');
  if (first) first.open = true;
})();
