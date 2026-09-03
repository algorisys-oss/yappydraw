/**
 * The static page shell (plan §S2).
 *
 * These pages exist to be READ — by a person on a slow connection and by a
 * crawler that does not run JavaScript. So they carry the prose in the initial
 * response, the stylesheet inline, and **no application bundle at all**: the
 * editor is 3 MB and a document does not need any of it. What ships is roughly
 * 50 KB with one font request.
 *
 * The DOM mirrors what `help-page.tsx` renders, class for class, because both
 * are styled by the same `help-page.css` and a visitor who arrives on the
 * static page and then opens the app must not see the layout jump.
 */

import { pathFor } from '../routes';
import type { PageMeta } from './meta';

export const esc = (s: string): string =>
    s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

/** A JSON-LD payload is script CONTENT, so the escaping rule is `</` inside it. */
const jsonLdBlock = (data: Record<string, unknown>): string =>
    `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

export interface NavItem {
    id: string;
    name: string;
    icon: string;
    category: string;
    href: string;
}

export interface PageInput {
    meta: PageMeta;
    /**
     * URL of the shared stylesheet.
     *
     * A file rather than an inline `<style>`: the same 11 KB would otherwise be
     * repeated in all 35 pages, and a reader who opens three documents wants the
     * second and third to cost nothing. The name carries a content hash, so the
     * year-long immutable cache rule in `.htaccess` applies safely.
     */
    cssHref: string;
    /**
     * Sidebar entries, in display order.
     *
     * An empty list drops the sidebar (and the search box that filters it) entirely
     * rather than rendering an empty 280px rail: a standalone page such as
     * `/founders/` has nothing to navigate between.
     */
    nav: NavItem[];
    /** The id of the entry to mark active, if any. */
    activeId?: string;
    /** Title shown in the page header. */
    heading: string;
    /** The document body — already-rendered HTML from the Markdown pipeline. */
    body: string;
}

const OG_IMAGE = 'https://yappydraw.com/og-image.png';

const head = (meta: PageMeta): string =>
    [
        '<meta charset="UTF-8" />',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `<title>${esc(meta.title)}</title>`,
        `<meta name="description" content="${esc(meta.description)}" />`,
        `<link rel="canonical" href="${esc(meta.canonical)}" />`,
        meta.noindex ? '<meta name="robots" content="noindex" />' : '',
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
        `<meta property="og:type" content="${meta.ogType}" />`,
        `<meta property="og:title" content="${esc(meta.title)}" />`,
        `<meta property="og:description" content="${esc(meta.description)}" />`,
        `<meta property="og:url" content="${esc(meta.canonical)}" />`,
        `<meta property="og:image" content="${OG_IMAGE}" />`,
        '<meta property="og:site_name" content="YappyDraw" />',
        '<meta property="og:locale" content="en_US" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        `<meta name="twitter:title" content="${esc(meta.title)}" />`,
        `<meta name="twitter:description" content="${esc(meta.description)}" />`,
        `<meta name="twitter:image" content="${OG_IMAGE}" />`,
        '<link rel="preconnect" href="https://fonts.googleapis.com" />',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />',
        ...meta.jsonLd.map(jsonLdBlock),
    ]
        .filter(Boolean)
        .join('\n  ');

const sidebar = (nav: NavItem[], activeId?: string): string => {
    const categories = [...new Set(nav.map((n) => n.category))];
    const groups = categories
        .map((category) => {
            const items = nav
                .filter((n) => n.category === category)
                .map(
                    (n) =>
                        `<li><a class="shape-item${n.id === activeId ? ' active' : ''}" href="${esc(n.href)}" data-name="${esc(
                            n.name.toLowerCase(),
                        )}"><span class="shape-icon">${n.icon}</span><span class="shape-name">${esc(n.name)}</span></a></li>`,
                )
                .join('');
            return `<div class="nav-category"><h3 class="category-title">${esc(category)}</h3><ul class="shape-list">${items}</ul></div>`;
        })
        .join('');
    return `<aside class="help-sidebar"><nav class="shape-nav">${groups}</nav></aside>`;
};

/**
 * Sidebar filtering, in eleven lines of plain DOM.
 *
 * The in-app page filters as you type; without SOMETHING the static page would
 * ship a search box that does nothing. It is progressive enhancement — the list
 * is complete and navigable with the script removed, which is the state a
 * crawler sees.
 */
const FILTER_SCRIPT = `
(function () {
  var input = document.querySelector('.search-input');
  if (!input) return;
  var items = [].slice.call(document.querySelectorAll('.shape-list li'));
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    items.forEach(function (li) {
      var a = li.querySelector('a');
      li.hidden = !!q && (a.getAttribute('data-name') || '').indexOf(q) < 0;
    });
    document.querySelectorAll('.nav-category').forEach(function (group) {
      group.hidden = ![].slice.call(group.querySelectorAll('li')).some(function (li) { return !li.hidden; });
    });
  });
})();`.trim();

export const buildPage = (input: PageInput): string => {
    // The search box only ever filtered the sidebar, so it goes with it. Leaving it
    // behind would ship a control that visibly does nothing.
    const hasNav = input.nav.length > 0;
    return `<!doctype html>
<html lang="en">

<head>
  ${head(input.meta)}
  <link rel="stylesheet" href="${esc(input.cssHref)}" />
</head>

<body>
  <div class="help-page">
    <header class="help-header">
      <div class="help-header-left">
        <a class="back-button" href="${pathFor('home')}">← Back to Yappy</a>
        <div class="help-title">${esc(input.heading)}</div>
      </div>
      ${hasNav ? '<div class="help-header-right"><input type="text" class="search-input" placeholder="Search tools &amp; shapes..." aria-label="Search documentation" /></div>' : ''}
    </header>

    <div class="help-content">
      ${hasNav ? sidebar(input.nav, input.activeId) : ''}
      <main class="help-main">
        <div class="doc-container">${input.body}</div>
        <footer class="doc-footer">
          <a href="${pathFor('home')}">YappyDraw</a>
          <a href="${pathFor('help')}">Documentation</a>
          <a href="${pathFor('examples')}">Examples</a>
          <a href="${pathFor('learn')}">Learn</a>
          <a href="/privacy-policy.html">Privacy</a>
          <a href="/terms-of-service.html">Terms</a>
          <a href="/refund-policy.html">Refunds</a>
          <a href="/contact.html">Contact</a>
        </footer>
      </main>
    </div>
  </div>
  <script>${FILTER_SCRIPT}</script>
</body>

</html>
`;
};
