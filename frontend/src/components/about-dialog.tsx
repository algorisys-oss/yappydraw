/**
 * "About YappyDraw" — opened from the main menu, the command palette, or
 * `window.Yappy.showAbout()`.
 *
 * Version, authorship, licence and the handful of links people actually go looking
 * for when they want to know what this thing is. Static content only: no network, no
 * state to keep, nothing that can fail.
 *
 * Names are NOT translated (i18n plan §3.3, same rule as product and standard names):
 * "Rajesh Pillai" and "Algorisys Technologies Pvt. Ltd." read the same in every locale.
 * Only the sentence around them is a translated string.
 */
import { type Component, Show, createSignal, createEffect, onCleanup } from 'solid-js';
import { X, Info, ExternalLink, Heart } from 'lucide-solid';
import { t } from '../i18n';
import { openWhatsNew } from './whats-new-dialog';
import pkg from '../../../package.json';
import './about-dialog.css';

const [aboutOpen, setAboutOpen] = createSignal(false);
export const isAboutOpen = aboutOpen;
export function openAbout(): void { setAboutOpen(true); }
export function closeAbout(): void { setAboutOpen(false); }

/**
 * The artists who put the app through real work — the drawings that find the bugs the
 * specs never do. Names and handles are not translated, and are shown in the order given.
 */
const ARTISTS = [
    { name: 'Anshika Shukla', handle: '@anshikashuklaarts', href: 'https://www.instagram.com/anshikashuklaarts/' },
    { name: 'Shriraj Naikwadi', handle: '@shrirajnaikwadi', href: 'https://www.instagram.com/shrirajnaikwadi' },
];

/** The links are the app's own public pages — no tracking, no third parties. */
const LINKS = [
    { href: 'https://yappydraw.com', label: 'yappydraw.com' },
    { href: 'https://github.com/algorisys-oss/yappydraw', label: 'github.com/algorisys-oss/yappydraw' },
    { href: 'https://www.algorisys.com', label: 'algorisys.com' },
];

const AboutDialog: Component = () => {
    const version = pkg.version;

    const onKey = (e: KeyboardEvent) => {
        if (aboutOpen() && e.key === 'Escape') closeAbout();
    };
    createEffect(() => {
        if (aboutOpen()) document.addEventListener('keydown', onKey);
        else document.removeEventListener('keydown', onKey);
    });
    onCleanup(() => document.removeEventListener('keydown', onKey));

    return (
        <Show when={aboutOpen()}>
            <div class="about-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAbout(); }}>
                <div class="about-modal" role="dialog" aria-modal="true" aria-label={t('about.title')}>
                    <div class="about-head">
                        <div class="about-title">
                            <Info size={18} />
                            <span>{t('about.title')}</span>
                        </div>
                        <button class="about-close" onClick={closeAbout} aria-label={t('about.close')}>
                            <X size={18} />
                        </button>
                    </div>

                    <div class="about-body">
                        <div class="about-brand">
                            <span class="about-wordmark">
                                <span class="about-wordmark-yappy">Yappy</span><span class="about-wordmark-draw">Draw</span>
                            </span>
                            <button
                                class="about-version"
                                title={t('about.whatsNewHint')}
                                onClick={() => { closeAbout(); openWhatsNew(); }}
                            >
                                v{version}
                            </button>
                        </div>

                        <p class="about-tagline">{t('about.tagline')}</p>

                        <dl class="about-facts">
                            <dt>{t('about.developedBy')}</dt>
                            <dd>Rajesh Pillai</dd>

                            <dt>{t('about.supportedBy')}</dt>
                            <dd>Algorisys Technologies Pvt. Ltd.</dd>

                            <dt>{t('about.licence')}</dt>
                            <dd>AGPL-3.0-only</dd>
                        </dl>

                        <div class="about-artists">
                            <div class="about-artists-head">{t('about.artists')}</div>
                            <p class="about-artists-note">{t('about.artistsNote')}</p>
                            <div class="about-artist-list">
                                {ARTISTS.map((a) => (
                                    <a href={a.href} target="_blank" rel="noopener noreferrer">
                                        <span class="about-artist-name">{a.name}</span>
                                        <span class="about-artist-handle">{a.handle}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div class="about-links">
                            {LINKS.map((link) => (
                                <a href={link.href} target="_blank" rel="noopener noreferrer">
                                    {link.label}
                                    <ExternalLink size={13} />
                                </a>
                            ))}
                        </div>

                        <p class="about-revenue">
                            <Heart size={13} />
                            <span>{t('about.revenue')}</span>
                        </p>

                        <p class="about-privacy">{t('about.privacy')}</p>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default AboutDialog;
