// HTML primitives shared by every block. Zero dependencies: this module is
// imported by the static Vercel build, by the dashboard canvas and by the
// Vendure plugin's validation pass, so it may not reach for a DOM or Node API.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for interpolation into element content or a double-quoted attribute. */
export function esc(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/**
 * Serialize an attribute map. `false`, `null` and `undefined` drop the
 * attribute entirely; `true` renders it bare.
 */
export function attrs(map) {
  const out = [];
  for (const [key, value] of Object.entries(map || {})) {
    if (value == null || value === false) continue;
    if (value === true) {
      out.push(key);
      continue;
    }
    out.push(`${key}="${esc(value)}"`);
  }
  return out.length ? ' ' + out.join(' ') : '';
}

/**
 * Analytics tagging attributes. Shift Digital browser-tag certification needs a
 * stable hook on exactly the elements the AI rewrites most often, so blocks emit
 * these structurally rather than relying on the model to remember them.
 */
export function tagAttrs(el, intent) {
  return { 'data-bz-el': el, 'data-bz-intent': intent || null };
}

/** A safe heading level. Blocks take the level as a prop so a page has one h1. */
export function heading(level, text, opts = {}) {
  const n = Math.min(6, Math.max(1, Number(level) || 2));
  if (!text) return '';
  return `<h${n}${attrs({ class: opts.class })}>${opts.raw ? text : esc(text)}</h${n}>`;
}

/**
 * An `<img>` that always carries the attributes the SEO floor requires. A block
 * with no image renders a labelled placeholder rather than a broken image, so a
 * page in progress still builds.
 */
export function image(img, opts = {}) {
  const src = img && typeof img === 'object' ? img.src : img;
  if (!src) {
    return `<div class="bz-photo bz-photo--empty"${attrs({ 'aria-hidden': 'true' })}>${esc(
      opts.placeholder || 'Photo',
    )}</div>`;
  }
  return `<img${attrs({
    src: resolveAssetUrl(src, opts.ctx),
    alt: (img && img.alt) || opts.alt || '',
    width: (img && img.width) || opts.width || 1200,
    height: (img && img.height) || opts.height || 800,
    loading: opts.eager ? 'eager' : 'lazy',
    decoding: opts.eager ? 'sync' : 'async',
    class: opts.class,
  })} />`;
}

/**
 * A URL as a quoted CSS `url()`, safe to put in a `style` attribute.
 *
 * `esc` is not enough on its own. It escapes the quote in the HTML, but the
 * browser un-escapes the attribute before the CSS parser sees it, so a `"` in
 * the URL still closes the string and whatever follows becomes a second
 * declaration — `url("/a.jpg"); background: url("https://tracker…` being the
 * shape of it. Percent-encoding the quote and the backslash means the string
 * cannot be terminated early, which makes everything after it inert.
 */
export function cssUrl(url) {
  const encoded = String(url == null ? '' : url).replace(/["\\\r\n]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`,
  );
  return `url("${encoded}")`;
}

/**
 * Classify a video source as a hosted file or a known embed.
 *
 * Returns the provider's own **id**, never the author's URL, because the id is
 * what the embed URL is then built from. Passing a supplied URL into an iframe
 * `src` would make any `https://` string a way to put a third-party document
 * inside a dealer's page; a `[A-Za-z0-9_-]` id cannot.
 *
 * An unrecognised URL is a file. That is the honest default: a dealer pasting a
 * link to a provider we do not know gets a `<video>` that fails visibly, not an
 * iframe pointing somewhere nobody vetted.
 */
export function videoSource(src) {
  const raw = String(src || '').trim();
  if (!raw) return null;

  const youtube = raw.match(
    /^https?:\/\/(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  );
  if (youtube) return { kind: 'youtube', id: youtube[1], url: raw };

  const vimeo = raw.match(
    /^https?:\/\/(?:www\.)?(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d{6,})/i,
  );
  if (vimeo) return { kind: 'vimeo', id: vimeo[1], url: raw };

  return { kind: 'file', id: null, url: raw };
}

/**
 * A video, from the media library or an embed.
 *
 * `autoplay` implies `muted`, because every browser refuses to autoplay audio
 * and the clip would simply never start. Setting one without the other is the
 * most common way a background video ships broken, so it is not expressible
 * here rather than being left to the caller to remember.
 */
export function video(source, opts = {}) {
  const parsed = videoSource(source && typeof source === 'object' ? source.src : source);
  if (!parsed) {
    return `<div class="bz-photo bz-photo--empty"${attrs({ 'aria-hidden': 'true' })}>${esc(
      opts.placeholder || 'Video',
    )}</div>`;
  }

  const title = (source && source.title) || opts.title || 'Video';
  const poster = (source && source.poster) || opts.poster || null;

  if (parsed.kind !== 'file') {
    // youtube-nocookie and Vimeo's dnt both stop the provider writing a cookie
    // until the visitor actually presses play, which is what keeps an embedded
    // clip out of the dealer's consent surface.
    const embed =
      parsed.kind === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${parsed.id}?rel=0`
        : `https://player.vimeo.com/video/${parsed.id}?dnt=1`;
    return `<div class="bz-video bz-video--embed"><iframe${attrs({
      src: embed,
      title,
      loading: 'lazy',
      referrerpolicy: 'strict-origin-when-cross-origin',
      allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      allowfullscreen: true,
      frameborder: '0',
    })}></iframe></div>`;
  }

  const autoplay = !!opts.autoplay;
  return `<div class="bz-video bz-video--file"><video${attrs({
    src: resolveAssetUrl(parsed.url, opts.ctx),
    poster: poster ? resolveAssetUrl(poster, opts.ctx) : null,
    title,
    controls: opts.controls !== false,
    autoplay,
    muted: autoplay || !!opts.muted,
    loop: !!opts.loop,
    playsinline: true,
    // `metadata` rather than `auto`: a dealer home page with three clips on it
    // would otherwise pull tens of megabytes before a visitor pressed anything.
    preload: autoplay ? 'auto' : 'metadata',
    class: opts.class,
  })}></video></div>`;
}

/** Join rendered children, dropping empties. */
export function join(parts, sep = '\n') {
  return (parts || []).filter((p) => p != null && p !== '').join(sep);
}

/** `class` string built from truthy entries. */
export function cls(...names) {
  return names.filter(Boolean).join(' ');
}

/**
 * Serialize props into a single attribute the hydration client reads back.
 * Single-quoted JSON with escaped quotes, so the payload survives HTML parsing
 * without needing a second script tag per widget.
 */
export function jsonAttr(value) {
  return esc(JSON.stringify(value == null ? null : value));
}

/** Internal link, prefix-aware. External links get rel="noopener". */
export function href(url, ctx) {
  const raw = String(url || '#');
  if (/^(https?:|mailto:|tel:|#)/i.test(raw)) return raw;
  if (!raw.startsWith('/')) return raw;
  // The storefront prefix is preserved, never stripped: links authored as
  // /store/... stay /store/... so the Vercel rewrite hits the Remix mount.
  if (ctx && ctx.storefrontPrefix && raw === '/inventory') return `/${ctx.storefrontPrefix}`;
  return raw;
}

/** Is this URL off-site? */
export function isExternal(url) {
  return /^https?:/i.test(String(url || ''));
}

/* ------------------------------------------------------------ new-tab links
 *
 * One definition of "opens in a new tab" for every link the renderer draws —
 * menus, buttons, footer, cards, and the links inside text. Two independent
 * settings sit on each link: `newTab` (target + rel) and `showIcon` (the globe).
 * The icon is only ever drawn at render time; nothing is written into content.
 */

/** Visually hidden, still read by screen readers. Styled by `.bz-sr-only`. */
export const NEW_TAB_SR = '<span class="bz-sr-only"> (opens in a new tab)</span>';

const EXTERNAL_SVG =
  '<svg class="bz-menu-icon__svg" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>';

/**
 * The new-tab globe. Site-wide it is whatever `site/icons.json` maps onto the
 * `external` slot; `own` (a per-item icon) overrides that. Same markup the
 * storefront's `<SfIcon>` draws, so one mapping and one set of CSS rules serve both.
 */
export function externalIcon(ctx, own) {
  const choice = own || (ctx && ctx.icons && ctx.icons.slots && ctx.icons.slots.external);
  const base = 'bz-menu-icon sf-icon sf-icon--external';
  if (choice && 'class' in choice) {
    return `<i class="${base} sf-icon--class ${esc(choice.class)}" aria-hidden="true"></i>`;
  }
  if (choice && !choice.tint) {
    return `<img class="${base} sf-icon--img" src="${esc(choice.src)}" alt="" aria-hidden="true" />`;
  }
  if (choice) {
    return `<span class="${base} sf-icon--mask" style="--sf-icon-src:url(&quot;${esc(choice.src)}&quot;)" aria-hidden="true"></span>`;
  }
  return `<span class="${base}" aria-hidden="true">${EXTERNAL_SVG}</span>`;
}

/**
 * `target` / `rel` for a link. A new-tab link always gets `noopener noreferrer`;
 * an off-site link that stays in the tab keeps its existing `noopener`.
 */
export function openAttrs(newTab, url) {
  if (newTab) return { target: '_blank', rel: 'noopener noreferrer' };
  if (isExternal(url)) return { rel: 'noopener' };
  return {};
}

/**
 * What follows a new-tab link's label: the hidden screen-reader text always,
 * then the icon when asked for. Nothing for a link that stays in the tab.
 * `showIcon === undefined` falls back to `iconDefault`, which is how links
 * saved before the setting existed keep looking the way they did.
 */
export function newTabSuffix({ newTab, showIcon, icon }, ctx, iconDefault = false) {
  if (!newTab) return '';
  const show = showIcon === undefined || showIcon === null ? iconDefault : !!showIcon;
  return NEW_TAB_SR + (show ? externalIcon(ctx, icon) : '');
}

/**
 * A file the published site serves from `public/` — photos, icons, fonts.
 *
 * Root-relative on the live site (`/images/truck.jpg`) so Vercel can copy the
 * folder into `dist/` and the URL just works. In the dashboard those same
 * paths resolve against the admin origin and 404, which is why `assetBase`
 * exists: the editor prefixes them, the build does not.
 */
const ASSET_EXT = /\.(?:avif|bmp|eot|gif|ico|jpe?g|mp4|otf|png|svg|ttf|webm|webp|woff2?|pdf)(?:[?#]|$)/i;

export function isSiteAssetPath(path, ctx) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false;
  const prefix = `/${(ctx && ctx.storefrontPrefix) || 'store'}`;
  if (path === prefix || path.startsWith(`${prefix}/`)) return false;
  return ASSET_EXT.test(path);
}

/**
 * Prefix a site-relative asset so the dashboard can fetch it. Absolute, data,
 * and non-asset paths (a page link, `/store/…`) pass through unchanged. With
 * no `assetBase` this is the identity, which is what the Vercel build needs.
 */
export function resolveAssetUrl(src, ctx) {
  if (typeof src !== 'string' || !src) return src;
  if (!ctx || !ctx.assetBase) return src;
  if (!isSiteAssetPath(src, ctx)) return src;
  return `${String(ctx.assetBase).replace(/\/$/, '')}${src}`;
}

/**
 * Rewrite root-relative asset URLs inside already-rendered HTML or CSS.
 *
 * `image()` is not the only emitter: `@font-face`, node `background-image`,
 * custom widget CSS and `customHtml` all carry `/images/…` and `/fonts/…`
 * verbatim. One pass at the document boundary, rather than threading ctx
 * through every helper, is what keeps those working in the editor.
 */
export function rewriteAssetUrls(text, ctx) {
  if (text == null || text === '' || !ctx || !ctx.assetBase) return text;
  const input = String(text);
  const withCss = input.replace(/url\(\s*(['"]?)(\/[^"')\s]+)\1\s*\)/gi, (full, quote, path) => {
    const resolved = resolveAssetUrl(path, ctx);
    if (resolved === path) return full;
    return `url(${quote}${resolved}${quote})`;
  });
  return withCss.replace(
    /(\s(?:src|href|poster)\s*=\s*["'])(\/[^"']+)/gi,
    (_, prefix, path) => `${prefix}${resolveAssetUrl(path, ctx)}`,
  );
}
