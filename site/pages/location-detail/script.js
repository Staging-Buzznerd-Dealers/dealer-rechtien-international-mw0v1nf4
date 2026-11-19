/* "Contact Our Team" form (location-contact): when "What is this about?" changes, clear
   Inventory Type, which belongs to Sales only. Select Location applies to every topic, so the
   visitor's branch choice is kept when they switch. The form's own logic leaves a hidden field
   out of the submission; this makes sure a stale Inventory Type is not still selected when its
   dropdown comes back. */
(function () {
  'use strict';
  function init() {
    var form = document.querySelector('[data-bz-form="location-contact"]');
    if (!form) return;
    var topic = form.querySelector('#lc-topic');
    if (!topic) return;
    topic.addEventListener('change', function () {
      ['lc-inventory'].forEach(function (id) {
        var select = form.querySelector('#' + id);
        if (select) select.value = '';
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
