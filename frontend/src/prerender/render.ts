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

import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { renderHelpDoc, type DocMeta } from '../help-docs/markdown';
import { pathFor, urlFor, SITE } from '../routes';
import { metaFor } from './meta';
import { buildPage, type NavItem } from './page';
import { exampleTemplates } from '../examples/templates';
import { CONTRIBUTION, benefitsUpTo } from '../data/founders';

/**
 * Front matter may carry search-facing overrides; the renderer passes them through.
 *
 * `internal` marks a document that lives in the repo but is NOT published: no page, no
 * sitemap entry, no listing, no sidebar link. Front matter is the right place for it
 * because the flag then travels with the document rather than living in a list of
 * exceptions somewhere else that the next author will not know to update.
 */
export type PageDocMeta = DocMeta & {
    seoTitle?: string;
    seoDescription?: string;
    internal?: string;
};

/** Front matter values arrive as strings, so `internal: false` must not read as true. */
const isInternal = (meta: PageDocMeta): boolean =>
    String(meta.internal ?? '').trim().toLowerCase() === 'true';

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

/**
 * Copy an article's `images/` folder next to its rendered page.
 *
 * The markdown references figures relatively (`images/00-…png`), which is what makes
 * the same file readable on GitHub, pasteable into Medium, and correct on the web. For
 * the third of those to be true the files have to exist at that path in `dist`, and
 * nothing was copying them: the article rendered with six broken images.
 *
 * Only what a browser will ask for is copied. The `.json` DSL sources and the render
 * script live beside the figures in the repo, and they are worth keeping there, but
 * shipping them would add weight to every deploy for files no page requests.
 */
const WEB_ASSET = /\.(png|jpe?g|gif|svg|webp|avif)$/i;

const copyArticleImages = async (source: string, outDir: string): Promise<number> => {
    const from = path.join(REPO, path.dirname(source), 'images');
    let names: string[];
    try {
        names = (await readdir(from)).filter((f) => WEB_ASSET.test(f));
    } catch {
        return 0; // An article without figures is normal, not an error.
    }
    if (!names.length) return 0;

    const to = path.join(outDir, 'images');
    await mkdir(to, { recursive: true });
    for (const name of names) await copyFile(path.join(from, name), path.join(to, name));
    return names.length;
};

/** Long-form articles under `/learn/`. */
export const readArticles = async (): Promise<RenderedDocument[]> => {
    const dirs = await readdir(ARTICLES, { withFileTypes: true });
    const files: string[] = [];
    for (const dir of dirs.filter((d) => d.isDirectory())) {
        const inner = await readdir(path.join(ARTICLES, dir.name));
        files.push(
            ...inner
                .filter((f) => f.endsWith('.md'))
                // An article folder is allowed to carry notes for the people who maintain
                // it. Treating a README as a `/learn/` page meant one landed in the repo
                // without front matter and took `npm run build` down for every release
                // after it, which is a steep price for a file nobody meant to publish.
                .filter((f) => !/^(README|CONTRIBUTING|NOTES)\.md$/i.test(f) && !f.startsWith('_'))
                .map((f) => path.join(ARTICLES, dir.name, f)),
        );
    }

    const rendered = await Promise.all(
        files.sort().map(async (source) => {
            const doc = renderHelpDoc(await readFile(source, 'utf8'), path.relative(REPO, source));
            return {
                meta: doc.meta as PageDocMeta,
                html: doc.html,
                source: path.relative(REPO, source),
            };
        }),
    );

    // Dropped here rather than at each use, so an internal document cannot reach the page
    // writer, the sitemap, the /learn/ index or the sidebar by being missed in one of them.
    return rendered.filter((doc) => !isInternal(doc.meta));
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
/**
 * The /founders/ page body.
 *
 * Static HTML with no form and no payment SDK: the button is a link to a Razorpay
 * Payment Page that Razorpay hosts, which is also where the amount, the payer's name
 * and their email are collected. Nothing here needs a server.
 *
 * ONE STATE, NOT THREE. An earlier draft had the page open and close on published
 * dates. It cannot: this file runs at BUILD time and its output is frozen into static
 * HTML, so a window would appear to shut only on the next deploy. What is left is the
 * honest version — a floor, two published thresholds, and no claim about time at all.
 * The only conditional here is whether a checkout URL is configured.
 */
const foundersBody = (checkoutUrl: string): string => {
    const inr = (n: number) => `&#8377;${n.toLocaleString('en-IN')}`;
    const usd = (n: number) => `&#36;${n}`;
    // Rupees first and unqualified, dollars marked approximate: the charge is INR, and a
    // payer's own bank decides what that costs them. See data/founders.ts on `minUsd`.
    const from = (t: { minInr: number; minUsd: number }) => `${inr(t.minInr)} or more (about ${usd(t.minUsd)})`;

    // Tiers are authored as what each ADDS; a reader wants the whole of what they get, so
    // `benefitsUpTo` flattens them here. Rendered from the data rather than written out, so a
    // threshold change in data/founders.ts cannot leave the copy quietly disagreeing with it.
    const tiers = CONTRIBUTION.tiers.map((tier, i) => {
        const benefits = benefitsUpTo(i).map((b) => `<li>${escapeText(b)}</li>`).join('');
        return `<h2>${escapeText(tier.name)} &mdash; ${from(tier)}</h2>
    <ul class="founders-benefits">${benefits}</ul>`;
    }).join('\n    ');

    // With no URL configured the page still renders and simply does not offer to sell. A dead
    // button is worse than an absent one: it takes a decision the reader has already made and
    // wastes it. See config/support.ts for why no URL is ever committed to the source.
    const cta = checkoutUrl
        ? `<a class="founders-cta" href="${escapeText(checkoutUrl)}" rel="noopener noreferrer">Contribute &middot; choose your amount</a>
    <p class="founders-fineprint">You choose the amount on the next page, from ${inr(CONTRIBUTION.minInr)}
    upwards, inclusive of all applicable taxes. One payment, not a subscription: nothing recurs and
    there is nothing to cancel. <strong>Payment is taken in rupees.</strong> Cards issued outside
    India work, and the dollar figures above are approximate &mdash; your bank converts at its own
    rate, so what you are charged will be close to them rather than exactly them.</p>`
        : '<p class="founders-soldout">Contributions are not open yet. Check back shortly.</p>';

    return `<header class="doc-header">
    <h1>Contribute to YappyDraw</h1>
    <p class="doc-intro">YappyDraw is free and open source, and it stays that way. This is how the work gets paid for.</p>
  </header>
  <section class="doc-section founders">
    <p>There is one page and one payment, and you decide the amount &mdash; anything from
    ${inr(CONTRIBUTION.minInr)} (about ${usd(CONTRIBUTION.minUsd)}) upwards. Give what the thing
    is worth to you. Two amounts are worth knowing about, because they come with something in
    return.</p>
    ${tiers}
    ${cta}
    <p class="founders-fineprint">Names are published only if you ask us to when you pay, and you
    can use any name you like or stay anonymous. Ask and we will take it down.</p>
    <h2>About the collaboration server</h2>
    <p>Collaboration is being built and is <strong>not available yet</strong>, so nothing on this
    page is offering it today. When it arrives, it works like this, and it is worth reading before
    you pay rather than after.</p>
    <p><strong>Every feature in the app stays free for everyone, always &mdash; collaboration
    included.</strong> There is no Pro build, no licence check and no feature flag: the
    collaboration client ships in the ordinary AGPL app, and anyone at all can point it at a server
    of their own and work together without paying anyone anything.</p>
    <p>What costs money is the <em>server we run</em>. Hosting real-time collaboration is a bill
    that arrives every month for every active person on it, and that is the part a payment covers.
    <strong>Founding members get a permanent discount on it</strong> when it launches. We are not
    promising it free, because a single payment cannot honestly fund a cost that recurs every
    month for as long as you use it &mdash; and a promise we would have to withdraw later is worth
    less than a smaller one we can keep.</p>
    <p><strong>Founding members also get the server's source.</strong> The app you are using is
    AGPL and public already; the collaboration server is a separate program, and founding members
    get access to its source once it exists, so you can read it, audit it and run it yourself
    rather than take our word for what it does with your drawings.</p>
    <h2>About the desktop app</h2>
    <p><strong>The YappyDraw client is free.</strong> The web app is AGPL, it always will be, and
    nothing in it is behind a payment.</p>
    <p><strong>Desktop builds are extended to founding members</strong> &mdash; packaged, signed
    apps for macOS, Windows and Linux, ready to install. The desktop source is in the same public
    repository as everything else, so anyone can build it themselves; what a founding place gets
    you is the build, already done.</p>
    <h2>What you are not buying</h2>
    <p>A tier in the software. There is no Pro version and there is no feature behind a payment,
    now or later. YappyDraw is <a href="https://github.com/algorisys-oss/yappydraw" rel="noopener noreferrer">AGPL-3.0</a>,
    so anyone can read the app's source, fork it, and run it without paying anyone anything &mdash;
    that is true of the collaboration client too. The one thing a contribution buys that a fork
    cannot take is source access to the <em>collaboration server</em>, which is a separate
    program and not part of the AGPL app. Everything else you are funding is the work continuing,
    and what you get back is recognition, access and a say in it.</p>
    <h2>Where the money goes</h2>
    <p>To the people actively working on YappyDraw: developers, artists and testers. None of it is
    held back as profit. Payments are handled by Razorpay; nothing about your drawings is involved,
    and they never leave your browser.</p>
    <h2>Refunds and delivery</h2>
    <p>A contribution is a one-off payment, not a subscription: nothing recurs and there is
    nothing to cancel. Because a founding place promises something in return, you can change your
    mind: email support@algorisys.com within 7 days for a full refund, no reason needed. Benefits
    are delivered by email within two working days of payment. The
    <a href="/refund-policy.html">Refund &amp; Cancellation Policy</a> and the
    <a href="/delivery-policy.html">Delivery Policy</a> have the detail.</p>
    <h2>What we do with your details</h2>
    <p>Razorpay collects your name, email and phone number to take the payment, and passes them to
    us. We use them for one thing: reaching you about your contribution, which means the community
    invite, early-access notes and the occasional roadmap vote. We do not sell them, we do not pass
    them to anyone else, and there is an unsubscribe link on everything we send. Ask us and we will
    delete you from the list, which does not affect anything you have already paid for. The
    <a href="/privacy-policy.html">privacy policy</a> has the full version.</p>
  </section>`;
};

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

    // /founders/ — a single standalone page, always emitted so the URL is never a 404.
    // The checkout is a Razorpay PAYMENT PAGE, not the razorpay.me link used for general
    // support: only a Payment Page carries custom fields, and its CSV export is how the
    // founder list gets built. With the variable unset the page still renders and simply
    // does not offer to sell, rather than shipping a dead button.
    await write(
        pathFor('founders'),
        buildPage({
            meta: metaFor('founders'),
            cssHref,
            // No sidebar: this is a standalone page, not part of the help set, and a
            // shape list beside a payment page is only somewhere else to click.
            nav: [],
            heading: 'Contribute',
            body: foundersBody(process.env.VITE_SUPPORT_FOUNDERS_URL ?? ''),
        }),
    );
    sitemap.push({
        url: urlFor('founders'),
        lastmod: lastmodFor('frontend/src/data/founders.ts'),
        changefreq: 'weekly',
        priority: '0.7',
    });

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
            // The figures the page references, copied to the path the markdown asks for.
            await copyArticleImages(
                article.source,
                path.join(dist, pathFor('learnArticle', article.meta.id).replace(/^\/+|\/+$/g, '')),
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
