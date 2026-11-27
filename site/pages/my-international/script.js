/* My International page: a few links (dashboard login, enrolment, app stores, the "Explore"
   links on the feature rows) have no destination yet and are saved as "#". Until a real
   address is set on the button or the placement, they do nothing instead of jumping to
   the top of the page; once a URL is set they behave as normal links. */
(function () {
  document.querySelectorAll('main a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
