/**
 * The `<head>` of every prerendered page (plan §S3/§S4).
 *
 * One function, so the static page and anything that later patches the head on
 * client-side navigation cannot disagree — the failure mode being a canonical
 * that says one thing to a crawler and another to a browser.
 *
 * Titles and descriptions are written for the query, not for the sidebar.
 * "BPMN Documentation" describes the page; "How to draw a BPMN diagram online"
 * is what somebody types. A document can override both from its front matter
 * (`seoTitle` / `seoDescription`) when the generated pair is not the phrase
 * people search for.
 */

import { SITE, urlFor, type RouteKey } from '../routes';
import type { DocMeta } from '../help-docs/markdown';

export interface PageMeta {
    title: string;
    description: string;
    canonical: string;
    ogType: 'website' | 'article';
    /** Structured data blocks, serialized into one `<script type="application/ld+json">` each. */
    jsonLd: Record<string, unknown>[];
    noindex: boolean;
}

const SITE_NAME = 'YappyDraw';

/** The application itself, referenced by the doc pages as the thing they document. */
export const SOFTWARE_LD = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: `${SITE}/`,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    description:
        'Free online whiteboard and diagram editor for flowcharts, mindmaps, wireframes, UML and BPMN. Runs in the browser; drawings stay on your machine.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const breadcrumb = (trail: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
    })),
});

/** The sidebar descriptions are labels, not sentences — several end without a full stop. */
const sentence = (text: string): string => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** Trimmed to what a search result actually shows, so nothing important is cut. */
const clamp = (text: string, max = 158): string =>
    text.length <= max ? text : `${text.slice(0, max - 1).replace(/[\s,;:—-]+$/, '')}…`;

export const metaFor = (
    key: RouteKey,
    doc?: DocMeta & { seoTitle?: string; seoDescription?: string },
): PageMeta => {
    switch (key) {
        case 'help':
            return {
                title: `YappyDraw documentation — how to draw diagrams, shapes and sketches`,
                description: clamp(
                    'Documentation for every YappyDraw tool and shape: flowcharts, UML, BPMN, mindmaps, wireframes, sketchnotes, vector paths, animation and the scripting API.',
                ),
                canonical: urlFor('help'),
                ogType: 'website',
                jsonLd: [
                    SOFTWARE_LD,
                    breadcrumb([
                        { name: SITE_NAME, url: `${SITE}/` },
                        { name: 'Documentation', url: urlFor('help') },
                    ]),
                ],
                noindex: false,
            };

        case 'helpDoc': {
            if (!doc) throw new Error('metaFor("helpDoc") needs the document metadata');
            return {
                title: doc.seoTitle ?? `${doc.name} — YappyDraw documentation`,
                description: clamp(
                    doc.seoDescription ?? `${sentence(doc.description)} Free, in your browser, no signup.`,
                ),
                canonical: urlFor('helpDoc', doc.id),
                ogType: 'article',
                jsonLd: [
                    {
                        '@context': 'https://schema.org',
                        '@type': 'TechArticle',
                        headline: doc.seoTitle ?? doc.name,
                        description: doc.seoDescription ?? doc.description,
                        url: urlFor('helpDoc', doc.id),
                        inLanguage: 'en',
                        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE}/` },
                        about: { '@type': 'SoftwareApplication', name: SITE_NAME },
                    },
                    breadcrumb([
                        { name: SITE_NAME, url: `${SITE}/` },
                        { name: 'Documentation', url: urlFor('help') },
                        { name: doc.name, url: urlFor('helpDoc', doc.id) },
                    ]),
                ],
                noindex: false,
            };
        }

        case 'learn':
            return {
                title: 'Learn to draw technical diagrams — free guides',
                description: clamp(
                    'Practical guides to drawing technical diagrams: architecture, flowcharts, sequence diagrams, DFDs, component and ER diagrams — with drawings you can open and edit.',
                ),
                canonical: urlFor('learn'),
                ogType: 'website',
                jsonLd: [
                    breadcrumb([
                        { name: SITE_NAME, url: `${SITE}/` },
                        { name: 'Learn', url: urlFor('learn') },
                    ]),
                ],
                noindex: false,
            };

        case 'learnArticle': {
            if (!doc) throw new Error('metaFor("learnArticle") needs the article metadata');
            return {
                title: doc.seoTitle ?? `${doc.name} — YappyDraw`,
                description: clamp(doc.seoDescription ?? doc.description),
                canonical: urlFor('learnArticle', doc.id),
                ogType: 'article',
                jsonLd: [
                    {
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: doc.seoTitle ?? doc.name,
                        description: doc.seoDescription ?? doc.description,
                        url: urlFor('learnArticle', doc.id),
                        inLanguage: 'en',
                        publisher: { '@type': 'Organization', name: 'Algorisys Technologies' },
                    },
                    breadcrumb([
                        { name: SITE_NAME, url: `${SITE}/` },
                        { name: 'Learn', url: urlFor('learn') },
                        { name: doc.name, url: urlFor('learnArticle', doc.id) },
                    ]),
                ],
                noindex: false,
            };
        }

        case 'founders':
            return {
                title: 'Become a YappyDraw Founding Supporter',
                description: clamp(
                    'Fund the work behind YappyDraw. Founder badge, early access, a vote on the roadmap and the private founder community. YappyDraw stays free and open source for everyone.',
                ),
                canonical: urlFor('founders'),
                ogType: 'website',
                jsonLd: [
                    breadcrumb([
                        { name: SITE_NAME, url: `${SITE}/` },
                        { name: 'Founding Supporters', url: urlFor('founders') },
                    ]),
                ],
                noindex: false,
            };

        case 'examples':
            return {
                title: 'Diagram examples and templates — free to open and edit',
                description: clamp(
                    'Ready-made flowcharts, mindmaps, sequence and BPMN diagrams, cloud architecture and wireframes. Open one in the editor and change anything.',
                ),
                canonical: urlFor('examples'),
                ogType: 'website',
                jsonLd: [
                    breadcrumb([
                        { name: SITE_NAME, url: `${SITE}/` },
                        { name: 'Examples', url: urlFor('examples') },
                    ]),
                ],
                noindex: false,
            };

        default:
            throw new Error(`No page metadata for route "${key}" — it is not prerendered`);
    }
};
