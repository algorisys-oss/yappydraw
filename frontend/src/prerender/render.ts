/**
 * Writes the static HTML for every public page, plus the sitemap.
 *
 * WHY THIS EXISTS: the app is a client-rendered SPA on static hosting, so
 * without this every URL is served the home page's `<head>` — including its
 * canonical, which tells Google that all 33 pages are duplicates of the home
 * page. Head patching at runtime happens after 3 MB of JavaScript executes,
 * far too late for a canonical and useless to a crawler that does not run it.
 *
 * The documents come from the same Markdown modules the app renders, through
 * the same `renderHelpDoc`, so the indexable page and the in-app page cannot
 * drift (plan §S2 — the reason the JSX→Markdown conversion came first).
 *
 * Output is the directory-index form, `/help/uml/index.html`, because it is the
 * one convention Apache, LiteSpeed, GitHub Pages, S3 and nginx all resolve the
 * same way.
 */

import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { renderHelpDoc, type DocMeta } from '../help-docs/markdown';
import { pathFor, urlFor, SITE } from '../routes';
import { metaFor } from './meta';
import { buildPage, type NavItem } from './page';
import { exampleTemplates } from '../examples/templates';

/** Front matter may carry search-facing overrides; the renderer passes them through. */
export type PageDocMeta = DocMeta & { seoTitle?: string; seoDescription?: string };

export interface RenderedDocument {
    meta: PageDocMeta;
    html: string;
    /** Path of the source file, relative to the repo — used for `lastmod`. */
    source: string;
}

const REPO = path.resolve(import.meta.dirname, '../../..');
const HELP_DOCS = path.join(REPO, 'frontend/src/help-docs');
const ARTICLES = path.join(REPO, 'articles');

/**
 * Read every help document, in the sidebar's order.
 *
 * The order comes from `help-page.tsx`'s registry, which is the order a reader
 * sees; re-deriving it from the filesystem would put `animate` next to
 * `animation` and split the Diagrams group.
 */
export const readHelpDocs = async (): Promise<RenderedDocument[]> => {
    const registry = await readFile(path.join(HELP_DOCS, 'help-page.tsx'), 'utf8');
    const order = [...registry.matchAll(/import \{ meta as \w+ \} from '\.\/([\w/-]+\.md)\?meta';/g)].map(
        (m) => m[1],
    );
    if (!order.length) throw new Error('No help documents found in help-page.tsx — did the registry change shape?');

    return Promise.all(
        order.map(async (rel) => {
            const source = path.join(HELP_DOCS, rel);
            const rendered = renderHelpDoc(await readFile(source, 'utf8'), rel);
            return {
                meta: rendered.meta as PageDocMeta,
                html: rendered.html,
                source: path.relative(REPO, source),
            };
        }),
    );
};

/** Long-form articles under `/learn/`. */
export const readArticles = async (): Promise<RenderedDocument[]> => {
    const dirs = await readdir(ARTICLES, { withFileTypes: true });
    const files: string[] = [];
    for (const dir of dirs.filter((d) => d.isDirectory())) {
        const inner = await readdir(path.join(ARTICLES, dir.name));
        files.push(...inner.filter((f) => f.endsWith('.md')).map((f) => path.join(ARTICLES, dir.name, f)));
    }

    return Promise.all(
        files.sort().map(async (source) => {
            const rendered = renderHelpDoc(await readFile(source, 'utf8'), path.relative(REPO, source));
            return {
                meta: rendered.meta as PageDocMeta,
                html: rendered.html,
                source: path.relative(REPO, source),
            };
        }),
    );
};

const navFor = (docs: RenderedDocument[], key: 'helpDoc' | 'learnArticle'): NavItem[] =>
    docs.map((d) => ({
        id: d.meta.id,
        name: d.meta.name,
        icon: d.meta.icon,
        category: d.meta.category,
        href: pathFor(key, d.meta.id),
    }));

/** An index page listing what is in a section, so the section URL is worth indexing itself. */
const indexBody = (title: string, intro: string, docs: RenderedDocument[], key: 'helpDoc' | 'learnArticle'): string => {
    const categories = [...new Set(docs.map((d) => d.meta.category))];
    const sections = categories
        .map((category) => {
            const rows = docs
                .filter((d) => d.meta.category === category)
                .map(
                    (d) =>
                        `<tr><td><a href="${pathFor(key, d.meta.id)}">${d.meta.icon} ${escapeText(d.meta.name)}</a></td><td>${escapeText(
                            d.meta.description,
                        )}</td></tr>`,
                )
                .join('');
            return `<section class="doc-section" id="${slug(category)}"><h2>${escapeText(
                category,
            )}</h2><table class="api-table"><thead><tr><th>Page</th><th>What it covers</th></tr></thead><tbody>${rows}</tbody></table></section>`;
        })
        .join('');
    return `<header class="doc-header"><h1>${escapeText(title)}</h1><p class="doc-intro">${intro}</p></header>${sections}`;
};

const escapeText = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export interface SitemapEntry {
    url: string;
    lastmod: string;
    changefreq: string;
    priority: string;
}

export const buildSitemap = (entries: SitemapEntry[]): string =>
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
        .map((e) =>
            [
                '  <url>',
                `    <loc>${e.url}</loc>`,
                `    <lastmod>${e.lastmod}</lastmod>`,
                `    <changefreq>${e.changefreq}</changefreq>`,
                `    <priority>${e.priority}</priority>`,
                '  </url>',
            ].join('\n'),
        )
        .join('\n')}
</urlset>
`;

export interface RenderReport {
    pages: { path: string; bytes: number }[];
    sitemapUrls: number;
}

/**
 * Render everything into `dist`.
 *
 * `lastmodFor` is injected rather than read here so the caller can supply real
 * commit dates from git — a sitemap that stamps every page with today's date on
 * every deploy teaches a crawler to ignore the field.
 */
export const renderAll = async (
    dist: string,
    lastmodFor: (source: string) => string,
): Promise<RenderReport> => {
    const [docs, articles] = await Promise.all([readHelpDocs(), readArticles()]);

    // One stylesheet for all 35 pages, content-hashed so it can be cached hard.
    const css = await readFile(path.join(HELP_DOCS, 'help-page.css'), 'utf8');
    const cssHref = `/assets/helpdoc-${createHash('sha256').update(css).digest('hex').slice(0, 8)}.css`;
    await mkdir(path.join(dist, 'assets'), { recursive: true });
    await writeFile(path.join(dist, cssHref.replace(/^\//, '')), css);

    const helpNav = navFor(docs, 'helpDoc');
    const learnNav = navFor(articles, 'learnArticle');
    const pages: { path: string; bytes: number }[] = [];
    const sitemap: SitemapEntry[] = [];

    const write = async (urlPath: string, html: string) => {
        const dir = path.join(dist, urlPath.replace(/^\/+|\/+$/g, ''));
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, 'index.html'), html);
        pages.push({ path: urlPath, bytes: html.length });
    };

    // Home is Vite's own index.html — the editor, client-rendered. It is in the
    // sitemap but never written here.
    sitemap.push({
        url: urlFor('home'),
        lastmod: lastmodFor('frontend/index.html'),
        changefreq: 'weekly',
        priority: '1.0',
    });

    // /help/
    await write(
        pathFor('help'),
        buildPage({
            meta: metaFor('help'),
            cssHref,
            nav: helpNav,
            heading: 'Yappy Documentation',
            body: indexBody(
                'YappyDraw documentation',
                'Every tool, shape and panel in YappyDraw, with the keyboard shortcuts and the scripting API for each one.',
                docs,
                'helpDoc',
            ),
        }),
    );
    sitemap.push({
        url: urlFor('help'),
        lastmod: lastmodFor('frontend/src/help-docs/help-page.tsx'),
        changefreq: 'weekly',
        priority: '0.9',
    });

    // /help/<doc>/
    for (const doc of docs) {
        await write(
            pathFor('helpDoc', doc.meta.id),
            buildPage({
                meta: metaFor('helpDoc', doc.meta),
                cssHref,
                nav: helpNav,
                activeId: doc.meta.id,
                heading: 'Yappy Documentation',
                body: doc.html,
            }),
        );
        sitemap.push({
            url: urlFor('helpDoc', doc.meta.id),
            lastmod: lastmodFor(doc.source),
            changefreq: 'monthly',
            priority: '0.8',
        });
    }

    // /learn/ and its articles
    if (articles.length) {
        await write(
            pathFor('learn'),
            buildPage({
                meta: metaFor('learn'),
                cssHref,
                nav: learnNav,
                heading: 'Learn',
                body: indexBody(
                    'Learn to draw technical diagrams',
                    'Long-form guides that teach the drawing, not the tool. Every example is a real drawing you can open and edit.',
                    articles,
                    'learnArticle',
                ),
            }),
        );
        sitemap.push({
            url: urlFor('learn'),
            lastmod: lastmodFor(articles[0].source),
            changefreq: 'monthly',
            priority: '0.8',
        });

        for (const article of articles) {
            await write(
                pathFor('learnArticle', article.meta.id),
                buildPage({
                    meta: metaFor('learnArticle', article.meta),
                    cssHref,
                    nav: learnNav,
                    activeId: article.meta.id,
                    heading: 'Learn',
                    body: article.html,
                }),
            );
            sitemap.push({
                url: urlFor('learnArticle', article.meta.id),
                lastmod: lastmodFor(article.source),
                changefreq: 'monthly',
                priority: '0.9',
            });
        }
    }

    // The examples index is a real page. The individual `/examples/<id>/`
    // previews stay client-rendered and are NOT published: a thin generated page
    // per template is exactly the scaled-content pattern §6/D2 refuses, and no
    // page beats a noindex page.
    const exampleNav: NavItem[] = exampleTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        category: t.category,
        href: pathFor('example', t.id),
    }));
    const exampleCategories = [...new Set(exampleTemplates.map((t) => t.category))];
    const exampleBody =
        `<header class="doc-header"><h1>Diagram examples and templates</h1>` +
        `<p class="doc-intro">Ready-made drawings you can open in the editor and change — nothing is locked, ` +
        `and nothing is uploaded anywhere.</p></header>` +
        exampleCategories
            .map((category) => {
                const rows = exampleTemplates
                    .filter((t) => t.category === category)
                    .map(
                        (t) =>
                            `<tr><td><a href="${pathFor('example', t.id)}">${t.icon} ${escapeText(t.name)}</a></td>` +
                            `<td>${escapeText(t.description)}</td></tr>`,
                    )
                    .join('');
                return `<section class="doc-section" id="${slug(category)}"><h2>${escapeText(category)}</h2>` +
                    `<table class="api-table"><thead><tr><th>Template</th><th>What it shows</th></tr></thead><tbody>${rows}</tbody></table></section>`;
            })
            .join('');

    await write(
        pathFor('examples'),
        buildPage({
            meta: metaFor('examples'),
            cssHref,
            nav: exampleNav,
            heading: 'Examples',
            body: exampleBody,
        }),
    );
    sitemap.push({
        url: urlFor('examples'),
        lastmod: lastmodFor('frontend/src/examples/examples-page.tsx'),
        changefreq: 'monthly',
        priority: '0.6',
    });

    for (const legal of ['privacy-policy.html', 'terms-of-service.html']) {
        sitemap.push({
            url: `${SITE}/${legal}`,
            lastmod: lastmodFor(`frontend/public/${legal}`),
            changefreq: 'yearly',
            priority: '0.3',
        });
    }

    await writeFile(path.join(dist, 'sitemap.xml'), buildSitemap(sitemap));

    return { pages, sitemapUrls: sitemap.length };
};
