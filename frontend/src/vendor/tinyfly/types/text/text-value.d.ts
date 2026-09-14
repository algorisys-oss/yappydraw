/**
 * Text animation: the string a text track shows at a moment in time.
 *
 * Pure and deterministic. "Random" scramble characters come from a hash of the
 * seed, the character's position and the current refresh step — never from
 * Math.random — so scrubbing backwards shows exactly what playing forwards did,
 * and every export of the same timeline matches.
 */
import type { TextChars, TextConfig } from '../types';
/** The characters a `chars` setting names (split by code point, so emoji work). */
export declare function charactersFor(chars: TextChars | undefined): string[];
/**
 * The text at `progress` (0–1, already eased) after `elapsedMs` of the tween.
 * Progress 0 returns `from` and progress 1 returns `to`, exactly.
 */
export declare function textAt(config: TextConfig, progress: number, elapsedMs?: number): string;
