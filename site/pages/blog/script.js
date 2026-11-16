/* Blog page: category filters, article count and pagination over every published post.
   The platform renders only the six newest posts as cards (the no-JS state, left in place).
   This script reads the platform's own full list of posts (/blog/posts/, which gains every
   newly published post by itself), then each post's own page for its Banner fields:
   the category from the Post hero's "Category" field (several categories: separate them
   with commas), the date, the cover image and the excerpt. Nothing is typed in here, and
   the category buttons are built from whatever the posts carry. */
(function () {
  var PAGE_SIZE = 9;
  var LIST_URL = '/blog/posts/';
  var CACHE_KEY = 'rechtien-blog-index-v1';
  var host = document.querySelector('[data-bz-node="bl-posts"]');
  if (!host || !window.fetch || !window.DOMParser) return;
  var grid = host.querySelector('.bz-grid');
  var head = host.querySelector('.bz-sechead');
  if (!grid || !head) return;

  var posts = [];
  var state = { cat: '', page: 1 };

  function txt(doc, sel) { var e = doc.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function meta(doc, sel) { var e = doc.querySelector(sel); return e ? e.getAttribute('content') || '' : ''; }
  function pathOf(u) { try { var a = new URL(u, location.href); return a.pathname + a.search; } catch (e) { return u; } }
  function shortDate(s) {
    var d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function readCache() { try { var c = JSON.parse(sessionStorage.getItem(CACHE_KEY)); return Array.isArray(c) && c.length ? c : null; } catch (e) { return null; } }
  function writeCache(list) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) { /* private mode: just refetch next time */ } }

  function loadIndex() {
    var cached = readCache();
    if (cached) return Promise.resolve(cached);
    return fetch(LIST_URL, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('list ' + r.status); return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var items = [].slice.call(doc.querySelectorAll('li.bz-loc a[href]')).map(function (a) {
        var li = a.closest('li'); var d = li && li.querySelector('.bz-loc__s');
        return { url: a.getAttribute('href'), title: a.textContent.trim(), excerpt: d ? d.textContent.trim() : '' };
      });
      var out = new Array(items.length); var next = 0;
      function worker() {
        if (next >= items.length) return Promise.resolve();
        var i = next++;
        return fetch(items[i].url, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (h) {
          var it = items[i];
          if (h) {
            var p = new DOMParser().parseFromString(h, 'text/html');
            it.category = txt(p, '[data-bz-node="ph-category"]');
            it.date = txt(p, '[data-bz-node="ph-date"]');
            var img = meta(p, 'meta[property="og:image"]');
            it.image = img ? pathOf(img) : '';
            it.excerpt = meta(p, 'meta[name="description"]') || it.excerpt;
          }
          out[i] = it;
        }).catch(function () { out[i] = items[i]; }).then(worker);
      }
      var lanes = []; for (var k = 0; k < 6; k++) lanes.push(worker());
      return Promise.all(lanes).then(function () { writeCache(out); return out; });
    });
  }

  function cats(p) { return (p.category || '').split(',').map(function (c) { return c.trim(); }).filter(Boolean); }
  function allCategories() {
    var seen = {}; posts.forEach(function (p) { cats(p).forEach(function (c) { seen[c] = (seen[c] || 0) + 1; }); });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
  }
  function filtered() { return state.cat ? posts.filter(function (p) { return cats(p).indexOf(state.cat) > -1; }) : posts; }

  /* ---- built once ---- */
  var chips = el('div', 'bl-chips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Filter posts by category');
  var count = el('span', 'bl-count'); count.setAttribute('aria-live', 'polite');
  var empty = el('p', 'bl-empty', 'No posts in this category yet.'); empty.setAttribute('role', 'status'); empty.hidden = true;
  var pager = el('nav', 'bl-pager'); pager.setAttribute('aria-label', 'Blog pages');
  var prev = el('button', 'bl-pager__btn', '← Newer entries'); prev.type = 'button';
  var info = el('span', 'bl-pager__info');
  var nextB = el('button', 'bl-pager__btn', 'Older entries →'); nextB.type = 'button';
  pager.appendChild(prev); pager.appendChild(info); pager.appendChild(nextB);

  function card(p) {
    var a = el('a', 'bz-card bz-post'); a.href = p.url;
    if (p.image) { var i = el('img'); i.src = p.image; i.alt = p.title; i.width = 1200; i.height = 800; i.loading = 'lazy'; i.decoding = 'async'; a.appendChild(i); }
    var b = el('div', 'bz-card__body');
    var m = [cats(p).join(', '), p.date ? shortDate(p.date) : ''].filter(Boolean).join(' · ');
    if (m) b.appendChild(el('span', 'bz-card__m', m));
    b.appendChild(el('span', 'bz-card__t', p.title));
    if (p.excerpt) b.appendChild(el('span', 'bz-post__d', p.excerpt));
    a.appendChild(b); return a;
  }

  function writeUrl() {
    var q = []; if (state.cat) q.push('category=' + encodeURIComponent(state.cat)); if (state.page > 1) q.push('page=' + state.page);
    try { history.replaceState(null, '', location.pathname + (q.length ? '?' + q.join('&') : '') + location.hash); } catch (e) { /* ignore */ }
  }

  function render(scroll) {
    var list = filtered(); var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages; if (state.page < 1) state.page = 1;
    var slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    slice.forEach(function (p) { grid.appendChild(card(p)); });
    empty.hidden = list.length > 0; grid.hidden = list.length === 0;
    count.textContent = list.length + (list.length === 1 ? ' article' : ' articles');
    [].forEach.call(chips.children, function (b) { var on = (b.getAttribute('data-cat') || '') === state.cat; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    pager.hidden = pages <= 1; info.textContent = 'Page ' + state.page + ' of ' + pages;
    prev.disabled = state.page <= 1; nextB.disabled = state.page >= pages;
    writeUrl();
    if (scroll) { var top = head.getBoundingClientRect().top + window.pageYOffset - 24; window.scrollTo({ top: top, behavior: 'smooth' }); }
  }

  function chip(label, value) {
    var b = el('button', 'bl-chip', label); b.type = 'button'; b.setAttribute('data-cat', value); b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { state.cat = value; state.page = 1; render(false); });
    return b;
  }
  prev.addEventListener('click', function () { state.page--; render(true); });
  nextB.addEventListener('click', function () { state.page++; render(true); });

  loadIndex().then(function (list) {
    posts = list.filter(Boolean); if (!posts.length) return;
    var q = new URLSearchParams(location.search);
    var want = q.get('category') || ''; state.page = parseInt(q.get('page'), 10) || 1;
    var c = allCategories(); state.cat = c.indexOf(want) > -1 ? want : '';
    chips.appendChild(chip('All posts', '')); c.forEach(function (n) { chips.appendChild(chip(n, n)); });
    var cta = head.querySelector('.bz-btns'); head.insertBefore(count, cta || null);
    host.querySelector('.bz-container').insertBefore(chips, head);
    grid.parentNode.insertBefore(empty, grid.nextSibling); grid.parentNode.appendChild(pager);
    host.setAttribute('data-bl-ready', '1');
    render(false);
  }).catch(function () { /* leave the six newest posts the page already shows */ });
})();
