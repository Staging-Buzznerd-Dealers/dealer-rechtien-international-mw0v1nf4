/* Truck configurator: embeds International's live configurator (navconfig.com) in the
   "Build your truck" card. The renderer has no block that outputs a third-party iframe
   (customHtml and coded widgets strip them), so the frame is added here, at run time.
   Until this runs — and always in the dashboard's Design canvas, which runs no site JS —
   the card shows the build steps, a photo and an "Open the configurator in a new tab"
   button, so the page is complete and editable without the frame. */
(function () {
  'use strict';
  var SRC = 'https://www.navconfig.com/index.html#/';

  function mount() {
    var card = document.querySelector('[data-bz-node="build-card"]');
    if (!card || card.classList.contains('is-live')) return;
    var wrap = document.createElement('div');
    wrap.className = 'cfg-frame';
    var frame = document.createElement('iframe');
    frame.src = SRC;
    frame.title = 'International truck configurator';
    frame.loading = 'lazy';
    frame.setAttribute('allow', 'fullscreen');
    wrap.appendChild(frame);
    card.appendChild(wrap);
    card.classList.add('is-live');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
