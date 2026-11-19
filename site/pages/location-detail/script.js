/* "Contact Our Team" form (location-contact): when "What is this about?" changes, clear the
   two conditional dropdowns (Inventory Type, Select Location). The form's own logic already
   shows only the one that applies and leaves the hidden one out of the submission; this makes
   sure a choice made before switching is not still selected when its dropdown comes back. */
(function () {
  'use strict';
  function init() {
    var form = document.querySelector('[data-bz-form="location-contact"]');
    if (!form) return;
    var topic = form.querySelector('#lc-topic');
    if (!topic) return;
    topic.addEventListener('change', function () {
      ['lc-inventory', 'lc-location'].forEach(function (id) {
        var select = form.querySelector('#' + id);
        if (select) select.value = '';
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
